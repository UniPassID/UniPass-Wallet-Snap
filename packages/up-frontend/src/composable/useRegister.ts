import { useRegisterStore } from '@/store/register'
import { ElMessage, FormInstance } from 'element-plus'

import dayjs from 'dayjs'
import db from '@/store/db'
import blockchain from '@/service/blockchain'
import { useUserStore } from '@/store/user'
import api, { OtpAction } from '@/service/backend'
import { getCloudKeyFromMM } from '@/utils/cloud-key'
interface Emits {
  (event: 'token', token: string): void
  (event: 'code', code: string): void
  (event: 'back'): void
}

export const useRegister = (otpAction: OtpAction, email: string, $emit: Emits) => {
  const { t: $t } = useI18n()

  const form = reactive({
    email: '',
    emailCode: '',
    isEmailCodeLoading: false,
    count: 0,
    loading: false,
  })

  const formElement = ref<FormInstance>()
  const emailElement = ref<HTMLInputElement>()

  // data
  const registerStore = useRegisterStore()

  // methods
  const fetchEmailCode = async () => {
    form.isEmailCodeLoading = true
    email = form.email
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

  // validator
  const checkEmailCode = (_rule: any, v: string, callback: (err?: Error) => void) => {
    console.log('v', v)
    const code = v
    if (!code) {
      return callback(new Error($t('EmailCodeEmpty')))
    }
    callback()
  }

  const doRegister = () => {
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (!ok) return
      registerStore.email = form.email

      form.loading = true
      const res = await api.verifyOtpCode({
        email,
        action: otpAction,
        code: form.emailCode,
      })
      if (res.ok) {
        const token = res.data.upAuthToken
        $emit('token', token)
        registerStore.token = token

        await registerStore.register()
      }
      form.loading = false
    })
  }

  const getToken = async (token: string) => {
    registerStore.token = token
    registerStore.step = 3
  }

  // export
  return {
    registerStore,
    form,
    formElement,
    emailElement,
    fetchEmailCode,
    checkEmailCode,
    getToken,
    doRegister,
  }
}

export const useRegisterLoading = () => {
  const { t: $t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const email = (route.query.email as string) || ''
  let polling: NodeJS.Timer | undefined
  onBeforeMount(async () => {
    if (email) {
      const user = await db.getUser(email)
      if (user) {
        const date = dayjs().add(2, 'minute')
        polling = setInterval(async () => {
          const registered = await blockchain.isRegistered(user.account)
          if (registered) {
            clearInterval(polling)
            // register success
            user.committed = true
            delete user.step
            delete user.stepData
            const userStore = useUserStore()
            await userStore.update(user)
            localStorage.setItem('email', user.email)
            router.replace('/')
          }
          // timeout
          if (date.isBefore(dayjs())) {
            clearInterval(polling)
            ElMessage.warning($t('RegisterTimeout'))
          }
        }, 4000)
      } else {
        router.replace('/register')
      }
    } else {
      router.replace('/register')
    }
  })
  onUnmounted(() => {
    clearInterval(polling)
  })
}
