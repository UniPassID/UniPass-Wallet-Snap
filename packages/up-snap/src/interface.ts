import { TransactionProps, UnipassWalletProps } from '@unipasswallet/provider';
import { BytesLike } from 'ethers';
import { SignType } from '@unipasswallet/keys';

export type SignRequest = {
  message: string;
  from: string;
};

export type MessageRequest = {
  method: string;
  params?: SignRequest | ManageStateRequest | SendTransactionRequest;
};

export type RpcRequest = {
  origin: string;
  request: MessageRequest;
};

export type ManageStateRequest = {
  type: 'update' | 'get' | 'clear';
  data?: Record<string, unknown> | void;
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
};
