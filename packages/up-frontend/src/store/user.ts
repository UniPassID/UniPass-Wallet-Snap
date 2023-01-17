import { clearStorage } from './../utils/clear'
import { AppSettings, UPMessage, UPResponse } from '@unipasswallet/popup-types'
import { TokenInfo, sdkConfig } from '@/service/chains-config'
import UnipassWalletProvider, { ChainType } from '@unipasswallet/provider'
import router from '@/plugins/router'
import { postMessage } from '@unipasswallet/popup-utils'
import { useChainAccountStore } from './chain-account'
import { getAccountAssets, getDefaultAsset } from '@/utils/account-token'
import { AccountInfo } from './oauth_login'
import { OAuthProvider } from '@/utils/oauth/parse_hash'
import DB from './index_db'
import i18n from '@/plugins/i18n'

export type StepType = 'register' | 'recovery'

export const useUserStore = defineStore({
  id: 'userStore',
  state: () => {
    return {
      unipassWallet: UnipassWalletProvider.getInstance({
        env: sdkConfig.net,
        url_config: sdkConfig.urlConfig,
      }),
      accountInfo: {
        email: '',
        id_token: '',
        address: '',
        oauth_provider: OAuthProvider.GOOGLE,
        keyset: {
          hash: '',
          masterKeyAddress: '',
          keysetJson: '',
        },
      } as AccountInfo,
      // frontend
      coins: getDefaultAsset(),
      showSupportEmail: false,
      showHeaderMore: false,
      showOAuth: false,
      showTimeSelect: true,
      showOAuthHours: 1,
      showOAuthCallback: async () => {},
      // popup-sdk
      upLoading: false,
      appIcon: '',
      appName: '',
      returnEmail: false,
      referrer: '',
      chain: undefined as ChainType | undefined,
      walletConnect: 0,
      theme: 'system',
    }
  },
  actions: {
    async init() {
      const account_info = await DB.getAccountInfo()
      if (!account_info) return
      await this.update(account_info)
      this.pollNetWorth()
    },
    initAppSetting(appSetting?: AppSettings) {
      if (appSetting) {
        const { theme, chain, appName, appIcon } = appSetting
        if (!sessionStorage.theme && theme) {
          sessionStorage.theme = theme
          this.initTheme(theme)
        }
        if (chain) {
          sessionStorage.chain = chain
          this.chain = chain
        }
        if (appName) {
          sessionStorage.appName = appName
          this.appName = appName
        }
        if (appIcon) {
          this.appIcon = appIcon
        }
      }
    },
    initTheme(theme: string) {
      const isDark = useDark()
      const toggleDark = useToggle(isDark)
      if (theme === 'dark') {
        toggleDark(true)
      } else if (theme === 'light') {
        toggleDark(false)
      } else {
        // dark
        if (theme === 'cassava') {
          toggleDark(true)
        }
        // set theme html id
        const html = document.querySelector('html')
        if (html) html.classList.add(theme)

        // set locale
        for (const locale of i18n.global.availableLocales) {
          if (locale === theme) {
            i18n.global.locale.value = theme
            localStorage.setItem('language', theme)
          }
        }
      }
    },
    async update(accountInfo: AccountInfo) {
      this.accountInfo = accountInfo
      await DB.setAccountInfo(accountInfo)
    },
    async exit(refresh = false, redirectUrl?: string) {
      // const net = process.env.VUE_APP_Net
      // if (net !== 'mainnet' && net !== 'testnet') {
      //   alert('log out')
      // }
      await clearStorage()
      useChainAccountStore().$reset()
      this.$reset()
      this.upLoading = false
      if (window.opener) {
        postMessage(
          new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('DECLINE', 'expired'))),
        )
      }

      if (window?.flutter_inappwebview?.callHandler) {
        console.log('[flutter user info invalid]')
        window.flutter_inappwebview.callHandler(
          'onUserInfoInvalid',
          new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('DECLINE', 'expired'))),
        )
      }

      if (refresh) {
        window.location.replace('/login')
      } else if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        router.replace('/login')
      }
    },
    async isLogged() {
      const _account_info = await DB.getAccountInfo()
      return !!_account_info
    },
    async pollNetWorth() {
      const pollRouter = ['/', '/send', '/send-transaction', '/send/sign', '/async-account']
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!this.accountInfo.address) break
        if (pollRouter.includes(window.location.pathname)) {
          const isSameHash = await this.checkKeysetHash()
          if (!isSameHash) break
          await this.fetchBalances()
        }
        await new Promise((resolve) => setTimeout(resolve, 20000))
      }
    },
    async fetchBalances() {
      if (!this.accountInfo.address) return

      const tokens = await getAccountAssets(this.accountInfo.address)
      this.updateCoins(tokens)
    },
    async checkKeysetHash() {
      const chainAccountStore = useChainAccountStore()
      await chainAccountStore.fetchAccountInfo(
        this.accountInfo.address,
        true,
        this.accountInfo.keyset.hash,
      )
      if (this.accountInfo.keyset.hash !== chainAccountStore.keysetHash) {
        this.exit()
        return false
      }
      return true
    },
    updateCoins(coins: TokenInfo[]) {
      this.coins = coins.map((x) => {
        return x
      })
    },
  },
})
