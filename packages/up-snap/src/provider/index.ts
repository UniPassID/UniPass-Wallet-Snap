import { BundledExecuteCall, MainExecuteCall } from '@unipasswallet/wallet';
import { BigNumber } from 'ethers';
import { BigNumberParser } from '../util';
import {
  TransactionProps,
  UnipassWalletProps,
} from './interface/unipassWalletProvider';
import {
  innerGenerateTransferTx,
  sendTransaction,
  operateToRawExecuteCall,
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
  ): Promise<{
    execute: BundledExecuteCall | MainExecuteCall;
    chainId: number;
    nonce: BigNumber;
}> {
    BigNumberParser(props)
    const { tx, chain, fee, keyset, signFunc } = props;
    tx.value = BigNumber.from(tx.value);
    const _chain = chain ?? 'polygon';
    const generatedTx = await innerGenerateTransferTx(tx, _chain, this.config, keyset, fee);

    const execute = await operateToRawExecuteCall(generatedTx);

    return sendTransaction(execute, chain, this.config, props.signFunc);
  }
}


