import { useUserStore } from '@/store/user'
import { OAuthUserInfo } from '@/utils/oauth/parse_hash'

const LocalStorageKeys = {
  OAUTH_INFO: '__oauth_info',
  UP_SIGN_TOKEN_DURATION: '__up_sign_token_duration',
  RECOVERY_ORIGIN_STATE: '__recovery_origin_state',
  SIGN_TX_ORIGIN_STATE: '__sign_tx_origin_state',
  GUARDIAN_ORIGIN_STATE: '__guardian_origin_state',
  CANCEL_RECOVERY_ORIGIN_STATE: '__cancel_recovery_origin_state',

  SIGN_MESSAGE_ORIGIN_STATE: '__sign_message_origin_state',
  SIGN_MESSAGE_APP_SETTING: '__sign_message_app_setting',

  AUTHORIZATION_REQUIRE_STATE: '__authorization_require_state',
  LEGACY_SIGN_WALLET_CONNECT_CLIENT: '__legacy_sign_wallet_connect_client',
  LEGACY_SIGN_WALLET_CONNECT_SESSIONS: '__legacy_sign_wallet_connect_sessions',
}

type StorageKeys = keyof typeof LocalStorageKeys

const useStorage = ($storage: Storage) => {
  const get = (key: StorageKeys) => {
    const value = $storage.getItem(LocalStorageKeys[key]) || ''
    try {
      return value
    } catch {
      return value
    }
  }

  const set = (key: StorageKeys, value: any) => {
    return $storage.setItem(LocalStorageKeys[key], value || '')
  }

  const remove = (key: StorageKeys) => {
    return $storage.removeItem(LocalStorageKeys[key])
  }

  const clearAll = () => {
    for (const itemKey in $storage) {
      if (itemKey) {
        if (['vueuse-color-scheme', 'language'].includes(itemKey)) {
          // not clear
        } else {
          $storage.removeItem(itemKey)
        }
      }
    }
  }

  return {
    get,
    set,
    remove,
    clearAll,
  }
}

const LocalStorageService = useStorage(window.localStorage || localStorage)

const getOAuthUserInfo = () => {
  const userStore = useUserStore()
  try {
    const _local_user_info = LocalStorageService.get('OAUTH_INFO')
    if (!_local_user_info) {
      return
    }
    return JSON.parse(_local_user_info) as OAuthUserInfo
  } catch (e) {
    userStore.exit()
  }
}

export { LocalStorageService, getOAuthUserInfo }
