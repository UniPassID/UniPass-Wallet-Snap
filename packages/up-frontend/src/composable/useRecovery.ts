import api from '@/service/backend'
import { useRecoveryStore } from '@/store/recovery'
import {
  generateCloudKey,
  generateKdfPassword,
  generateKeysetHash,
  generatePermit,
  getCloudKeyFromMM,
  signMsg,
  signMsgWithMM,
} from '@/utils/cloud-key'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import dayjs from 'dayjs'
import { User, useUserStore } from '@/store/user'
import { generateSessionKey } from '@/utils/session-key'
import blockchain from '@/service/blockchain'
import db from '@/store/db'
import router from '@/plugins/router'
import { GuardiansStatus } from '@/composable/useRegisterGuardian'

export const useRecovery = () => {
  const { t: $t } = useI18n()
  const formElement = ref<FormInstance>()
  const emailElement = ref<HTMLInputElement>()
  // data
  const recoveryStore = useRecoveryStore()

  // methods
  const checkConfirmPassword = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const password = v
    if (recoveryStore.password !== password) {
      return callback(new Error($t('PasswordsNotMatch')))
    }
    callback()
  }

  const submitEmail = () => {
    if (!formElement.value) return
    formElement.value.validate((ok) => {
      if (ok) {
        recoveryStore.step = 2
      } else {
        if (!recoveryStore.email) emailElement.value?.focus()
      }
    })
  }

  const getToken = async (token: string) => {
    recoveryStore.token = token
    recoveryStore.step = 3
    console.log('recoveryStore.step', recoveryStore.step)
    await uploadCloudKey()
  }

  const submitPassword = () => {
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok) {
        recoveryStore.loading = true
        await uploadCloudKey()
        recoveryStore.loading = false
      }
    })
  }

  const uploadCloudKey = async () => {
    const { email, token } = recoveryStore.$state

    const resKeyset = await api.queryAccountKeyset({
      email,
      upAuthToken: token,
      sessionKeyPermit: {},
    })
    // keyset
    if (!resKeyset.ok) return

    const { threshold, originEmails, upAuthToken: newToken } = resKeyset.data
    // const kdfPassword = generateKdfPassword(password)
    const cloudKey = await getCloudKeyFromMM()

    const resAddress = await api.queryAccountAddress(email)
    // address
    if (!resAddress.ok) return

    const accountAddress = resAddress.data.address
    const newKeysetHash = generateKeysetHash(cloudKey, threshold, originEmails)
    const newCloudKeyAddress = cloudKey
    // save
    const user: User = {
      email,
      account: accountAddress,
      keyset: {
        hash: newKeysetHash,
        cloudKeyAddress: newCloudKeyAddress,
        recoveryEmails: {
          threshold,
          emails: originEmails,
        },
      },
      // sessionKey: {
      //   localKey: {
      //     keystore: sessionKey.encryptedKey,
      //     address: sessionKey.address,
      //   },
      //   aesKey: sessionKey.aesKey,
      //   authorization: permit,
      //   expires: timestamp,
      // },
      committed: false,
      step: 'recovery',
      stepData: newToken,
    }
    const userStore = useUserStore()
    await userStore.update(user)
    recoveryStore.step = 3
  }

  // export
  return {
    checkConfirmPassword,
    recoveryStore,
    submitEmail,
    submitPassword,
    formElement,
    emailElement,
    getToken,
    uploadCloudKey,
  }
}

export const useRecoveryGuardian = () => {
  const { t: $t } = useI18n()
  // data
  const recoveryStore = useRecoveryStore()
  const userStore = useUserStore()
  const form = reactive({
    guardians: [] as {
      email: string
      n: NodeJS.Timer | undefined
      countDown: number
      disbaled: boolean
      status: number
      type: GuardiansStatus
    }[],
  })

  const registerEmail = ref('')
  let polling: NodeJS.Timer | undefined
  let user: User

  const sendEmail = async (i: number) => {
    const upAuthToken = user.stepData
    form.guardians[i].disbaled = true
    const res = await api.sendRecoveryEmail({
      email: user.email,
      upAuthToken,
      verificationEmail: form.guardians[i].email,
      newCloudKeyAddress: user.keyset.cloudKeyAddress,
    })
    form.guardians[i].disbaled = false
    if (res.ok && form.guardians[i]) {
      form.guardians[i].type = 'pending'
      form.guardians[i].countDown = 60
      form.guardians[i].n = setInterval(() => {
        form.guardians[i].countDown--
        if (form.guardians[i].countDown === 0) {
          clearInterval(form.guardians[i].n)
        }
      }, 1000)
      pollingCheckEmail()
      ElMessage.success($t('SendSuccess'))
    }
  }
  const pollingCheckEmail = async () => {
    if (polling) return

    const newKeysetHash = user.keyset.hash

    let date = dayjs().add(30, 'minute')
    polling = setInterval(async () => {
      const res = await api.sendRecoveryStatus(user.email)
      if (res.ok) {
        if (res.data.every((e) => e.status === 1)) {
          date = dayjs().add(2, 'minute')
        }
        for (const e of res.data) {
          const i = form.guardians.findIndex((guardian) => guardian.email === e.email)
          if (i !== -1) {
            form.guardians[i].status = e.status
            if (e.status === 1 && form.guardians[i].type !== 'success') {
              form.guardians[i].type = 'success'
            }
          }
          if (e.status === 2) {
            const resKeysetHash = await blockchain.getAccountKeysetHash(user.account)
            if (resKeysetHash === newKeysetHash) {
              clearInterval(polling)
              polling = undefined

              await db.delUser(user.email)

              ElMessageBox.alert($t('RecoverySuccessTip'), $t('RecoverySuccess'), {
                confirmButtonText: $t('LoginNow'),
                showClose: false,
              }).then(() => {
                // reset recoveryStore
                recoveryStore.$reset()
                router.replace('/login')
              })
            }
            break
          }
        }
      }
      // timeout
      if (date.isBefore(dayjs())) {
        clearInterval(polling)
        ElMessageBox.alert($t('RecoveryRestart'), $t('RecoveryTimeout'), {
          confirmButtonText: $t('OK'),
          showClose: false,
        }).then(() => {
          // clear password
          recoveryStore.password = ''
          recoveryStore.confirmPassword = ''
          recoveryStore.step = 1
        })
      }
    }, 4000)
  }

  onBeforeMount(async () => {
    if (userStore.user?.step === 'recovery') {
      user = userStore.user
      form.guardians = user.keyset.recoveryEmails.emails.map((email) => {
        return {
          email,
          countDown: 0,
          n: undefined,
          disbaled: false,
          status: 0,
          type: 'send',
        }
      })
      registerEmail.value = user.email
    } else {
      // clear password
      recoveryStore.password = ''
      recoveryStore.confirmPassword = ''
      recoveryStore.step = 1
    }
  })

  onUnmounted(() => {
    clearInterval(polling)
  })

  return {
    form,
    sendEmail,
    pollingCheckEmail,
    registerEmail,
  }
}
