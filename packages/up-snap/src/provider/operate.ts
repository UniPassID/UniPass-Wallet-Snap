import { AccountInfo } from './interface/index';
import { parseEther } from 'ethers/lib/utils';
import { BigNumber, constants, ethers } from 'ethers';
import {
  ExecuteTransaction,
  BundledTransaction,
  isBundledTransaction,
} from '@unipasswallet/wallet';
import { Keyset, KeySecp256k1 } from '@unipasswallet/keys';
import { Transaction, Transactionish } from '@unipasswallet/transactions';
import { CallTxBuilder } from '@unipasswallet/transaction-builders';
import api from './api/backend';
import WalletError from './constant/error_map';
import {
  ChainType,
  TransactionFee,
  UnipassWalletProps,
  UniTransaction,
} from './interface/unipassWalletProvider';
import { WalletsCreator, getAuthNodeChain } from './utils/unipass';
import { ADDRESS_ZERO } from './constant';
import { FeeOption, Relayer } from '@unipasswallet/relayer';
import DB from './utils/index_db';
import { SignFunc } from '../interface';

export type OperateTransaction = {
  deployTx?: Transaction;
  syncAccountTx?: ExecuteTransaction;
  transaction: Transaction;
};

export const innerGenerateTransferTx = async (
  tx: UniTransaction,
  chainType: ChainType,
  config: UnipassWalletProps
): Promise<OperateTransaction> => {
  const user = await getUser();

  let deployTx: Transaction;
  let syncAccountTx: ExecuteTransaction;

  if (chainType !== 'polygon') {
    const {
      data: { transactions = [], isNeedDeploy },
    } = await api.syncTransaction({
      email: user.email,
      authChainNode: getAuthNodeChain(config.env, chainType),
    }, {
      backend: config.url_config.backend,
      oauthUserInfo: config.oauthUserInfo
    });

    transactions.forEach((v, i) => {
      transactions[i] = {
        ...v,
        gasLimit: BigNumber.from(v.gasLimit._hex),
        value: BigNumber.from(v.value._hex),
      };
    });
    if (transactions.length === 1) {
      if (isNeedDeploy) {
        transactions[0].gasLimit = constants.Zero;
        transactions[0].revertOnError = true;
        [deployTx] = transactions;
      } else {
        syncAccountTx = {
          type: 'Execute',
          transactions,
          sessionKeyOrSignerIndex: [],
          gasLimit: constants.Zero,
        };
      }
    } else if (transactions.length === 2) {
      transactions[0].gasLimit = constants.Zero;
      transactions[1].gasLimit = constants.Zero;
      transactions[0].revertOnError = true;
      transactions[1].revertOnError = true;
      [deployTx] = transactions;
      syncAccountTx = {
        type: 'Execute',
        transactions: transactions[1],
        sessionKeyOrSignerIndex: [],
        gasLimit: constants.Zero,
      };
    }
  }
  const {
    revertOnError = true,
    gasLimit = BigNumber.from('0'),
    target,
    value,
    data = '0x00',
  } = tx;

  const transaction = new CallTxBuilder(
    revertOnError,
    gasLimit,
    target,
    value,
    data
  ).build();

  return { deployTx, syncAccountTx, transaction };
};

const getFeeTx = (to: string, feeToken: string, feeValue: BigNumber) => {
  let feeTx: Transaction;

  if (feeToken !== ADDRESS_ZERO) {
    const erc20Interface = new ethers.utils.Interface([
      'function transfer(address _to, uint256 _value)',
    ]);
    const tokenData = erc20Interface.encodeFunctionData('transfer', [
      to,
      feeValue,
    ]);
    feeTx = new CallTxBuilder(
      true,
      BigNumber.from(0),
      feeToken,
      BigNumber.from(0),
      tokenData
    ).build();
  } else {
    feeTx = new CallTxBuilder(
      true,
      BigNumber.from(0),
      to,
      feeValue,
      '0x'
    ).build();
  }
  return feeTx;
};

const getFeeTxByGasLimit = async (
  feeToken: string,
  gasLimit: BigNumber,
  relayer: Relayer
) => {
  const feeOption = await getFeeOption(gasLimit, feeToken, relayer);
  const { to: receiver, amount: feeAmount } = feeOption as FeeOption;
  const feeTx = getFeeTx(receiver, feeToken, BigNumber.from(feeAmount));

  return feeTx;
};

const getFeeOption = async (
  gasLimit: BigNumber,
  token: string,
  relayer: Relayer
): Promise<FeeOption | Pick<FeeOption, 'to'>> => {
  const feeOptions = await relayer.getFeeOptions(gasLimit.toHexString());
  let feeOption: FeeOption | Pick<FeeOption, 'to'>;
  if (token === ADDRESS_ZERO) {
    feeOption = feeOptions.options.find(
      (x) =>
        !(x as FeeOption).token.contractAddress ||
        (x as FeeOption).token.contractAddress.toLowerCase() ===
          token.toLowerCase()
    );
  } else {
    feeOption = feeOptions.options.find(
      (x) =>
        !!(x as FeeOption).token.contractAddress &&
        (x as FeeOption).token.contractAddress.toLowerCase() ===
          token.toLowerCase()
    );
  }
  if (!feeOption) throw new Error(`un supported fee token ${token}`);

  return feeOption;
};

