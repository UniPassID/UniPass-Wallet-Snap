import { AccountInfo } from "../interface";

const DB = {
  async getAccountInfo() {
    try {
      const _account_info  = await wallet.request({
        method: 'snap_manageState',
        params: ['get'],
      });
      if (!_account_info) {
        return;
      }
      return _account_info as AccountInfo;
    } catch (err) {
      console.log(err);
    }
  },
};

export default DB;
