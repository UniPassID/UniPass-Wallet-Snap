import router from '@/plugins/router'
import db from '@/store/db'

export interface BalanceInfo {
  balance: string
  symbol: string
  gasFee: string
  decimals: number
  contractAddress: string
}

export type StepType = 'register' | 'recovery'

export interface User {
  email: string
  account: string
  keyset: {
    hash: string
    cloudKeyAddress: string
    recoveryEmails: {
      threshold: number
      emails: string[]
    }
  }
  // sessionKey: {
  //   localKey: {
  //     keystore: string
  //     address: string
  //   }
  //   aesKey: CryptoKey
  //   authorization: string
  //   expires: number
  // }
  committed: boolean
  step?: StepType
  stepData?: any
}

export const useUserStore = defineStore({
  id: 'user',
  state: () => {
    return {
      user: undefined as User | undefined,
      // https://test.wallet.unipass.id//api/v1/config
      mailServices: [] as string[],
      path: '',
      coins: [
        {
          symbol: 'MATIC',
          decimals: 18,
          balance: '0',
          gasFee: '0.00001',
          contractAddress: '0x0000000000000000000000000000000000000000',
        },
        {
          symbol: 'WETH',
          decimals: 18,
          balance: '0',
          gasFee: '0.000001',
          contractAddress: '0xC45b2FE29E3d2768eE253871Db93cA1F26e2Be50',
        },
        {
          symbol: 'USDC',
          decimals: 18,
          balance: '0',
          gasFee: '0.001',
          contractAddress: '0xce38a49eBf99c9272b4BC37A53357D81bc0f3b88',
        },
        {
          symbol: 'USDT',
          decimals: 6,
          balance: '0',
          gasFee: '0.001',
          contractAddress: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
        },
      ] as BalanceInfo[],
      showSupportEmail: false,
    }
  },
  actions: {
    async update(user: User) {
      this.user = user
      await db.setUser(user)
      localStorage.setItem('email', user.email)
    },
    exit(del?: boolean) {
      if (del) {
        db.delUser(this.user?.email || '')
      }
      this.user = undefined
      localStorage.removeItem('email')
      router.replace('/login')
    },
  },
})
