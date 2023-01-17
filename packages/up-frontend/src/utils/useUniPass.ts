import { useUserStore } from '@/store/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { emailDotPrompt, emailLowercaseFormat, emailLowercasePrompt } from '@/utils/email-dict'
import UpIcon from '@/components/up-icon.vue'
import { ChainType } from '@unipasswallet/provider'
import { useSignStore } from '@/store/sign'
import { useGtag } from 'vue-gtag-next'
import { getOpenType } from '@/service/check-environment'
import { OAuthProvider } from './oauth/parse_hash'
import { hashMessage } from 'ethers/lib/utils'

export type TransactionType = 'send-token' | 'send-nft' | 'contract-call'

export type OpenType = 'origin' | 'popup' | 'flutter' | 'unity' | 'unreal' | 'redirect'

export type EventName =
  | 'router_change'
  | 'backend_request'
  // on-chain success
  | 'register_success'
  | 'recovery_policy_success'
  | 'recovery_guardian_success'
  | 'transaction_success'
  | 'guardian_add_success'
  | 'guardian_del_success'
  // new
  | 'login_click_continue'
  | 'login_click_google'
  | 'login_click_login'
  | 'sig_click_sign'
  | 'register_click_continue'
  | 'register_click_google'
  | 'register_click_signup'
  // guardian
  | 'recovery_policy_start'
  | 'recovery_guardian_start'
  | 'login_success'
  | 'connect_success'
  | 'setguardian_add_strat'
  | 'setguardian_delete_strat'
  | 'login_enter_password'
  | 'register_create_password'
  // sign-message
  | 'signmessage_click_sign'
  | 'signmessage_success'
  | 'signmessage_start'
  | 'transaction_start'

export interface SendToken {
  amount: string
  address: string
  symbol: string
  chain: ChainType
}

export const upSuccess = (message: string, duration = 3000) => {
  ElMessage({
    message,
    type: 'success',
    icon: h(UpIcon, { name: 'success' }),
    duration,
    center: true,
    customClass: 'up-message-success',
    grouping: true,
  })
}

export const upInfo = (message: string) => {
  ElMessage({
    message,
    type: 'success',
    icon: h(UpIcon, { name: 'success' }),
    // duration: 0,
    center: true,
    customClass: 'up-message-info',
    grouping: true,
  })
}

export const upError = (message: string) => {
  ElMessage({
    message,
    type: 'error',
    icon: h(UpIcon, { name: 'wrong' }),
    duration: 5000,
    customClass: 'up-message-error',
    grouping: true,
  })
}

export const upTip = (message: string, duration = 3000, showClose = false) => {
  ElMessage({
    message,
    type: 'error',
    icon: h(UpIcon, { name: 'wrong' }),
    duration,
    showClose,
    customClass: 'up-message-error',
    grouping: true,
  })
}

export const accountTypeDict = {
  0: 'GoogleOAuth',
  1: 'Email',
}

export const upGA = async (
  eventName: EventName,
  data?: { [key: string]: string },
  oauth_provider?: OAuthProvider,
) => {
  const accountInfo = useUserStore().accountInfo
  let { address, email } = accountInfo
  if (data) {
    email = data.email || email
    address = data.address || address
  }
  const provider = oauth_provider || accountInfo.oauth_provider

  const accountType = accountTypeDict[provider] || '-'
  data = {
    appName: sessionStorage.appName || 'UniPassWallet',
    referrer: sessionStorage.referrer || 'UniPassWallet',
    uniqueID: accountType && email ? `${accountType}_${hashMessage(email)}` : '-',
    openType: getOpenType(),
    accountType,
    ...data,
  }

  data.email = email ? `email_${hashMessage(email)}` : '-'
  data.account = address ? `address_${hashMessage(address)}` : '-'
  console.log('GA:', eventName, data)
  useGtag().event(eventName, data)
}

