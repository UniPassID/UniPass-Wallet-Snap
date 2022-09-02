import { GuardiansInfo } from '@/composable/useRegisterGuardian'
import { generateSessionKey } from '@/utils/session-key'
import dayjs from 'dayjs'
import {
  generateKdfPassword,
  generatePermit,
  generateKeysetHash,
  generateAccountAddress,
  getCloudKeyFromMM,
  signMsgWithMM,
} from '@/utils/cloud-key'
import api, { SignUpAccountInput } from '@/service/backend'
import { User, useUserStore } from '@/store/user'
import router from '@/plugins/router'

export const useRegisterStore = defineStore({
  id: 'registerStore',
  state: () => {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      token: '',
      guardians: [] as GuardiansInfo[],
      step: 1,
    }
  },
  actions: {
    async register() {
      const sessionKey = await generateSessionKey()
      // const cloudKey = await generateCloudKey(this.password)
      const cloudKey = await getCloudKeyFromMM()
      console.log('[cloud key] ', cloudKey)
      const originEmails = [this.email]
      const recoveryEmails = [] as string[]

      const timestamp = dayjs().add(4, 'hour').unix()
      // const kdfPassword = generateKdfPassword(this.password)
      // const keyStore = cloudKey.encryptedKey
      // const sig = await signMsg(
      //   'up cloud key server upload request:' + timestamp,
      //   cloudKey.privkey,
      //   false,
      // )
      const sig = await signMsgWithMM('up cloud key server upload request:' + timestamp, cloudKey)

      for (const guardian of this.guardians) {
        originEmails.push(guardian.recoveryEmail)
        recoveryEmails.push(guardian.recoveryEmail)
      }

      const data: SignUpAccountInput = {
        email: this.email,
        upAuthToken: this.token,
        keyset: {
          email: this.email,
          cloudKeyAddress: cloudKey,
          threshold: recoveryEmails.length > 0 ? 2 : 1,
          originEmails,
        },
        cloudKey: {
          cloudKeyAddress: cloudKey,
          timestamp,
          sig,
          // kdfPassword,
          // keyStore,
        },
      }

      // const permit = await generatePermit(sessionKey.address, timestamp, cloudKey.privkey)
      const keysetHash = generateKeysetHash(cloudKey, data.keyset.threshold, originEmails)

      // only register use
      const accountAddress = generateAccountAddress(keysetHash)

      const res = await api.signUpAccount(data)
      if (res.ok) {
        if (res.data.address === accountAddress) {
          // success regsiter
        } else {
          console.log('err', 'accountAddress inconsistent')
          // todo error accountAddress inconsistent
        }
      } else {
        console.log('err', res)
        // todo error signUpAccount
      }
      const userStore = useUserStore()
      const user: User = {
        email: data.email,
        account: accountAddress,
        keyset: {
          hash: keysetHash,
          cloudKeyAddress: data.keyset.cloudKeyAddress,
          recoveryEmails: {
            threshold: data.keyset.threshold,
            emails: data.keyset.originEmails,
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
        step: 'register',
      }
      await userStore.update(user)
      // reset registerStore
      this.$reset()
      router.push({
        path: '/register/loading',
        query: {
          email: user.email,
        },
      })
    },
  },
})
