import { SnapProvider } from '@metamask/snap-types';
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

declare let wallet: SnapProvider;

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  switch (request.method) {
    case 'up_getMasterKeyAddress':
      return await getMasterKeyAddress(request.params! as MasterKeyAddressRequest, wallet);
    case 'up_signMessage':
      return await signMessage(request.params! as SignRequest, wallet);
    case 'up_manageState':
      return await manageState(request.params! as ManageStateRequest, wallet);
    case 'up_sendTransaction':
      return await sendTransaction(
        request.params! as SendTransactionRequest,
        wallet,
      );
    default:
      throw new Error('Method not found.');
  }
};
