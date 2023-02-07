import { SnapProvider } from '@metamask/snap-types';
import { ManageStateRequest } from '../interface';

export async function manageState(
  params: ManageStateRequest,
  wallet: SnapProvider
) {
  const result = await wallet.request({
    method: 'snap_manageState',
    params: [params.type, params.data],
  });
  return result;
}
