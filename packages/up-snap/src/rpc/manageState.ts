import { ManageStateRequest } from '../interface';
import { ManageStateOperation } from '@metamask/rpc-methods'

export async function manageState(
  params: ManageStateRequest,
) {
  const result = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: params.type as ManageStateOperation,
      newState: params.data
    },
  });
  return result;
}
