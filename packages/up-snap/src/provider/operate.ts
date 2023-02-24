import { AccountInfo } from './interface/index';
import { BigNumber, constants, ethers } from 'ethers';
import { Keyset, KeySecp256k1 } from '@unipasswallet/keys';
import { Transaction } from '@unipasswallet/transactions';
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
import { RawBundledExecuteCall, RawMainExecuteCall, RawMainExecuteTransaction } from "@unipasswallet/wallet";
import DB from './utils/index_db';
import { SignFunc } from '../interface';

export type OperateTransaction = {
  deployTx?: Transaction;
  syncAccountExecute?: RawMainExecuteCall;
  callExecute: RawMainExecuteCall;
  feeTx?: Transaction;
};

export const operateToRawExecuteCall = async (
  operateTransaction: OperateTransaction,
): Promise<RawBundledExecuteCall | RawMainExecuteCall> => {
  const { deployTx, syncAccountExecute, callExecute: callExecuteCall, feeTx } = operateTransaction;

  const user = await getUser();

  let rawExecute: RawBundledExecuteCall | RawMainExecuteCall;
  if (deployTx) {
    rawExecute = new RawBundledExecuteCall(deployTx);
  }
  if (syncAccountExecute) {
    const transaction = new RawMainExecuteTransaction({ rawExecuteCall: syncAccountExecute, target: user.address });
    if (rawExecute) {
      rawExecute = rawExecute.pushTransaction(transaction);
    } else {
      rawExecute = new RawBundledExecuteCall(transaction);
    }
  }

  let callExecute = callExecuteCall;
  if (feeTx) {
    callExecute = callExecute.pushTransaction(feeTx);
  }

  if (rawExecute) {
    const transaction = new RawMainExecuteTransaction({ rawExecuteCall: callExecute, target: user.address });
    return rawExecute.pushTransaction(transaction);
  }
  return callExecute;
};

export const innerGenerateTransferTx = async (
  tx: UniTransaction,
  chainType: ChainType,
  config: UnipassWalletProps,
  keyset: Keyset,
  fee: TransactionFee,
): Promise<OperateTransaction> => {
  const user = await getUser();
  const instance = WalletsCreator.getInstance(keyset, user.address, config);
  const wallet = instance[chainType];
  let nonce = await wallet.getNonce();

  let deployTx: Transaction;
  let syncAccountExecute: RawMainExecuteCall;

  if (chainType !== "polygon") {
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
      transactions[i] = { ...v, gasLimit: BigNumber.from(v.gasLimit._hex), value: BigNumber.from(v.value._hex) };
    });
    if (transactions.length === 1) {
      if (isNeedDeploy) {
        transactions[0].gasLimit = constants.Zero;
        transactions[0].revertOnError = true;
        [deployTx] = transactions;
      } else {
        nonce = nonce.add(1);
        syncAccountExecute = new RawMainExecuteCall(transactions, nonce, []);
      }
    } else if (transactions.length === 2) {
      transactions[0].gasLimit = constants.Zero;
      transactions[1].gasLimit = constants.Zero;
      transactions[0].revertOnError = true;
      transactions[1].revertOnError = true;
      let syncAccountTx: Transaction;
      [deployTx, syncAccountTx] = transactions;
      nonce = nonce.add(1);
      syncAccountExecute = new RawMainExecuteCall(syncAccountTx, nonce, []);
    }
  }
  const { revertOnError = true, gasLimit = BigNumber.from("0"), target, value, data = "0x00" } = tx;

  const callTx = new CallTxBuilder(revertOnError, gasLimit, target, value, data).build();

  nonce = nonce.add(1);
  const callExecute = new RawMainExecuteCall(callTx, nonce, [0]);

  const feeTx = fee ? getFeeTx(fee.receiver, fee.token, fee.value) : undefined;

  return { deployTx, syncAccountExecute, callExecute, feeTx };
};

export const getFeeTx = (to: string, feeToken: string, feeValue: BigNumber) => {
  let feeTx: Transaction;

  if (feeToken !== ADDRESS_ZERO) {
    const erc20Interface = new ethers.utils.Interface(["function transfer(address _to, uint256 _value)"]);
    const tokenData = erc20Interface.encodeFunctionData("transfer", [to, feeValue]);
    feeTx = new CallTxBuilder(true, BigNumber.from(0), feeToken, BigNumber.from(0), tokenData).build();
  } else {
    feeTx = new CallTxBuilder(true, BigNumber.from(0), to, feeValue, "0x").build();
  }
  return feeTx;
};

export const sendTransaction = async (
  tx: RawMainExecuteCall | RawBundledExecuteCall,
  chainType: ChainType,
  config: UnipassWalletProps,
  signFunc: SignFunc,
) => {
  const user = await getUser();
  let keyset = Keyset.fromJson(user.keyset.keysetJson);
  (keyset.keys[0] as KeySecp256k1).signFunc = signFunc;

  const instance = WalletsCreator.getInstance(keyset, user.address, config);
  const wallet = instance[chainType];

  const ret = await wallet.signTransactions(tx);

  return ret;
};

const getUser = async (): Promise<AccountInfo | undefined> => {
  const accountInfo = await DB.getAccountInfo();

  if (accountInfo) {
    return accountInfo;
  }
  throw new WalletError(402007);
};
