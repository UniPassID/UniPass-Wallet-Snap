import Dexie from 'dexie'
import { AccountInfo } from './oauth_login'
import { getOAuthUserInfo } from './storages'
import { useUserStore } from './user'

const dbName = 'UniPassWalletIndexDB_v2'
const db = new Dexie(dbName)
db.version(1).stores({ users: 'email_provider' })

interface DBProps {
  getAccountInfo: (exit?: boolean) => Promise<AccountInfo | undefined>
  setAccountInfo: (account: AccountInfo) => Promise<void>
  clearAccountInfo: () => Promise<void>
}

const genUserKey = () => {
  const oauthUserInfo = getOAuthUserInfo()
  if (oauthUserInfo) {
    const { email, oauth_provider } = oauthUserInfo
    return `${email}_${oauth_provider}`
  }
  return ''
}

const DB: DBProps = {
  async getAccountInfo(exit = true) {
    const userStore = useUserStore()
    try {
      const _account_info = (await db.table('users').get(genUserKey())) as AccountInfo
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
      await db.table('users').put({ ...account, email_provider: genUserKey() })
    } catch (err) {
      console.log(err)

      return undefined
    }
  },
  async clearAccountInfo() {
    try {
      const res = await db.table('users').delete(genUserKey())
      return res
    } catch (err) {
      return undefined
    }
  },
}

export default DB
