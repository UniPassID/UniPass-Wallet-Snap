import jwt_decode from 'jwt-decode'
import { ElMessageBox } from 'element-plus'
import i18n from '@/plugins/i18n'
import { hashMessage } from 'ethers/lib/utils'
import { accountTypeDict, upGA } from './../useUniPass'
import { useRecoveryStore } from '@/store/recovery'
import router from '@/plugins/router'
import api from '@/service/backend'
import { LocalStorageService } from '@/store/storages'
import { useSignStore } from '@/store/sign'
import blockchain from '@/service/blockchain'
import { useOAuthLoginStore } from '@/store/oauth_login'
import { useUserStore } from '@/store/user'
import {
  handleOAuthForCancelRecovery,
  handleOAuthForSetGuardian,
  updateUpSignToken,
} from '@/utils/oauth/check_up_sign_token'
import { checkKeysetHash } from './check_authorization'

const { t: $t } = i18n.global

export interface IdTokenParams {
  email: string
  name: string
  iss: string
  exp: number
  sub: string
  nonce: string
}

export enum OAuthProvider {
  GOOGLE,
  AUTH0,
}

interface UnipassInfo {
  keyType?: number
  keyset: string
  address: string
  keystore: string
}

export interface OAuthUserInfo {
  sub: string
  email: string
  id_token: string
  oauth_provider: OAuthProvider
  authorization: string
  expires_at: string
  up_sign_token?: string
  unipass_info?: UnipassInfo
}

