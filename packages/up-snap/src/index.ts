import { SnapsGlobalObject} from '@metamask/snaps-types';
import {
  ManageStateRequest,
  RpcRequest,
  SignRequest,
  SendTransactionRequest,
  MasterKeyAddressRequest,
} from './interface';
import { getMasterKeyAddress } from './rpc/getMasterKeyAddress';
import { signMessage } from './rpc/signMessage';
import { manageState } from './rpc/manageState';
import { sendTransaction } from './rpc/sendTransaction';

declare let snap: SnapsGlobalObject;

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  switch (request.method) {
    case 'up_getMasterKeyAddress':
      return await getMasterKeyAddress(request.params! as MasterKeyAddressRequest);
    case 'up_signMessage':
      return await signMessage(request.params! as SignRequest);
    case 'up_manageState':
      return await manageState(request.params! as ManageStateRequest);
    case 'up_sendTransaction':
      return await sendTransaction(
        request.params! as SendTransactionRequest);
    default:
      throw new Error('Method not found.');
  }
};
