import api, { AuthType } from '@/service/backend'
import { useUniPass } from '@/utils/useUniPass'

export function usePhoneCode(email: string, getToken?: (token: string, type: AuthType) => void) {
  const { t: $t } = useI18n()
  const unipass = useUniPass()
  const form = reactive({
    code: '',
    loading: false,
    phoneCodeLoading: false,
    count: 0,
  })
  const fetch = async () => {
    form.phoneCodeLoading = true
    const res = await api.sendOtpCode({
      email,
      action: 'auth2Fa',
      authType: 1,
    })
    if (res.ok) {
      form.count = 60
      const n = setInterval(() => {
        form.count--
        if (form.count === 0) {
          clearInterval(n)
        }
      }, 1000)
      unipass.success($t('SendSuccess'))
      form.phoneCodeLoading = false
    }
  }
  const verify = async () => {
    form.loading = true
    const res = await api.verifyOtpCode({
      email,
      action: 'auth2Fa',
      code: form.code,
      authType: 1,
    })
    if (res.ok) {
      if (getToken) getToken(res.data.upAuthToken, 1)
    }
    form.loading = false
  }
  return {
    form,
    fetch,
    verify,
  }
}

export function useGoogleCode(email: string, getToken?: (token: string, type: AuthType) => void) {
  const form = reactive({
    code: '',
    loading: false,
  })
  const verify = async () => {
    form.loading = true
    const res = await api.verifyOtpCode({
      email,
      action: 'auth2Fa',
      code: form.code,
      authType: 2,
    })
    if (res.ok) {
      if (getToken) getToken(res.data.upAuthToken, 2)
    }
    form.loading = false
    return
  }
  return {
    form,
    verify,
  }
}
