import { clearStorage } from './../utils/clear'
import { OAuthProvider } from '@/utils/oauth/parse_hash'
import { LocalStorageService } from '@/store/storages'
import api, { AuthType } from '@/service/backend'
import { useRecoveryStore } from '@/store/recovery'
import { ElMessageBox, FormInstance } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'
import router from '@/plugins/router'
import { upGA, useUniPass, upError } from '@/utils/useUniPass'
import { calculateGuardianWeight, getGuardianEmailData } from '@/utils/rbac'
import { GuardiansStatus } from '@/composable/useGuardian'
import { useChainAccountStore } from '@/store/chain-account'
import { usePhoneCode, useGoogleCode } from '@/composable/useCode'
import { genGoogleOAuthSignUrl, getAccountSubject } from '@/utils/oauth/google-oauth'
import blockchain from '@/service/blockchain'
import { useOAuthLoginStore } from '@/store/oauth_login'
import DB from '@/store/index_db'

export const useRecovery = () => {
  const { t: $t } = useI18n()
  const formElement = ref<FormInstance>()
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
      }
    })
  }

  const getToken = async (token: string) => {
    recoveryStore.token = token
    recoveryStore.step = 3
  }

  const recovery = async () => {
    recoveryStore.loading = true
    try {
      await recoveryStore.uploadCloudKey()
    } catch (e: any) {
      recoveryStore.loading = false
      if (e?.message) {
        upError(e?.message)
        return
      }
    }
  }

  return {
    checkConfirmPassword,
    recoveryStore,
    submitEmail,
    recovery,
    formElement,
    getToken,
  }
}

