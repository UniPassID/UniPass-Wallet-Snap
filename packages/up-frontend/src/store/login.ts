// import { decryptCloudKey } from '@/utils/cloud-key'

import api from '@/service/backend'
import { decryptCloudKey, generatePermit, signMsg } from '@/utils/cloud-key'
import { generateSessionKey } from '@/utils/session-key'
import dayjs from 'dayjs'
import { useUserStore, User } from '@/store/user'
import router from '@/plugins/router'

export const useLoginStore = defineStore({
  id: 'loginStore',
  state: () => {
    return {
      loading: false,
      email: '',
      password: '',
      token: '',
      step: 1,
    }
  },
  actions: {
    async login(keystore: string, accountAddress: string) {
      const cloudKey = await decryptCloudKey(keystore, this.password)
      const sessionKey = await generateSessionKey()
      const timestamp = dayjs().add(4, 'hour').unix()
      const sig = await signMsg('login UniPass' + timestamp, sessionKey.privkey, false)
      const permit = await generatePermit(sessionKey.address, timestamp, cloudKey.privkey)
      const res = await api.queryAccountKeyset({
        email: this.email,
        upAuthToken: '',
        sessionKeyPermit: {
          timestamp: timestamp,
          timestampNow: timestamp,
          permit: permit,
          sessionKeyAddress: sessionKey.address,
          sig,
        },
      })
      if (res.ok) {
        const { address: cloudKeyAddress, threshold, originEmails, keysetHash } = res.data
        const user: User = {
          email: this.email,
          account: accountAddress,
          keyset: {
            hash: keysetHash,
            cloudKeyAddress,
            recoveryEmails: {
              threshold,
              emails: originEmails,
            },
          },
          committed: true,
        }
        // login success
        await this.postLogin(user)
      }
    },
    async postLogin(user: User) {
      const userStore = useUserStore()
      await userStore.update(user)
      localStorage.setItem('email', user.email)
      // reset loginStore
      this.$reset()
      router.push('/')
    },
  },
})
