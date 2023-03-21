import dayjs from 'dayjs'
import jwt_decode from 'jwt-decode'
import DB from '@/store/index_db'
import { genGoogleOAuthUrl } from './google-oauth'
import { useUserStore } from '@/store/user'
import { getOAuthUserInfo, LocalStorageService } from '@/store/storages'
import { useOAuthLoginStore } from '@/store/oauth_login'
import { useChainAccountStore } from '@/store/chain-account'

export type OAuthCallBack = () => Promise<void>

const checkNeedOAuth = (cb: OAuthCallBack, checkAuth = true) => {
  const needOAuth = checkAuth ? checkAuthorization() : checkUpSignToken()
  if (needOAuth) {
    const userStore = useUserStore()
    userStore.showOAuthCallback = cb
    userStore.showTimeSelect = false
    userStore.showOAuth = true
  }

  return needOAuth
}

export const checkUpSignToken = () => {
  const up_sign_token = getUpSignToken()
  let needOAuth = false
  if (up_sign_token) {
    const decoded = jwt_decode(up_sign_token) as any
    if (dayjs(decoded.exp * 1000).isBefore(dayjs())) needOAuth = true
  } else {
    needOAuth = true
  }
  return needOAuth
}

export const getUpSignToken = () => {
  const oauthUserInfo = getOAuthUserInfo()
  if (!oauthUserInfo) {
    useUserStore().exit()
    return undefined
  }

  const { up_sign_token } = oauthUserInfo
  return up_sign_token
}

export const checkAuthorization = () => {
  const authorization = getAuthorization()
  let needOAuth = false
  if (authorization) {
    const decoded = jwt_decode(authorization) as any
    if (dayjs(decoded.exp * 1000).isBefore(dayjs())) needOAuth = true
  } else {
    needOAuth = false
  }
  return needOAuth
}

export const getAuthorization = () => {
  const oauthUserInfo = getOAuthUserInfo()
  if (!oauthUserInfo) {
    useUserStore().exit()
    return undefined
  }

  const { authorization } = oauthUserInfo
  return authorization
}

export const handleOAuthForAuthorizationExpired = async () => {
  LocalStorageService.set('AUTHORIZATION_REQUIRE_STATE', true)
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { email, oauth_provider } = accountInfo
  if (oauth_provider === 0) {
    // google oauth
    window.location.href = genGoogleOAuthUrl(email)
  } else {
    const oauthLoginStore = useOAuthLoginStore()
    await oauthLoginStore.auth0Login('login', email)
  }
}

export const checkAuthorizationExpired = async () => {
  return checkNeedOAuth(handleOAuthForAuthorizationExpired)
}

export const checkUpSignTokenExpiredForConnectPage = async () => {
  return checkNeedOAuth(handleOAuthForAuthorizationExpired, false)
}

export const checkKeysetHash = async () => {
  const chainAccountStore = useChainAccountStore()
  const userStore = useUserStore()
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { address, keyset } = accountInfo
  await chainAccountStore.fetchAccountInfo(address, true, keyset.hash)
  if (keyset.hash !== chainAccountStore.keysetHash) {
    userStore.exit()
  }
}
