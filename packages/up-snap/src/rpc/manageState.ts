import { ManageStateRequest } from '../interface';

export async function manageState(
  params: ManageStateRequest,
) {
  const param = {
    operation: params.type,
    newState: params.data
  }
  // newState set to undefined will make crash, so need to delete
  if (!param.newState) {
    delete param.newState
  }
 const result = await snap.request({
    method: 'snap_manageState',
    params: param,
  });
  return result
}