// parse url hash from oauth redirect
export const parseOAuthHash = async (loading: any) => {
  if (window.location.hash.length < 10) {
    router.replace('/login')
    return
  }

  try {
    const parsedHash = new URLSearchParams(window.location.hash.substring(1))
    const id_token = parsedHash.get('id_token') ?? ''
    const access_token = parsedHash.get('access_token') ?? ''
    const expires_at = parsedHash.get('expires_in') ?? ''

    if (!id_token || !access_token) {
      router.replace('/login')
      return
    }

    // oauth from recovery
    const recoveryState = LocalStorageService.get('RECOVERY_ORIGIN_STATE')
    if (recoveryState) {
      LocalStorageService.remove('RECOVERY_ORIGIN_STATE')
      const recoveryStore = useRecoveryStore()
      await recoveryStore.restoreFromOAuthSign(recoveryState, id_token)
      await router.replace('/recovery')
      return
    }

    // oauth from send sign
    const signOriginState = LocalStorageService.get('SIGN_TX_ORIGIN_STATE')
    if (signOriginState) {
      LocalStorageService.remove('SIGN_TX_ORIGIN_STATE')
      const signStore = useSignStore()
      await signStore.restoreSignState(signOriginState, id_token, 'sendTx')
      if (signStore.chain === 'eth') {
        await new Promise((resolve) => {
          setTimeout(resolve, 5000)
        })
      }
      await useUserStore().init()
      await useUserStore().fetchBalances()
      await useUserStore().checkKeysetHash()
      signStore.updateGasFee()
      router.replace(sessionStorage.path || '/send/sign')
      return
    }

    // oauth from set guardian
    const guardianOriginState = LocalStorageService.get('GUARDIAN_ORIGIN_STATE')
    if (guardianOriginState) {
      LocalStorageService.remove('GUARDIAN_ORIGIN_STATE')
      await useUserStore().init()
      await updateUpSignToken(id_token, handleOAuthForSetGuardian)
      router.replace('/setting/guardian')
      return
    }

    // oauth from cancel recovery
    const cancelRecoveryOriginState = LocalStorageService.get('CANCEL_RECOVERY_ORIGIN_STATE')
    if (cancelRecoveryOriginState) {
      LocalStorageService.remove('CANCEL_RECOVERY_ORIGIN_STATE')
      await updateUpSignToken(id_token, handleOAuthForCancelRecovery)
      await useUserStore().init()
      await useUserStore().fetchBalances()
      await useUserStore().checkKeysetHash()
      router.replace('/')
      return
    }

    // oauth from sign message
    const signMessageOriginState = LocalStorageService.get('SIGN_MESSAGE_ORIGIN_STATE')
    if (signMessageOriginState) {
      LocalStorageService.remove('SIGN_MESSAGE_ORIGIN_STATE')

      try {
        const appSetting = LocalStorageService.get('SIGN_MESSAGE_APP_SETTING')
        useUserStore().initAppSetting(JSON.parse(appSetting))
      } catch (e) {
        //
      }

      const signStore = useSignStore()
      await signStore.restoreSignState(signMessageOriginState, id_token, 'signMessage')
      if (signStore.redirectUrl) {
        window.location.href = signStore.redirectUrl
        return
      }
      await router.replace('/sign-message')
      return
    }

    const decoded = jwt_decode<IdTokenParams>(id_token)
    let provider: OAuthProvider

    if (decoded.iss.includes('google')) {
      provider = OAuthProvider.GOOGLE
    } else if (decoded.iss.includes('auth.wallet.unipass.id')) {
      provider = OAuthProvider.AUTH0
    } else {
      router.replace('/login')
      return
    }

    const res = await api.authToken({ accessToken: access_token, provider })
    if (res.ok) {
      const {
        authorization,
        unipassInfo,
        isRegistered,
        upSignToken,
        provider: _provider,
      } = res.data
      const oauthUserInfo: OAuthUserInfo = {
        sub: decoded.sub,
        oauth_provider: provider,
        authorization,
        id_token,
        email: decoded.email,
        expires_at,
      }
      const accountType = accountTypeDict[provider]
      const oauthStore = useOAuthLoginStore()
      if (isRegistered) {
        if (unipassInfo) {
          oauthUserInfo.unipass_info = unipassInfo
          oauthUserInfo.up_sign_token = upSignToken
          const data = await blockchain.getAccountInfo(unipassInfo.address)
          oauthStore.initAccountStatus(data.isPending)
        }

        if (LocalStorageService.get('AUTHORIZATION_REQUIRE_STATE')) {
          await checkKeysetHash()
          LocalStorageService.set('OAUTH_INFO', JSON.stringify(oauthUserInfo))
          await useUserStore().init()
          router.replace(sessionStorage.path || '/')
          LocalStorageService.remove('AUTHORIZATION_REQUIRE_STATE')
        } else {
          LocalStorageService.set('OAUTH_INFO', JSON.stringify(oauthUserInfo))
          oauthStore.encryptLogin()
        }
      } else {
        upGA('register_create_password', {
          email: decoded.email,
          account: '-',
          appName: sessionStorage.appName || 'UniPassWallet',
          referrer: sessionStorage.referrer || 'UniPassWallet',
          uniqueID: `${accountType}_${hashMessage(decoded.email)}`,
          accountType,
        })

        if (provider === OAuthProvider.GOOGLE && _provider === OAuthProvider.AUTH0) {
          loading?.close()
          ElMessageBox.alert($t('UseAuth0Oauth', { email: decoded.email }), $t('Notification'), {
            confirmButtonText: $t('SignWithEmail'),
            center: true,
            dangerouslyUseHTMLString: true,
          })
            .then(() => {
              oauthStore.auth0Login('login', decoded.email)
            })
            .catch(() => {})
          return
        }

        if (provider === OAuthProvider.AUTH0 && _provider === OAuthProvider.GOOGLE) {
          loading?.close()
          ElMessageBox.alert($t('UseGoogleOauth'), $t('Notification'), {
            confirmButtonText: $t('SignWithGoogle'),
            center: true,
          })
            .then(() => {
              oauthStore.loginWithGoogle()
            })
            .catch(() => {})
          return
        }
        LocalStorageService.set('OAUTH_INFO', JSON.stringify(oauthUserInfo))
        oauthStore.encryptSignUp()
      }
    } else {
      router.replace('/login')
    }
  } catch (e) {
    console.error(e)
    console.log(`parseOAuthHash error ${e}`)
    router.replace('/login')
  }
}