export const useUniPass = () => {
  const { t: $t } = useI18n()
  const userStore = useUserStore()
  const signStore = useSignStore()
  const { copy: $copy } = useClipboard()

  const copy = (str: string) => {
    $copy(str)
    upSuccess($t('CopySuccess'))
  }

  // format
  const formatAddress = (address: string) => {
    if (!address) {
      return ''
    }
    const prefix = address.slice(0, 6)
    const suffix = address.slice(-4)
    return prefix + '...' + suffix
  }
  const formatEmail = (email: string, next = false) => {
    for (const s of [' ', '+']) {
      email = email.replaceAll(s, '')
    }
    const i = email.indexOf('@')
    if (i !== -1) {
      let prefix = email.slice(0, i)
      let warning = ''
      const suffix = email
        .slice(i + 1)
        .replaceAll('@', '')
        .toLowerCase()
      if (/[A-Z]/.test(prefix)) {
        if (emailLowercaseFormat.includes(suffix)) {
          prefix = prefix.toLowerCase()
        }
        if (emailLowercasePrompt.includes(suffix)) {
          if (prefix.includes('.') && emailDotPrompt.includes(suffix)) {
            warning = $t('SameCaseDot')
          } else {
            warning = $t('SameCase')
          }
        }
      }
      if (prefix.includes('.')) {
        if (emailDotPrompt.includes(suffix) && !warning) {
          warning = $t('SameDot')
        }
      }
      if (next) {
        return warning
      }

      email = prefix + '@' + suffix
    }
    return email
  }
  const formatAmount = (amount: string, blur?: boolean) => {
    amount = amount.replaceAll(/[^\d.]/g, '')
    if (amount.length === 0) return ''
    const decimal = signStore.coin?.decimals

    const i = amount.indexOf('.')
    if (i !== -1) {
      let prefix = amount.slice(0, i)
      let suffix = amount.slice(i + 1).replaceAll('.', '')
      if (blur) {
        if (prefix === '') prefix = '0'
        if (suffix === '') suffix = '0'
      }
      suffix = suffix.slice(0, decimal)
      amount = prefix + '.' + suffix
    }

    return amount
  }
  const formatPassword = (password: string) => {
    const re = /[^A-z\d!"#$%&\\'()*+,-./:;<=>?@[\]^_`{|}~]/g
    return password.replaceAll(re, '')
  }
  const formatBalance = (balance: string, decimals = 4) => {
    return Number(Number(balance).toFixed(decimals))
  }

  // check
  const checkEmailFormat = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const email = v
    if (!email) {
      return callback()
    }
    const regex = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (!regex.test(email)) {
      return callback(new Error($t('EmailWrongFormat')))
    }
    callback()
  }

  const checkDkimEmailFormat = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const email = v
    if (!email) {
      // return callback(new Error($t('EmailEmpty')))
      return callback()
    }
    const regex = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (!regex.test(email)) {
      return callback(new Error($t('EmailWrongFormat')))
    }
    if (!sessionStorage.mailServices) {
      return callback(new Error($t('NetworkError')))
    }
    let ok = false
    for (const e of sessionStorage.mailServices.split(',')) {
      if (email.endsWith('@' + e)) {
        ok = true
      }
    }
    if (!ok) {
      userStore.showSupportEmail = true
      return callback(new Error($t('NotSupport')))
    }
    callback()
  }

  const checkPassword = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const password = v
    if (!password) {
      return callback(new Error($t('PasswordEmpty')))
    }
    if (/^\S{8,32}$/.test(password) === false) {
      return callback(new Error($t('PasswordRule1')))
    }
    if (/(?=.*[A-Z])(?=.*\S)[^]/.test(password) === false) {
      return callback(new Error($t('PasswordRule2')))
    }
    if (/(?=[a-z])[^]/.test(password) === false) {
      return callback(new Error($t('PasswordRule3')))
    }
    if (/(?=[\d]+)/.test(password) === false) {
      return callback(new Error($t('PasswordRule4')))
    }
    callback()
  }

  const userExit = () => {
    ElMessageBox.confirm($t('SureLogOut'), $t('LogOutAccount'), {
      confirmButtonText: $t('LogOut'),
      cancelButtonText: $t('Cancel'),
    })
      .then(() => {
        userStore.exit()
      })
      .catch(() => {})
  }

  const setLanguage = (lang: string) => {
    const i18n = useI18n()
    i18n.locale.value = lang
    localStorage.setItem('language', lang)
  }

  return {
    checkEmailFormat,
    checkDkimEmailFormat,
    checkPassword,
    formatAddress,
    formatEmail,
    formatPassword,
    formatBalance,
    formatAmount,
    copy,
    success: upSuccess,
    error: upError,
    userExit,
    setLanguage,
  }
}
