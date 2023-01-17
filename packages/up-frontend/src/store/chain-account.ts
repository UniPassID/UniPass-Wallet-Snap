import blockchain from '@/service/blockchain'
import { ADDRESS_ZERO } from '@/service/constants'
import dayjs from 'dayjs'

export const useChainAccountStore = defineStore({
  id: 'chainAccountStore',
  state: () => {
    return {
      initialized: false,

      isPending: false,
      pendingKeysetHash: '0x',
      keysetHash: '0x',
      unlockTime: 0,
      lockDuration: 0,
      timer: setTimeout(() => {}, 1),
    }
  },
  getters: {
    percentage(): string {
      if (this.lockDuration === 0) return '0.00'

      const percentage =
        ((this.lockDuration - (this.unlockTime - dayjs().unix())) * 100) / this.lockDuration
      return Math.min(percentage, 100).toFixed(2)
    },
  },
  actions: {
    async fetchAccountInfo(account: string, forceFetch = false, currentKeysetHash?: string) {
      if (this.initialized && !forceFetch) return
      console.log('------------------------fetchAccountInfo---------------------')

      const data = await blockchain.getAccountInfo(account, currentKeysetHash)
      this.$state = { ...data, initialized: true, timer: this.timer }

      // when unlock time expires, refetch pending status
      if (this.isPending) {
        this.timer = setTimeout(() => {
          this.fetchAccountInfo(account, true)
        }, Math.max(this.unlockTime + 5 - dayjs().unix(), 5) * 1000)
      } else {
        clearTimeout(this.timer)
      }
    },

    isRecoveryStarted(newKeysetHash: string): boolean {
      // in pending status
      if (this.isPending === true && newKeysetHash === this.pendingKeysetHash) {
        return true
      }

      // finish recovery immediately
      if (
        this.isPending === false &&
        newKeysetHash === this.keysetHash &&
        this.keysetHash !== ADDRESS_ZERO
      ) {
        return true
      }

      return false
    },

    isKeysetHashUpdated(oldKeysetHash: string, newKeysetHash?: string) {
      if (this.keysetHash !== oldKeysetHash || this.keysetHash === newKeysetHash) {
        return true
      } else {
        return false
      }
    },
  },
})
