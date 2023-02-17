import { TransactionProps, UnipassWalletProps } from '@unipasswallet/provider';
import { BytesLike } from 'ethers';
import { SignType } from '@unipasswallet/keys';
import { Json } from '@metamask/snaps-types';

export type SignRequest = {
  message: string;
  from: string;
  email: string;
  prefix?: string;
};

export type MessageRequest = {
  method: string;
  params?: unknown;
};

export type RpcRequest = {
  origin: string;
  request: MessageRequest;
};

export type ManageStateRequest = {
  type: 'update' | 'get' | 'clear';
  data?: Record<string, Json>;
};

export type SignFunc = (
  digestHash: BytesLike,
  signType: SignType
) => Promise<string>;

export type SendTransactionRequest = {
  unipassWalletProps: UnipassWalletProps;
  transactionParams: TransactionProps & {
    signFunc: SignFunc;
  };
  email: string
};

export type MasterKeyAddressRequest = {
  email: string
}
