import api, { OtpAction } from '@/service/backend'
import { useLoginStore } from '@/store/login'
import { ElMessage, FormInstance } from 'element-plus'

// same as the page-verify Emits
interface Emits {
  (event: 'token', token: string): void
  (event: 'code', code: string): void
  (event: 'back'): void
}

export function useVerifyEmail(otpAction: OtpAction, email: string, $emit: Emits) {
  const { t: $t } = useI18n()
  // data
  const form = reactive({
    emailCode: '',
    isEmailCodeLoading: false,
    count: 0,
    loading: false,
  })
  const formElement = ref<FormInstance>()
  // method
  const fetchEmailCode = async () => {
    form.isEmailCodeLoading = true
    const res = await api.sendOtpCode({
      email,
      action: otpAction,
    })
    if (res.ok) {
      form.count = 60
      const n = setInterval(() => {
        form.count--
        if (form.count === 0) {
          clearInterval(n)
        }
      }, 1000)
      ElMessage.success($t('SendSuccess'))
    }
    form.isEmailCodeLoading = false
  }
  const verifyEmailCode = () => {
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok) {
        form.loading = true
        if (otpAction === 'signIn') {
          const loginStore = useLoginStore()
          const { email, token } = loginStore.$state
          const res = await api.loginAccount({
            email,
            upAuthToken: token,
            authenticators: {
              email,
              action: 'signIn',
              code: form.emailCode,
            },
          })
          if (res.ok) {
            await loginStore.login(res.data.keystore, res.data.address)
          }
        } else {
          const res = await api.verifyOtpCode({
            email,
            action: otpAction,
            code: form.emailCode,
          })
          if (res.ok) {
            const token = res.data.upAuthToken
            $emit('token', token)
          }
        }
        form.loading = false
      }
    })
  }
  const checkEmailCode = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const code = v
    if (!code) {
      return callback(new Error($t('EmailCodeEmpty')))
    }
    callback()
  }

  // auto fetch email code
  fetchEmailCode()

  return {
    form,
    formElement,
    fetchEmailCode,
    verifyEmailCode,
    checkEmailCode,
  }
}
