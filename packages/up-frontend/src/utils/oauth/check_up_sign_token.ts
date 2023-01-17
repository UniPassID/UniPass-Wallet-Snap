import { useUserStore } from '@/store/user'
import api from '@/service/backend'
import DB from '@/store/index_db'
import jwt_decode from 'jwt-decode'
import dayjs from 'dayjs'
import { useOAuthLoginStore } from '@/store/oauth_login'
import { getOAuthUserInfo, LocalStorageService } from '@/store/storages'
import { genGoogleOAuthSignUrl, randomString } from './google-oauth'
import blockchain from '@/service/blockchain'
import { getSyncAccountDigestMessage } from './aws-config'
import { IdTokenParams } from './parse_hash'
import { handleWrongAccount } from './wrong-oauth'

export type OAuthCallBack = () => Promise<void>

const checkNeedOAuth = (cb: OAuthCallBack) => {
  const needOAuth = checkUpSignToken()
  if (needOAuth) {
    showOAuthConfirm(cb)
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

export const showOAuthConfirm = (cb: OAuthCallBack, type?: 'upSignToken' | 'multiSync') => {
  const userStore = useUserStore()
  userStore.showOAuthCallback = cb
  if (type === 'multiSync' && !checkUpSignToken()) {
    userStore.showTimeSelect = false
  }
  userStore.showOAuth = true
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

export const clearUpSignToken = () => {
  const oauthUserInfo = getOAuthUserInfo()
  if (!oauthUserInfo) {
    useUserStore().exit()
    return undefined
  }
  const { up_sign_token = '' } = oauthUserInfo
  const decoded = jwt_decode(up_sign_token) as any
  if (decoded && decoded.isDisposable) {
    LocalStorageService.set(
      'OAUTH_INFO',
      JSON.stringify({ ...oauthUserInfo, up_sign_token: undefined }),
    )
  }
}

export const updateUpSignToken = async (idToken: string, cb: OAuthCallBack) => {
  const { sub: newSub, nonce } = jwt_decode<IdTokenParams>(idToken)
  const oauthInfo = getOAuthUserInfo()
  if (newSub !== oauthInfo?.sub) {
    handleWrongAccount(oauthInfo?.email ?? '', cb)
    return
  }
  let res: any
  const duration = parseInt(LocalStorageService.get('UP_SIGN_TOKEN_DURATION') || '0')
  if (nonce.startsWith('update-up-sign-token')) {
    res = await api.signToken({
      idToken,
      duration,
    })
  } else {
    res = await api.sendSyncOAuthSig({ idToken, duration })
  }

  const oauthUserInfo = getOAuthUserInfo()
  if (res.ok && oauthUserInfo) {
    const { authorization, upSignToken } = res.data
    LocalStorageService.set(
      'OAUTH_INFO',
      JSON.stringify({ ...oauthUserInfo, authorization, up_sign_token: upSignToken }),
    )
  } else {
    useUserStore().exit()
  }
}

export const handleOAuthForSetGuardian = async () => {
  LocalStorageService.set('GUARDIAN_ORIGIN_STATE', true)
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { email, oauth_provider } = accountInfo
  const subject = genUpSignTokenSubject()
  if (oauth_provider === 0) {
    // google oauth
    window.location.href = genGoogleOAuthSignUrl(subject, email)
  } else {
    const oauthLoginStore = useOAuthLoginStore()
    await oauthLoginStore.auth0Login(undefined, email, subject, 'openid')
  }
}

export const checkUpSignTokenForSetGuardian = async () => {
  return checkNeedOAuth(handleOAuthForSetGuardian)
}

export const handleOAuthForCancelRecovery = async () => {
  LocalStorageService.set('CANCEL_RECOVERY_ORIGIN_STATE', true)
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { email, oauth_provider } = accountInfo
  const subject = genUpSignTokenSubject()
  if (oauth_provider === 0) {
    // google oauth
    window.location.href = genGoogleOAuthSignUrl(subject, email)
  } else {
    const oauthLoginStore = useOAuthLoginStore()
    await oauthLoginStore.auth0Login(undefined, email, subject, 'openid')
  }
}

export const checkUpSignTokenForCancelRecovery = async () => {
  return checkNeedOAuth(handleOAuthForCancelRecovery)
}

export const handleOAuthForSignMessage = async (signStore: string) => {
  LocalStorageService.set('SIGN_MESSAGE_ORIGIN_STATE', signStore)
  const userStore = useUserStore()
  LocalStorageService.set(
    'SIGN_MESSAGE_APP_SETTING',
    JSON.stringify({ chain: userStore.chain, appIcon: userStore.appIcon }),
  )
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { email, oauth_provider } = accountInfo
  const subject = genUpSignTokenSubject()
  if (oauth_provider === 0) {
    // google oauth
    window.location.href = genGoogleOAuthSignUrl(subject, email)
  } else {
    const oauthLoginStore = useOAuthLoginStore()
    await oauthLoginStore.auth0Login(undefined, email, subject, 'openid')
  }
}

export const checkUpSignTokenForSignMessage = async (signStore: string) => {
  return checkNeedOAuth(() => handleOAuthForSignMessage(signStore))
}

export const handleOAuthForSendTransaction = async (
  type: 'upSignToken' | 'multiSync',
  signStore: string,
) => {
  LocalStorageService.set('SIGN_TX_ORIGIN_STATE', signStore)
  const accountInfo = await DB.getAccountInfo()
  if (!accountInfo) return
  const { email, address, oauth_provider, keyset } = accountInfo
  let subject = ''
  if (type === 'upSignToken') {
    subject = genUpSignTokenSubject()
  } else {
    const metaNonce = await blockchain.getMetaNonce(address)
    subject = await getSyncAccountDigestMessage(keyset.hash, metaNonce, address)
  }
  if (oauth_provider === 0) {
    window.location.href = genGoogleOAuthSignUrl(subject, email)
  } else {
    const oauthLoginStore = useOAuthLoginStore()
    await oauthLoginStore.auth0Login(undefined, email, subject, 'openid')
  }
}

export const checkStatusForSendTransaction = (
  type: 'upSignToken' | 'multiSync',
  signStore: string,
) => {
  showOAuthConfirm(() => handleOAuthForSendTransaction(type, signStore), type)
}

const genUpSignTokenSubject = () => {
  return `update-up-sign-token+${randomString()}`
}
