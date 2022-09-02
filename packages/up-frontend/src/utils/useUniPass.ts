import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { emailDotPrompt, emailLowercaseFormat, emailLowercasePrompt } from '@/utils/email-dict'

export function useUniPass() {
  const { t: $t } = useI18n()
  const userStore = useUserStore()
  const { copy: $copy } = useClipboard()

  const copy = (str: string) => {
    $copy(str)
    ElMessage.success($t('CopySuccess'))
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
  const formatEmail = (email: string, blur = false) => {
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
      if (blur && warning)
        ElMessage.warning({
          message: warning,
          grouping: true,
        })

      email = prefix + '@' + suffix
    }
    return email
  }
  const formatPassword = (password: string) => {
    const re = /[^A-z\d!"#$%&\\'()*+,-./:;<=>?@[\]^_`{|}~]/g
    return password.replaceAll(re, '')
  }

  // check
  const checkEmailFormat = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const email = v
    if (!email) {
      return callback(new Error($t('EmailEmpty')))
    }
    const regex = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (!regex.test(email)) {
      return callback(new Error($t('EmailWrongFormat')))
    }
    let ok = false
    for (const e of userStore.mailServices) {
      if (email.endsWith('@' + e)) {
        ok = true
      }
    }
    if (!ok) {
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

  return {
    checkEmailFormat,
    checkPassword,
    formatAddress,
    formatEmail,
    formatPassword,
    copy,
  }
}
