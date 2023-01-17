import dayjs from 'dayjs'
import { FormInstance } from 'element-plus'
import { useOAuthLoginStore } from '@/store/oauth_login'
import { upGA, useUniPass } from '@/utils/useUniPass'
import { useUserStore } from '@/store/user'
import blockchain from '@/service/blockchain'
import api from '@/service/backend'
import DB from '@/store/index_db'

export const useOAuth = () => {
  const { t: $t } = useI18n()
  const formElement = ref<FormInstance>()
  const unipass = useUniPass()
  const showWarning = ref(false)
  const loading = ref(false)
  const oauthStore = useOAuthLoginStore()

  const form = reactive({
    emailCode: '',
    count: 0,
    token: '',
    loading: false,
  })

  const checkConfirmPassword = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const password = v
    if (!password) {
      return callback()
    }
    if (oauthStore.password !== password) {
      return callback(new Error($t('PasswordsNotMatch')))
    }
    callback()
  }

  const countDown = async () => {
    const res = { ok: true }
    if (res.ok) {
      form.count = 60
      const n = setInterval(() => {
        form.count--
        if (form.count === 0) {
          clearInterval(n)
        }
      }, 1000)
      unipass.success($t('SendSuccess'))
    }
  }

  const signUp = () => {
    if (loading.value === true) return
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok) {
        loading.value = true
        await oauthStore.encryptSignUp()
        loading.value = false
      }
    })
  }

  const login = () => {
    if (loading.value === true) return
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok) {
        loading.value = true
        await oauthStore.encryptLogin()
        loading.value = false
      }
    })
  }

  return {
    form,
    unipass,
    showWarning,
    oauthStore,
    checkConfirmPassword,
    countDown,
    signUp,
    login,
    formElement,
    loading,
  }
}

export const useRegisterLoading = () => {
  const { t: $t } = useI18n()
  const unipass = useUniPass()
  const userStore = useUserStore()
  const router = useRouter()
  let polling: NodeJS.Timer | undefined
  onBeforeMount(async () => {
    userStore.upLoading = true
    const date = dayjs().add(2, 'minute')
    const account_info = await DB.getAccountInfo()
    if (!account_info) return
    polling = setInterval(async () => {
      const registered = await blockchain.isRegistered(account_info.address)
      if (registered) {
        userStore.upLoading = false
        upGA(
          'register_success',
          { email: account_info.email, address: account_info.address },
          account_info.oauth_provider,
        )
        await api.syncUpdate()
        clearInterval(polling)
        userStore.init()
        if (sessionStorage.redirectUrl) {
          const redirectUrl = new URL(sessionStorage.redirectUrl)
          sessionStorage.removeItem('redirectUrl')
          redirectUrl.searchParams.delete('connectType')
          location.href = redirectUrl.toString()
        } else {
          await router.replace(sessionStorage.path || '/')
        }
      }
      // timeout
      if (date.isBefore(dayjs())) {
        userStore.upLoading = false
        clearInterval(polling)
        unipass.error($t('NetworkError'))
      }
    }, 4000)
  })

  onUnmounted(() => {
    clearInterval(polling)
  })
}
