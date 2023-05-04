import { Keyset } from '@unipasswallet/keys';
import { Transaction } from '@unipasswallet/transactions';
import { OAuthUserInfo } from './index';
import { BigNumber, BytesLike, providers } from 'ethers';
import { SignFunc } from '../../interface';

type AuthChainNode =
  | 'polygon-mumbai'
  | 'eth-goerli'
  | 'bsc-testnet'
  | 'rangers-robin'
  | 'scroll-testnet'
  | 'arbitrum-testnet'
  | 'polygon-mainnet'
  | 'eth-mainnet'
  | 'bsc-mainnet'
  | 'rangers-mainnet'
  | 'arbitrum-mainnet';

type Environment = 'testnet' | 'mainnet';

type ChainType = 'polygon' | 'eth' | 'bsc' | 'rangers' | 'scroll' | 'arbitrum';

export type UrlConfig = {
  backend: string;
  relayer: {
    eth: string;
    polygon: string;
    bsc: string;
    rangers: string;
    arbitrum: string;
  };
};

interface UnipassWalletProps {
  env: Environment;
  url_config?: UrlConfig;
  oauthUserInfo?: OAuthUserInfo;
}

interface UniTransaction {
  revertOnError?: boolean;
  gasLimit?: BigNumber;
  target?: BytesLike;
  value: string;
  data?: string;
  to?: string;
  from?: string;
}

interface TransactionFee {
  value: BigNumber;
  token: string;
  receiver: string;
}

interface TransactionProps {
  keyset?: Keyset;
  tx: UniTransaction;
  fee?: TransactionFee;
  chain?: ChainType;
  timeout?: number;
  gasLimit?: BigNumber;
  signFunc: SignFunc;
}

abstract class WalletProvider {
  private constructor() {}

  /**
   * send a transaction
   * @params props: TransactionProps
   * * */
  public abstract transaction(
    props: TransactionProps
  ): Promise<providers.TransactionResponse>;
}

interface SignedTransaction {
  digest: string;
  chainId: number;
  transactions: Transaction[];
  gasLimit: BigNumber;
  nonce: BigNumber;
  signature: string;
  data: string;
  address: string;
}

export {
  SignedTransaction,
  ChainType,
  Environment,
  AuthChainNode,
  UnipassWalletProps,
  WalletProvider,
  UniTransaction,
  TransactionFee,
  TransactionProps,
};
