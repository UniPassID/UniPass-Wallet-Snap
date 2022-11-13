import { FormInstance, ElMessageBox } from 'element-plus'
import api from '@/service/backend'
import { useRegisterStore } from '@/store/register'

export type GuardiansStatus = 'send' | 'pending' | 'success' | 'error'

export interface GuardiansInfo {
  recoveryEmail: string
  type: GuardiansStatus
  verified: boolean
  countDown: number
  loading: boolean
  n: any
}
export function useRegisterGuardian() {
  const { t: $t } = useI18n()
  const registerStore = useRegisterStore()
  const registerEmail = registerStore.email
  const formElement = ref<FormInstance>()
  // data
  let polling: NodeJS.Timer | undefined
  const form = reactive({
    loading: false,
    guardians: [] as GuardiansInfo[],
  })
  // methods
  const deleteGuardian = (i: number) => {
    clearInterval(form.guardians[i].n)
    form.guardians.splice(i, 1)
  }
  const checkGuardianRepeatability = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const email = v
    if (email === registerEmail) {
      return callback(new Error($t('RegisterEmailSame')))
    }
    const len = form.guardians.filter((guardian) => guardian.recoveryEmail === email).length
    if (len > 1) {
      return callback(new Error($t('RecoveryEmailSame')))
    }
    callback()
  }
  const fetchGuardianEmail = (i: number) => {
    if (formElement.value) {
      formElement.value.validateField(`${i}.recoveryEmail`, async (ok) => {
        if (!ok) return

        form.guardians[i].loading = true
        const res = await api.sendGuardianLink({
          email: form.guardians[i].recoveryEmail,
          registerEmail,
        })
        if (res.ok && form.guardians[i]) {
          form.guardians[i].type = 'pending'
          form.guardians[i].countDown = 60
          form.guardians[i].n = setInterval(() => {
            form.guardians[i].countDown--
            if (form.guardians[i].countDown === 0) {
              clearInterval(form.guardians[i].n)
            }
          }, 1000)
          pollingGuardian()
        }
        form.guardians[i].loading = false
      })
    }
  }
  const addGuardian = () => {
    const GuardiansInfo: GuardiansInfo = {
      recoveryEmail: '',
      type: 'send',
      verified: false,
      n: 0,
      countDown: 0,
      loading: false,
    }
    form.guardians.push(GuardiansInfo)
  }
  const skipGuardian = () => {
    ElMessageBox.confirm($t('SureSkip'), {
      confirmButtonText: $t('SkipGuardian'),
      cancelButtonText: $t('Cancel'),
    })
      .then(async () => {
        form.loading = true
        await registerStore.register()
        form.loading = false
      })
      .catch(() => {})
  }

  const submitGuardians = async () => {
    form.loading = true
    registerStore.guardians = form.guardians
    await registerStore.register()
    form.loading = false
  }
  const pollingGuardian = () => {
    if (polling) return
    polling = setInterval(async () => {
      const res = await api.getGuardianToken(registerEmail)
      if (res.ok) {
        for (const item of res.data) {
          for (let i = 0; i < form.guardians.length; i++) {
            if (form.guardians[i].recoveryEmail === item.email) {
              const verified = item.verified
              form.guardians[i].verified = verified
              if (verified && form.guardians[i].type !== 'success') {
                form.guardians[i].type = 'success'
              }
            }
          }
        }
        const successs = form.guardians.findIndex((guardian) => !guardian.verified) === -1
        if (successs) {
          clearInterval(polling)
          polling = undefined
        }
      }
    }, 4000)
  }

  onUnmounted(() => {
    for (const guardian of form.guardians) {
      clearInterval(guardian.n)
    }
    clearInterval(polling)
  })

  return {
    formElement,
    form,
    addGuardian,
    skipGuardian,
    deleteGuardian,
    fetchGuardianEmail,
    submitGuardians,
    checkGuardianRepeatability,
  }
}
