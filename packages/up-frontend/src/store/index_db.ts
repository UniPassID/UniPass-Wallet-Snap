import { manageState } from '@/service/snap-rpc'
import { AccountInfo } from './oauth_login'
import { useUserStore } from './user'

interface DBProps {
  getAccountInfo: (exit?: boolean) => Promise<AccountInfo | undefined>
  setAccountInfo: (account: AccountInfo) => Promise<void>
  clearAccountInfo: () => Promise<void>
}

const DB: DBProps = {
  async getAccountInfo(exit = true) {
    const userStore = useUserStore()
    try {
      const _account_info = (await manageState('get')) as AccountInfo
      if (!_account_info) {
        if (exit) userStore.exit()
        return
      }

      console.log('index db info')
      console.log(_account_info)

      return _account_info
    } catch (err) {
      console.log(err)
      if (exit) userStore.exit()
    }
  },
  async setAccountInfo(account: AccountInfo) {
    try {
      await manageState('update', { ...account })
    } catch (err) {
      console.log(err)

      return undefined
    }
  },
  async clearAccountInfo() {
    try {
      const res = await manageState('clear')
      return res
    } catch (err) {
      return undefined
    }
  },
}

export default DB
