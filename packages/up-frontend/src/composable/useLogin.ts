import api from '@/service/backend'
import { getCloudKeyFromMM, signMsgWithMM } from '@/utils/cloud-key'
import { ElMessage, FormInstance } from 'element-plus'
import { useLoginStore } from '@/store/login'
import dayjs from 'dayjs'
import { User } from '@/store/user'

export function useLogin() {
  // data
  const formElement = ref<FormInstance>()
  const emailElement = ref<HTMLInputElement>()
  const loginStore = useLoginStore()
  const route = useRoute()
  const unlockEmail = ref((route.query.email as string) || '')
  const submit = () => {
    if (!formElement.value) return
    formElement.value.validate(async (ok) => {
      if (ok) {
        const masterKeyAddress = await getCloudKeyFromMM()
        const timestamp = dayjs().add(10, 'minute').unix()
        const sig = await signMsgWithMM('login UniPass:' + timestamp, masterKeyAddress)

        const res = await api.queryAccountKeyset({
          email: loginStore.email,
          upAuthToken: '',
          masterkeySig: {
            timestamp,
            masterKeyAddress,
            sig,
          },
        })

        if (res.ok) {
          const { accountAddress, keysetHash, threshold, originEmails } = res.data

          const user: User = {
            email: loginStore.email,
            account: accountAddress,
            keyset: {
              hash: keysetHash,
              cloudKeyAddress: masterKeyAddress,
              recoveryEmails: {
                threshold,
                emails: originEmails,
              },
            },
            committed: true,
          }
          await loginStore.postLogin(user)
        } else {
          ElMessage.error({ message: 'sig verify error' })
        }
      } else {
        if (!loginStore.email) emailElement.value?.focus()
      }
    })
  }

  return {
    unlockEmail,
    loginStore,
    formElement,
    emailElement,
    submit,
  }
}
