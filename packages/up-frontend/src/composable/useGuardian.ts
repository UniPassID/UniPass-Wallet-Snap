import { Wallet } from 'ethers'
import api, { AuditStatus, GuardianData, SignType } from '@/service/backend'
import blockchain from '@/service/blockchain'
import { useUserStore } from '@/store/user'
import { hideSecurityInformation, setGuardianForKeyset, sha256Hash } from '@/utils/rbac'
import { upError, upGA, useUniPass } from '@/utils/useUniPass'
import { ElMessageBox, FormInstance } from 'element-plus'
import { UpdateKeysetHashTxBuilder } from '@unipasswallet/transaction-builders'
import { Keyset } from '@unipasswallet/keys'
import dayjs from 'dayjs'
import { useChainAccountStore } from '@/store/chain-account'
import { AccountInfo } from '@/store/oauth_login'
import DB from '@/store/index_db'
import { clearUpSignToken } from '@/utils/oauth/check_up_sign_token'
import emailDict from '@/utils/email-dict'
import { SignType as SignTypeUP } from '@unipasswallet/keys'
import { solidityPack } from 'ethers/lib/utils'
import { signMsgWithMM } from '@/service/snap-rpc'

export type GuardiansStatus = 'send' | 'openId' | 'pending' | 'success' | 'error'
export type GuardiansAuthType = 'delete' | 'add'

export interface GuardiansInfo {
  recoveryEmail: string
  type: GuardiansStatus
  added: boolean
  count: number
  loading: boolean
  isSelfGuardian: boolean
  n: any
  // hash
  emailHash: string
  pepper: string
  rawOrHash: 'Raw' | 'Hash'
}

const chainAccountStore = useChainAccountStore()

