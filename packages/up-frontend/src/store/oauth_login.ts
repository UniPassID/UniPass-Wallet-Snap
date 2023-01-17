import { Wallet } from 'ethers'
import Auth0 from 'auth0-js'
import i18n from '@/plugins/i18n'
import { ElMessageBox } from 'element-plus'
import { Keyset, KeySecp256k1 } from '@unipasswallet/keys'
import api from '@/service/backend'
import router from '@/plugins/router'
import blockchain from '@/service/blockchain'
import { getAccountKeysetJson } from '@/utils/rbac'
import { useUserStore } from '@/store/user'
import { getOAuthUserInfo, LocalStorageService } from './storages'
import { genGoogleOAuthUrl } from '@/utils/oauth/google-oauth'
import { AUTH0_CONFIG } from '@/utils/oauth/auth0-config'
import { OAuthProvider } from '@/utils/oauth/parse_hash'
import { upError, upGA } from '@/utils/useUniPass'
import { getMasterKeyAddress, signMsgWithMM } from '@/service/snap-rpc'
import dayjs from 'dayjs'
import DB from './index_db'

const { t: $t } = i18n.global

export interface AccountInfo {
  email: string
  id_token: string
  address: string
  oauth_provider: OAuthProvider
  expires_at: string
  keyset: {
    hash: string
    masterKeyAddress: string
    keysetJson: string
  }
}

export const useOAuthLoginStore = defineStore({
  id: 'OAuthLoginStore',
  state: () => {
    return {
      auth0: new Auth0.WebAuth(AUTH0_CONFIG),
      connectType: 'both',
      email: '',
      password: '',
      confirmPassword: '',
      isPending: false,
      auth0EmailLoading: false,
      auth0CodeLoading: false,
      passwordLoading: false,
    }
  },
  actions: {
    changeConnectType(type: string) {
      this.connectType = type
    },
    loginWithGoogle() {
      window.location.href = genGoogleOAuthUrl()
    },
    initAccountStatus(isPending: boolean) {
      this.isPending = isPending
    },
    async auth0Login(prompt = 'login', email?: string, nonce?: string, scope?: string) {
      this.auth0EmailLoading = true
      const _email = this.email || email
      if (_email && !nonce && !scope) {
        const res = await api.checkProvider(_email)

        if (res.ok && res.data?.provider === OAuthProvider.GOOGLE) {
          ElMessageBox.alert($t('UseGoogleOauth'), $t('Notification'), {
            confirmButtonText: $t('SignWithGoogle'),
            center: true,
          })
            .then(() => {
              window.location.href = genGoogleOAuthUrl(_email)
            })
            .catch(() => {})
          this.auth0EmailLoading = false
          return
        }
      }
      this.auth0.authorize({
        login_hint: _email,
        prompt,
        nonce,
        scope,
      })
    },
    async encryptSignUp() {
      try {
        const oauthUserInfo = getOAuthUserInfo()
        if (!oauthUserInfo) return
        const { email, id_token, expires_at, oauth_provider } = oauthUserInfo
        upGA('register_click_signup', { email }, oauth_provider)

        const policyKeysetJson = sessionStorage.policyKeysetJson
        const pepper = Wallet.createRandom().privateKey
        const masterKeyAddress = await getMasterKeyAddress()

        const timestamp = dayjs().add(10, 'minute').unix()
        const sig = await signMsgWithMM('login UniPass:' + timestamp, masterKeyAddress)

        const keyset = getAccountKeysetJson(
          [],
          { idToken: id_token },
          email,
          masterKeyAddress,
          policyKeysetJson,
          pepper,
        )

        const res = await api.signUpAccount({
          keysetJson: keyset.toJson(),
          masterKeySig: {
            masterKeyAddress,
            timestamp,
            sig,
          },
          pepper,
          source: 'snap',
        })
        const accountAddress = blockchain.generateAccountAddress(keyset.hash())

        if (res.ok) {
          const { address, authorization, upSignToken } = res.data
          if (address.toLowerCase() === accountAddress.toLowerCase()) {
            const user: AccountInfo = {
              email,
              id_token,
              address: accountAddress,
              oauth_provider,
              expires_at,
              keyset: {
                hash: keyset.hash(),
                masterKeyAddress: masterKeyAddress,
                keysetJson: keyset.obscure().toJson(),
              },
            }
            // TODO: Replace the storage provider from IndexedDB to snap_manageState
            await DB.setAccountInfo(user)
            LocalStorageService.set(
              'OAUTH_INFO',
              JSON.stringify({ ...oauthUserInfo, authorization, up_sign_token: upSignToken }),
            )
            sessionStorage.newborn = true
            router.replace('/register/loading')
          } else {
            console.error('account address inconsistent')
          }
        } else {
          console.log('err', res)
        }
      } catch (e) {
        router.replace('/login')
      }
    },
    async encryptLogin() {
      try {
        const oauthUserInfo = getOAuthUserInfo()
        if (!oauthUserInfo || !oauthUserInfo.unipass_info) return
        const { email, id_token, expires_at, unipass_info, oauth_provider } = oauthUserInfo
        upGA('login_click_login', { account: unipass_info.address, email }, oauth_provider)

        const masterKeyAddress = await getMasterKeyAddress()

        const keyset = Keyset.fromJson(unipass_info.keyset)
        const user: AccountInfo = {
          email,
          id_token,
          address: unipass_info.address,
          oauth_provider,
          expires_at,
          keyset: {
            hash: keyset.hash(),
            masterKeyAddress: (keyset.keys[0] as KeySecp256k1).address,
            keysetJson: keyset.obscure().toJson(),
          },
        }
        await DB.setAccountInfo(user)
        const userStore = useUserStore()
        sessionStorage.removeItem('newborn')
        if (sessionStorage.redirectUrl) {
          const redirectUrl = new URL(sessionStorage.redirectUrl)
          sessionStorage.removeItem('redirectUrl')
          redirectUrl.searchParams.delete('connectType')
          location.href = redirectUrl.toString()
        } else {
          await router.replace(sessionStorage.path || '/')
        }
        upGA('login_success', { account: unipass_info.address, email }, oauth_provider)
        userStore.init()
      } catch (e: any) {
        if (e?.message === 'invalid password') {
          upError($t('IncorrectPassword'))
          return
        }
        console.log(e)
        router.replace('/login')
      } finally {
        this.passwordLoading = false
      }
    },
  },
})
