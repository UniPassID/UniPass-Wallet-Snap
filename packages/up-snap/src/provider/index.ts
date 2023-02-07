import { BigNumber } from 'ethers';
import {
  TransactionProps,
  UnipassWalletProps,
  SignedTransaction,
} from './interface/unipassWalletProvider';
import {
  innerGenerateTransferTx,
  innerEstimateTransferGas,
  sendTransaction,
} from './operate';

export default class UnipassWalletProvider {
  public static instance: UnipassWalletProvider;

  private config: UnipassWalletProps | undefined;

  static getInstance(props: UnipassWalletProps) {
    if (!UnipassWalletProvider.instance) {
      const ins = new UnipassWalletProvider(props);
      UnipassWalletProvider.instance = ins;
    }

    return UnipassWalletProvider.instance;
  }

  private constructor(props: UnipassWalletProps) {
    this.config = props;
  }

  public async transaction(
    props: TransactionProps
  ): Promise<{ signedTransaction: SignedTransaction; feeToken?: string }> {
    const { tx, chain, fee, keyset, timeout, gasLimit } = props;
    tx.value = BigNumber.from(tx.value);
    const _chain = chain ?? 'polygon';
    const generatedTx = await innerGenerateTransferTx(tx, _chain, this.config);
    const transactions = await innerEstimateTransferGas(
      generatedTx,
      _chain,
      this.config,
      fee,
      gasLimit
    );

    if (_chain === 'rangers') transactions.gasLimit = BigNumber.from('1000000');

    return sendTransaction(
      transactions,
      chain,
      this.config,
      props.signFunc,
      fee?.token
    );
  }
}
