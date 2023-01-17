import { SnapProvider } from '@metamask/snap-types';
import { RpcRequest } from './interface';
import { getMasterKeyAddress } from './rpc/getMasterKeyAddress';
import { signMessage } from './rpc/signMessage';

declare let wallet: SnapProvider;

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  console.log('origin', origin);
  switch (request.method) {
    case 'up_getMasterKeyAddress':
      return await getMasterKeyAddress(wallet)
    case 'up_signMessage':
      return await signMessage(request.params!, wallet);
    default:
      throw new Error('Method not found.');
  }
};
