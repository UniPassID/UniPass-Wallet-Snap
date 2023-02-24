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
      progress: '0',
    }
  },
  getters: {},
  actions: {
    async fetchAccountInfo(account: string, forceFetch = false, currentKeysetHash?: string) {
      if (this.initialized && !forceFetch) return
      console.log('------------------------fetchAccountInfo---------------------')
      const data = await blockchain.getAccountInfo(account, currentKeysetHash)
      console.log(data)
      let progress = '0'
      if (data.isPending) {
        progress = this.updatePercentage(data.lockDuration, data.unlockTime)
      }
      this.$state = { ...data, initialized: true, progress }
    },
    isRecoveryStarted(newKeysetHash: string): boolean {
      // in pending status
      if (this.isPending === true && newKeysetHash === this.pendingKeysetHash) {
        return true
      }
      // finish recovery immediately
      return (
        this.isPending === false &&
        newKeysetHash === this.keysetHash &&
        this.keysetHash !== ADDRESS_ZERO
      )
    },
    updatePercentage(lockDuration: number, unlockTime: number) {
      if (lockDuration === 0) return '0.00'
      const percentage = ((lockDuration - (unlockTime - dayjs().unix())) * 100) / lockDuration
      console.log(percentage)
      return Math.min(percentage, 100).toFixed(2)
    },
    isKeysetHashUpdated(oldKeysetHash: string, newKeysetHash?: string) {
      return this.keysetHash !== oldKeysetHash || this.keysetHash === newKeysetHash
    },
  },
})