export const innerEstimateTransferGas = async (
  tx: OperateTransaction,
  chainType: ChainType,
  config: UnipassWalletProps,
  fee?: TransactionFee,
  gasLimit?: BigNumber
): Promise<ExecuteTransaction | BundledTransaction> => {
  const user = await getUser();
  const keyset = Keyset.fromJson(user.keyset.keysetJson);
  const instance = WalletsCreator.getInstance(keyset, user.address, config);
  const wallet = instance[chainType];
  const gasEstimator = instance[`${chainType}GasEstimator`];
  const nonce = await wallet.relayer.getNonce(wallet.address);

  const { deployTx, syncAccountTx } = tx;
  const { transaction } = tx;

  let feeValue: BigNumber | undefined;
  let feeTx: Transaction;
  if (fee) {
    let { token, value: tokenValue, receiver: to } = fee;
    tokenValue = BigNumber.from(tokenValue);
    if (tokenValue.eq(0)) {
      feeValue = tokenValue;
      feeTx = await getFeeTxByGasLimit(token, constants.One, wallet.relayer);
    } else {
      feeTx = getFeeTx(to, token, tokenValue);
    }
  }

  let transferExecuteTx: ExecuteTransaction;
  if (!feeTx) {
    transferExecuteTx = {
      type: 'Execute',
      transactions: [transaction],
      gasLimit: constants.Zero,
      sessionKeyOrSignerIndex: [0],
    };
  } else {
    transferExecuteTx = {
      type: 'Execute',
      transactions: [transaction, feeTx],
      gasLimit: constants.Zero,
      sessionKeyOrSignerIndex: [0],
    };
  }

  let estimatedTxs: any;
  if (deployTx) {
    estimatedTxs = {
      type: 'Bundled',
      transactions: [deployTx],
      gasLimit: constants.Zero,
    };
  }
  if (syncAccountTx) {
    if (estimatedTxs) {
      estimatedTxs.transactions.push(syncAccountTx);
    } else {
      estimatedTxs = {
        type: 'Bundled',
        transactions: [syncAccountTx],
        gasLimit: constants.Zero,
      };
    }
  }

  if (estimatedTxs) {
    estimatedTxs.transactions.push(transferExecuteTx);
  } else {
    estimatedTxs = transferExecuteTx;
  }

  if (!gasLimit) {
    if (chainType === 'rangers') {
      gasLimit = parseEther('0.001');
    } else if (isBundledTransaction(estimatedTxs)) {
      estimatedTxs = await gasEstimator.estimateBundledTxGasLimits(
        estimatedTxs,
        nonce
      );
      gasLimit = estimatedTxs.gasLimit;
    } else {
      estimatedTxs = await gasEstimator.estimateExecuteTxsGasLimits(
        estimatedTxs,
        nonce
      );
      gasLimit = estimatedTxs.gasLimit;
    }
  } else {
    estimatedTxs.gasLimit = gasLimit;
  }

  if (feeValue && feeValue.eq(0)) {
    feeTx = await getFeeTxByGasLimit(fee.token, gasLimit, wallet.relayer!);
    transferExecuteTx.transactions[
      (transferExecuteTx.transactions as Transactionish[]).length - 1
    ] = feeTx;
  }

  if (isBundledTransaction(estimatedTxs)) {
    (estimatedTxs.transactions as (ExecuteTransaction | Transactionish)[])[
      (estimatedTxs.transactions as (ExecuteTransaction | Transactionish)[])
        .length - 1
    ] = transferExecuteTx;
  } else {
    transferExecuteTx.gasLimit = gasLimit;
    estimatedTxs = transferExecuteTx;
  }
  return estimatedTxs;
};

export const sendTransaction = async (
  tx: ExecuteTransaction | BundledTransaction,
  chainType: ChainType,
  config: UnipassWalletProps,
  signFunc: SignFunc,
  feeToken?: string
) => {
  const user = await getUser();
  const keyset = Keyset.fromJson(user.keyset.keysetJson);

  (keyset.keys[0] as KeySecp256k1).signFunc = signFunc;

  const instance = WalletsCreator.getInstance(keyset, user.address, config);
  const wallet = instance[chainType];

  tx.gasLimit = BigNumber.from(tx.gasLimit);

  const res = await wallet.signTransactions(
    tx,
    [0],
    undefined,
    BigNumber.from(tx.gasLimit)
  );

  return { signedTransaction: res, feeToken: feeToken };
};

const getUser = async (): Promise<AccountInfo | undefined> => {
  const accountInfo = await DB.getAccountInfo();

  if (accountInfo) {
    return accountInfo;
  }
  throw new WalletError(402007);
};