export const useRecoveryGuardian = () => {
  const { t: $t } = useI18n()
  const unipass = useUniPass()
  // data
  const recoveryStore = useRecoveryStore()
  const chainAccountStore = useChainAccountStore()
  const userStore = useUserStore()
  const form = reactive({
    loading: false,
    provider: OAuthProvider.GOOGLE,
    guardians: [] as {
      email: string
      emailHash: string
      weight: number
      n: NodeJS.Timer | undefined
      countDown: number
      disbaled: boolean
      status: number
      type: GuardiansStatus
    }[],
  })
  const registerEmail = ref('')

  const sendEmail = async (i: number) => {
    form.guardians[i].disbaled = true
    const res = await api.sendRecoveryEmail({
      email: userStore.accountInfo.email,
      verificationEmailHash: form.guardians[i].emailHash,
      newMasterKeyAddress: userStore.accountInfo.keyset.masterKeyAddress,
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
      unipass.success($t('SendSuccess'))
    }
  }

  const googleAuthVerify = async () => {
    LocalStorageService.set('RECOVERY_ORIGIN_STATE', JSON.stringify(recoveryStore.$state))
    const { address, keyset, email } = userStore.accountInfo
    const metaNonce = await blockchain.getMetaNonce(address)
    const subject = getAccountSubject(address, keyset.hash, metaNonce)
    window.location.href = genGoogleOAuthSignUrl(subject, email)
  }

  const auth0Verify = async () => {
    const oauthLoginStore = useOAuthLoginStore()
    LocalStorageService.set('RECOVERY_ORIGIN_STATE', JSON.stringify(recoveryStore.$state))
    const { email, address, keyset } = userStore.accountInfo
    const metaNonce = await blockchain.getMetaNonce(address)
    const subject = getAccountSubject(address, keyset.hash, metaNonce)
    await oauthLoginStore.auth0Login(undefined, email, subject, 'openid')
  }

  const startRecovery = async () => {
    const verificationEmailHashs = recoveryStore.verificationEmailHashs
    if (verificationEmailHashs.length === 0) {
      console.error('verificationEmailHashs length zero')
      return
    }

    if (!recoveryStore.canSendStartRecoveryTx) {
      console.error('can not send start recovery Tx')
      return
    }
    if (recoveryStore.isHaveTimeLock) {
      ElMessageBox.confirm($t('ResetPasswordTip'), $t('Notification'), {
        // showClose: false,
        confirmButtonText: $t('Continue'),
        cancelButtonText: $t('Cancel'),
      })
        .then(() => {
          recovery()
        })
        .catch(() => {})
    } else {
      ElMessageBox.alert($t('RecoveryTip'), $t('Notification'), {
        confirmButtonClass: $t('IKnow'),
      }).then(() => {
        recovery()
      })
      // recovery()
    }
  }

  const recovery = async () => {
    const verificationEmailHashs = recoveryStore.verificationEmailHashs
    form.loading = true
    const res = await api.startRecovery({
      email: userStore.accountInfo.email,
      verificationEmailHashs,
      auth2FaToken: recoveryStore.the2FA.token
        ? [
            {
              type: recoveryStore.the2FA.type,
              upAuthToken: recoveryStore.the2FA.token,
            },
          ]
        : undefined,
    })
    if (res.ok) {
      pollingKeysetHash()
    }
  }

  let pollingKeyset: NodeJS.Timer | undefined
  const pollingKeysetHash = async (time = 2) => {
    if (pollingKeyset) return
    const date = dayjs().add(time, 'minute')
    userStore.upLoading = true
    pollingKeyset = setInterval(async () => {
      await chainAccountStore.fetchAccountInfo(userStore.accountInfo.address, true)
      if (chainAccountStore.isRecoveryStarted(userStore.accountInfo.keyset.hash)) {
        userStore.upLoading = false

        if (form.guardians.length > 1) {
          upGA('recovery_guardian_success', { email: userStore.accountInfo.email })
        } else {
          upGA('recovery_policy_success', { email: userStore.accountInfo.email })
        }

        await api.syncUpdate()
        clearInterval(pollingKeyset)
        await clearStorage()
        // reset recoveryStore
        recoveryStore.$reset()

        router.replace({
          path: '/recovery/result',
          query: { address: userStore.accountInfo.address },
        })
        form.loading = false
      }
      // timeout
      if (date.isBefore(dayjs())) {
        userStore.upLoading = false
        clearInterval(pollingKeyset)
        ElMessageBox.alert($t('RecoveryRestart'), $t('RecoveryTimeout'), {
          confirmButtonText: $t('Confirm'),
          // showClose: false,
        }).then(() => {
          // clear password
          recoveryStore.password = ''
          recoveryStore.confirmPassword = ''
          recoveryStore.step = 1
        })
      }
    }, 4000)
  }

  let pollingEmail: NodeJS.Timer | undefined
  const pollingCheckEmail = async (time = 30) => {
    if (pollingEmail) return

    const date = dayjs().add(time, 'minute')

    const checkGuardianVerificationStatus = async () => {
      const res = await api.sendRecoveryStatus(userStore.accountInfo.email)

      if (res.ok) {
        const verificationEmailHashs: string[] = []
        for (const e of res.data) {
          const i = form.guardians.findIndex((guardian) => guardian.emailHash === e.emailHash)

          if (i > -1 && (e.status === 1 || e.status === 2)) {
            verificationEmailHashs.push(form.guardians[i].emailHash)
            form.guardians[i].status = e.status
            if (form.guardians[i].type !== 'success') {
              form.guardians[i].type = 'success'
            }
          }
        }
        recoveryStore.verificationEmailHashs = verificationEmailHashs

        if (form.guardians.every((e) => e.type === 'success')) clearInterval(pollingEmail)

        const sendRecoveryAction = calculateGuardianWeight(
          userStore.accountInfo.keyset.keysetJson,
          recoveryStore.verificationEmailHashs,
        )
        recoveryStore.isHaveTimeLock = sendRecoveryAction.isHaveTimeLock
        recoveryStore.canSendStartRecoveryTx = sendRecoveryAction.canSendStartRecoveryTx
      }
      // timeout
      if (date.isBefore(dayjs())) {
        clearInterval(pollingEmail)
        ElMessageBox.alert($t('RecoveryRestart'), $t('RecoveryTimeout'), {
          confirmButtonText: $t('Confirm'),
          // showClose: false,
        }).then(() => {
          // clear password
          recoveryStore.password = ''
          recoveryStore.confirmPassword = ''
          recoveryStore.step = 1
        })
      }
    }

    await checkGuardianVerificationStatus()
    pollingEmail = setInterval(checkGuardianVerificationStatus, 4000)
  }

  const progress = computed(() => {
    let n = 0
    if (recoveryStore.the2FA.verify === 'success') {
      n += 40
    }
    for (const guardian of form.guardians) {
      if (guardian.type === 'success') {
        if (guardian.email === registerEmail.value) {
          n += guardian.weight
        } else {
          n += guardian.weight
        }
      }
    }
    if (n > 100) n = 100
    return n
  })

  onBeforeMount(async () => {
    const guardianEmail = getGuardianEmailData(userStore.accountInfo.keyset.keysetJson)

    form.guardians = guardianEmail.map((item) => {
      return {
        ...item,
        countDown: 0,
        n: undefined,
        disbaled: false,
        status: 0,
        type: item.isDkimEmail ? 'send' : 'openId',
      }
    })

    const account_info = await DB.getAccountInfo()
    if (!account_info) return
    recoveryStore.oauth_provider = account_info.oauth_provider
    if (recoveryStore.oauthSignToken) {
      pollingCheckEmail()
    } else {
      init()
    }

    registerEmail.value = userStore.accountInfo.email
  })

  onUnmounted(() => {
    clearInterval(pollingEmail)
    clearInterval(pollingKeyset)
  })

  const init = async () => {
    const res = await api.authenticatorList({ email: recoveryStore.email, showAllStatus: true })
    if (res.ok) {
      for (const e of res.data) {
        if (e.status === 1) {
          if (e.type === 1 || e.type === 2) {
            recoveryStore.the2FA.verify = 'need'
            return
          }
        }
      }
    }
    if (form.guardians.length === 1) {
      recoveryStore.the2FA.verify = ''
    }

    if (form.guardians.length > 1) {
      upGA('recovery_guardian_start')
    } else {
      upGA('recovery_policy_start')
    }
  }

  return {
    form,
    sendEmail,
    googleAuthVerify,
    auth0Verify,
    recoveryStore,
    startRecovery,
    pollingCheckEmail,
    registerEmail,
    progress,
  }
}

export interface Emits {
  (event: 'back'): void
  (event: 'token', token: string, type: AuthType): void
}
export const useRecoveryGuardianVerify = ($emit: Emits) => {
  // const loginStore = useLoginStore()
  const isDark = useDark()

  // computed
  const disabled = computed(() => {
    if (twoStep.active === 'google') {
      return !google.form.code
    } else if (twoStep.active === 'phone') {
      return !phone.form.code
    } else {
      return true
    }
  })
  const loading = computed(() => {
    if (twoStep.active === 'google') {
      return google.form.loading
    } else if (twoStep.active === 'phone') {
      return phone.form.loading
    } else {
      return true
    }
  })
  const twoStep = reactive({
    phone: '',
    google: '',
    active: '',
  })

  // 2fa
  const submit = () => {
    if (twoStep.active === 'google') {
      google.verify()
    } else if (twoStep.active === 'phone') {
      phone.verify()
    }
  }
  const login = async (token: string, type: AuthType) => {
    $emit('token', token, type)
  }
  const recoverStore = useRecoveryStore()
  const registerEmail = recoverStore.email
  const google = useGoogleCode(registerEmail, login)
  const phone = usePhoneCode(registerEmail, login)

  const init = async () => {
    const res = await api.authenticatorList({
      email: registerEmail,
      showAllStatus: true,
    })
    if (res.ok) {
      for (const e of res.data) {
        if (e.status === 1) {
          if (e.type === 1) {
            twoStep.phone = e.value
            twoStep.active = 'phone'
          } else if (e.type === 2) {
            twoStep.google = e.value
            twoStep.active = 'google'
          }
        }
      }
    }
  }

  init()

  return {
    isDark,
    loading,
    disabled,
    submit,
    twoStep,
    google,
    phone,
    // loginStore,
  }
}
