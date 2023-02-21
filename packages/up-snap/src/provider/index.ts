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
    console.log('tx:', tx)
    tx.value = BigNumber.from(tx.value);
    const _chain = chain ?? 'polygon';
    console.log('before generatedTx', fee, fee.receiver)
    const generatedTx = await innerGenerateTransferTx(tx, _chain, this.config, keyset, fee);
    console.log('before operateToRawExecuteCall')

    const execute = await operateToRawExecuteCall(generatedTx);
    console.log('after operateToRawExecuteCall ', execute)

    return sendTransaction(execute, chain, this.config, props.signFunc);
  }
}