export const useGuardian = () => {
  const router = useRouter()
  const { t: $t } = useI18n()
  const userStore = useUserStore()
  const formElement = ref<FormInstance>()
  const authElement = ref<FormInstance>()
  const unipass = useUniPass()
  const form = reactive({
    isDelete: false,
    show: false,
    showEmailTip: false,
    email: '',
    loading: false,
    guardians: [] as GuardiansInfo[],
    guardiansBackup: '',
    // keyset
    keysetJson: '',
    hash: '',
  })
  const auth = reactive({
    type: '' as GuardiansAuthType,
    show: false,
    password: '',
    loading: false,
  })

  const submitDisabled = computed(
    () => form.guardians.map((e) => e.recoveryEmail).join(',') === form.guardiansBackup,
  )

  let polling: NodeJS.Timer | undefined
  const pollingCheckEmail = async (time = 30) => {
    const accountInfo = userStore.accountInfo
    if (polling) return

    const date = dayjs().add(time, 'minute')
    polling = setInterval(async () => {
      const res = await api.getGuardianToken(accountInfo.email)
      if (res.ok) {
        for (const e of res.data) {
          for (let i = 0; i < form.guardians.length; i++) {
            const guardian = form.guardians[i]
            if (guardian.recoveryEmail === e.email && e.verified) {
              if (form.guardians[i].type !== 'success') {
                form.guardians[i].type = 'success'
              }
            }
          }
          if (res.data.every((e) => e.verified)) {
            clearInterval(polling)
            polling = undefined
          }
        }
      }
      // timeout
      if (date.isBefore(dayjs())) {
        clearInterval(polling)
        polling = undefined
        ElMessageBox.alert($t('RecoveryRestart'), $t('RecoveryTimeout'), {
          confirmButtonText: $t('Confirm'),
          // showClose: false,
        }).then(() => {
          //
        })
      }
    }, 4000)
  }

  const sendLink = (index: number) => {
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok && checkEmail()) {
        const accountInfo = userStore.accountInfo
        if (
          form.guardians.find((e) => e.recoveryEmail === form.email) ||
          form.email === accountInfo.email
        ) {
          unipass.error($t('HaveAdded'))
          return
        }

        const i = index === -1 ? form.guardians.length : index
        const email = index === -1 ? form.email : form.guardians[i].recoveryEmail
        form.loading = true
        const res = await api.sendGuardianLink({
          email,
          registerEmail: accountInfo.email,
        })
        form.loading = false

        if (res.ok) {
          if (form.guardians.find((e) => e.recoveryEmail === email) === undefined) {
            const pepper = Wallet.createRandom().privateKey
            form.guardians.push({
              recoveryEmail: email,
              type: 'send',
              added: false,
              n: 0,
              count: 60,
              loading: false,
              isSelfGuardian: false,
              emailHash: sha256Hash(email, pepper),
              pepper,
              rawOrHash: 'Raw',
            })
          }
          form.guardians[i].type = 'pending'
          form.guardians[i].count = 60
          form.guardians[i].n = setInterval(() => {
            if (form.guardians[i]) {
              form.guardians[i].count--
              if (form.guardians[i].count === 0) {
                clearInterval(form.guardians[i].n)
              }
            }
          }, 1000)
          pollingCheckEmail()
          unipass.success($t('SendSuccess'))

          form.email = ''
          form.show = false
        }
      }
    })
  }

  const checkKeysetHash = async () => {
    const date = dayjs().add(2, 'minute')
    const accountInfo = await DB.getAccountInfo()
    if (!accountInfo) return
    const { address, keyset, email } = accountInfo
    polling = setInterval(async () => {
      await chainAccountStore.fetchAccountInfo(address, true, keyset.hash)
      if (chainAccountStore.isKeysetHashUpdated(keyset.hash, form.hash)) {
        const _accountInfo: AccountInfo = {
          ...accountInfo,
          keyset: {
            ...accountInfo.keyset,
            hash: form.hash,
            keysetJson: hideSecurityInformation(form.keysetJson),
          },
        }
        await userStore.update(_accountInfo)
        userStore.upLoading = false

        if (auth.type === 'delete') {
          upGA('guardian_del_success', { email })
        } else {
          upGA('guardian_add_success', { email })
        }

        await api.syncUpdate()
        clearInterval(polling)
        polling = undefined
        auth.password = ''
        auth.show = false

        if (auth.type === 'delete') {
          for (const e of deleteChecked.value) {
            const i = form.guardians.findIndex((item) => item.recoveryEmail === e)
            if (i !== -1) {
              clearInterval(form.guardians[i].n)
              form.guardians.splice(i, 1)
            }
          }
          deleteChecked.value = []
          unipass.success($t('DeleteSuccess'))
          form.isDelete = false
        } else {
          unipass.success($t('AddSuccess'))
        }
        for (let i = 0; i < form.guardians.length; i++) {
          const guardian = form.guardians[i]
          guardian.added = true
        }
        // delete
        form.guardiansBackup = form.guardians.map((e) => e.recoveryEmail).join(',')
        auth.loading = false
      }
      // timeout
      if (date.isBefore(dayjs())) {
        userStore.upLoading = false
        clearInterval(polling)
        polling = undefined
        unipass.error($t('NetworkError'))
        auth.loading = false
      }
    }, 4000)
  }

  const authentication = async () => {
    auth.loading = true
    let guardians = []
    if (auth.type === 'delete') {
      guardians = JSON.parse(JSON.stringify(form.guardians)) as GuardiansInfo[]
      for (const e of deleteChecked.value) {
        const i = guardians.findIndex((item) => item.recoveryEmail === e)
        if (i !== -1) {
          clearInterval(guardians[i].n)
          guardians.splice(i, 1)
        }
      }
    } else {
      guardians = form.guardians
    }
    const guardianData = guardians.map((e) => {
      return {
        email: e.recoveryEmail,
        isSelfGuardian: e.isSelfGuardian,
        emailHash: e.emailHash,
        pepper: e.pepper,
        rawOrHash: e.rawOrHash,
      }
    })
    try {
      const ok = await updateGuardian(guardianData)
      if (ok) {
        userStore.upLoading = true
        await checkKeysetHash()
        auth.show = false
      }
    } catch (e: any) {
      upError(e?.message || 'unknown error')
      throw new Error(e)
    } finally {
      auth.loading = false
    }
  }

  const updateGuardian = async (guardianData: GuardianData[]) => {
    const accountInfo = await DB.getAccountInfo()
    if (!accountInfo) return

    const {
      email,
      address,
      keyset: { keysetJson, masterKeyAddress },
    } = accountInfo
    const oldKeyset = Keyset.fromJson(keysetJson)
    const keyset = setGuardianForKeyset(oldKeyset, guardianData)
    form.keysetJson = keyset.toJson()
    form.hash = keyset.hash()
    const checkKeysetRes = await api.checkKeyset({
      keysetJson: keyset.toJson(),
      isAddGuradian: keyset.keys.length > oldKeyset.keys.length,
    })
    if (!checkKeysetRes.ok) {
      if (checkKeysetRes.statusCode === 5028) {
        upError($t('HaveAdded'))
      } else {
        upError($t('AddGuardianFailed'))
      }
      console.error('api check keyset error')
      return false
    }

    const metaNonce = await blockchain.getMetaNonce(address)
    const txBuilder = new UpdateKeysetHashTxBuilder(address, metaNonce, keyset.hash(), false, '0x')
    const digestHash = txBuilder.digestMessage()
    const auditRes = await api.audit({
      type: SignType.PersonalSign,
      content: txBuilder.build(),
      msg: digestHash,
    })

    if (auditRes.ok) {
      clearUpSignToken()
      if (auditRes.data.approveStatus === AuditStatus.Approved) {
        try {
          const prefix =
            'You are currently updating the guardian details for your Smart Wallet Snap'
          const sig = await signMsgWithMM(digestHash, masterKeyAddress, email, prefix)
          const masterKeySig = solidityPack(['bytes', 'uint8'], [sig, SignTypeUP.EthSign])

          const updateGuardianKeysetRes = await api.updateGuardian({ masterKeySig })
          if (updateGuardianKeysetRes.ok) {
            return true
          }
          return false
        } catch (e: any) {
          if (e?.message === 'invalid password') {
            upError($t('IncorrectPassword'))
          }
          return false
        }
      } else {
        if (auditRes.data.approveStatus === AuditStatus.Confirming) {
          upError($t('SignRequestConfirming'))
        } else if (auditRes.data.approveStatus === AuditStatus.Rejected) {
          upError($t('SignRequestRejected'))
        } else {
          upError(`unknown error`)
        }
      }
    }
    return false
  }

  const deleteChecked = ref([] as string[])

  const submit = (authType: GuardiansAuthType) => {
    if (form.guardians.every((e) => e.type === 'success')) {
      if (authType === 'add') {
        upGA('setguardian_add_strat')
      } else {
        upGA('setguardian_delete_strat')
      }
      // TODO 是否需要移除 authentication 方法
      auth.type = authType
      authentication()
      clearInterval(polling)
      polling = undefined
      for (const guardia of form.guardians) {
        clearInterval(guardia.n)
      }
    } else {
      unipass.error($t('HaveWaitingGuardian'))
    }
  }

  const back = () => {
    if (submitDisabled.value) {
      router.replace('/setting')
    } else {
      ElMessageBox.confirm($t('ActionNotCommitted'), $t('Notification'), {
        confirmButtonText: $t('Confirm'),
        cancelButtonText: $t('Cancel'),
        center: true,
        // showClose: false,
      })
        .then(() => {
          router.replace('/setting')
        })
        .catch(() => {})
    }
  }

  const closeGuardian = (i: number) => {
    clearInterval(form.guardians[i].n)
    form.guardians.splice(i, 1)
  }

  const checkEmail = () => {
    if (form.showEmailTip) {
      return true
    }

    const email = form.email
    const i = email.indexOf('@')
    if (i !== -1) {
      const prefix = email.slice(0, i)
      const suffix = email
        .slice(i + 1)
        .replaceAll('@', '')
        .toLowerCase()

      // icloud
      if (emailDict.apple.includes(suffix)) {
        if (prefix.includes('.') || prefix.includes('_')) {
          // tip
          ElMessageBox({
            title: $t('ImportantNotification'),
            message: h('p', null, [
              h('span', null, $t('EmailTip1')),
              h('strong', { style: 'color: var(--up-text-primary)' }, $t('EmailTip2')),
              h('span', null, $t('EmailTip3')),
              h('strong', { style: 'color: var(--up-text-primary)' }, $t('EmailTip4')),
              h('span', null, $t('EmailTip5')),
            ]),
            confirmButtonText: $t('Confirm'),
            showCancelButton: false,
          })
            .then(() => {
              form.showEmailTip = true
            })
            .catch(() => {
              form.showEmailTip = true
            })
          return false
        }
      }
    }
    return true
  }

  const init = async () => {
    const accountInfo = await DB.getAccountInfo()

    if (!accountInfo) return
    const keysetJson = accountInfo?.keyset.keysetJson
    if (keysetJson) {
      const keyset = JSON.parse(keysetJson)
      const list = keyset.slice(2, -1)
      for (const e of list) {
        console.log(e)
        form.guardians.push({
          recoveryEmail: e.KeyEmailDkim.emailFrom,
          type: 'success',
          added: true,
          n: 0,
          count: 0,
          loading: false,
          isSelfGuardian: false,
          emailHash: e.KeyEmailDkim.emailHash,
          pepper: e.KeyEmailDkim.pepper,
          rawOrHash: 'Hash',
        })
      }
      form.guardiansBackup = form.guardians.map((e) => e.recoveryEmail).join(',')
    }
  }

  init()

  onUnmounted(() => {
    clearInterval(polling)
    polling = undefined
    for (const guardia of form.guardians) {
      clearInterval(guardia.n)
    }
  })

  return {
    back,
    sendLink,
    authentication,
    deleteChecked,
    submitDisabled,
    submit,
    formElement,
    authElement,
    unipass,
    form,
    auth,
    userStore,
    closeGuardian,
  }
}
