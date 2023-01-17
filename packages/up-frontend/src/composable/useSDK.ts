import { clearStorage } from './../utils/clear'
import { useUserStore } from '@/store/user'
import { useOAuthLoginStore } from '@/store/oauth_login'
import router from '@/plugins/router'
import DB from '@/store/index_db'

export const useSDK = () => {
  const userStore = useUserStore()

  const parseSDKFromUrl = async () => {
    const search = location.search
    const oauthStore = useOAuthLoginStore()
    if (search.indexOf('google') > -1) {
      oauthStore.changeConnectType('google')
      oauthStore.loginWithGoogle()
      await clearStorage()
      await router.replace('/login')
    } else if (search.indexOf('email') > -1) {
      oauthStore.changeConnectType('email')
      await clearStorage()
      await router.replace('/login')
    }
    const _account_info = await DB.getAccountInfo(false)
    if (!_account_info) {
      await clearStorage()
      await router.replace('/login')
    } else {
      await userStore.update(_account_info)
    }
  }

  const initUserStoreFromSDK = async () => {
    const _account_info = await DB.getAccountInfo(false)
    if (!_account_info) {
      await userStore.exit()
    } else {
      await userStore.update(_account_info)
      userStore.pollNetWorth()
    }
  }

  return { parseSDKFromUrl, initUserStoreFromSDK }
}
