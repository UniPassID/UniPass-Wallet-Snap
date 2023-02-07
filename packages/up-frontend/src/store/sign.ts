import jwt_decode from 'jwt-decode'
import { TransactionType, upError } from '@/utils/useUniPass'
import { useUserStore } from '@/store/user'
import { TokenInfo } from '@/service/chains-config'
import router from '@/plugins/router'
import { AppSettings, UPTransactionMessage } from '@unipasswallet/popup-types'
import { formatEther } from 'ethers/lib/utils'
import { BigNumber, utils } from 'ethers'
import UnipassWalletProvider, { ChainType, TransactionProps } from '@unipasswallet/provider'
import { etherToWei } from '@/service/format-bignumber'
import { ADDRESS_ZERO } from '@/service/constants'
import { FeeOption } from '@unipasswallet/relayer'
import { IdTokenParams } from '@/utils/oauth/parse_hash'
import DB from './index_db'
import {
  handleOAuthForSendTransaction,
  handleOAuthForSignMessage,
  updateUpSignToken,
} from '@/utils/oauth/check_up_sign_token'
import { isSameAddress } from '@/utils/string-utils'
import { formatUnits } from 'ethers/lib/utils'
import { convertSelector } from '@/service/convert-selector'

interface Card {
  show: boolean
  type: TransactionType
  data: any
  actionName?: string
}

interface FeeItem {
  to: string
  amount: string
  gasLimit: number
  token: TokenInfo
}

export enum SignMessageType {
  v1 = 'V1',
  v4 = 'V4',
}

interface SignMessage {
  loading: boolean
  msg: string
  typedData: any
  from: string
  type: SignMessageType
  referrer: string
}

export interface SignStoreState {
  cards: Card[]
  feeSymbol: string
  feeOptions: FeeItem[]
  loading: boolean
  chain: ChainType
  symbol: string
  gasFeeLoading: boolean
  redirectUrl?: string
  signMassage: SignMessage
  walletConnectId?: number
  walletConnectTopic: string
  fromWalletConnectSign: boolean
}

export const useSignStore = defineStore({
  id: 'signStore',
  state: (): SignStoreState => {
    return {
      cards: [],
      feeOptions: [],
      feeSymbol: '',
      loading: false,
      chain: 'polygon',
      symbol: 'MATIC',
      gasFeeLoading: true,
      redirectUrl: '', // for third part sdk redirect
      signMassage: {
        loading: false,
        type: SignMessageType.v1,
        typedData: {},
        msg: '',
        from: '',
        referrer: '',
      },
      walletConnectId: undefined,
      walletConnectTopic: '',
      fromWalletConnectSign: false,
    }
  },
  getters: {
    coin(state) {
      const chain = state.chain
      const symbol = state.symbol
      return useUserStore().coins.find((e) => e.chain === chain && e.symbol === symbol)
    },
  },
  actions: {
    async restoreSignState(signState: string, idToken: string, type: 'signMessage' | 'sendTx') {
      try {
        const state = JSON.parse(signState) as SignStoreState
        state.feeSymbol = ''
        this.$state = state
        const account_info = await DB.getAccountInfo()
        if (!account_info) return

        if (type === 'signMessage') {
          await updateUpSignToken(idToken, () => handleOAuthForSignMessage(signState))
        } else {
          const { nonce } = jwt_decode<IdTokenParams>(idToken)
          if (nonce.startsWith('update-up-sign-token')) {
            await updateUpSignToken(idToken, () =>
              handleOAuthForSendTransaction('upSignToken', signState),
            )
          } else {
            await updateUpSignToken(idToken, () =>
              handleOAuthForSendTransaction('multiSync', signState),
            )
          }
        }
      } catch (e) {
        return
      }
    },
    // TODO check payload is valid
    async initPopUp(appSetting: AppSettings, payload: UPTransactionMessage) {
      const userStore = useUserStore()
      const chain = appSetting.chain || sessionStorage.chain
      if (!chain) {
        upError('not found chain')
        return
      }
      const coin = userStore.coins.find(
        (e) => e.chain === chain && e.contractAddress === ADDRESS_ZERO,
      )
      if (!coin) {
        upError('not found coin')
        return
      }
      this.init(coin.chain, coin.symbol)
      if (!isSameAddress(payload.from, userStore.accountInfo.address)) {
        upError('address inconsistent')
        return
      }
      if (payload.data && payload.data !== '0x') {
        const functionName = await convertSelector(payload.data)
        console.log(`functionName: ${functionName}`)

        const ABI = ['function transfer(address _to, uint256 _value)']
        const iface = new utils.Interface(ABI)
        try {
          const decodedData = iface.parseTransaction({ data: payload.data })
          const coin = userStore.coins.find(
            (e) => e.chain === chain && isSameAddress(e.contractAddress, payload.to),
          )
          if (coin) {
            const amount = formatUnits(decodedData.args[1], coin.decimals)
            const address = decodedData.args[0]
            this.initCards([
              {
                show: true,
                type: 'send-token',
                data: {
                  amount,
                  address,
                  symbol: coin.symbol,
                  chain: coin.chain,
                  // price: coin.price || -1,
                },
                actionName: functionName,
              },
            ])
            return
          }
        } catch (error) {
          //
        }
        this.initCards([
          {
            show: true,
            type: 'contract-call',
            data: {
              data: payload.data,
              to: payload.to,
              symbol: coin.symbol,
              chain: coin.chain,
              value: payload.value,
            },
            actionName: functionName,
          },
        ])
      } else {
        this.initCards([
          {
            show: true,
            type: 'send-token',
            data: {
              amount: formatEther(BigNumber.from(payload.value)),
              address: payload.to,
              symbol: coin.symbol,
              chain: coin.chain,
              // price: coin.price || -1,
            },
          },
        ])
      }
    },
    init(chain: ChainType, symbol: string) {
      this.symbol = symbol
      this.chain = chain
      if (!this.coin) {
        router.back()
      }
    },
    initCards(cards: Card[]) {
      this.cards = cards
    },
    async updateGasFee() {
      const accountInfo = await DB.getAccountInfo()
      UnipassWalletProvider.getInstance().setAccountInfo(accountInfo)
      const sponsored = await this.checkGasSponsored()
      if (!sponsored) {
        const gasLimit = await this.estimateGasLimit()
        await this.updateFeeItemsByGasLimit(gasLimit ?? BigNumber.from(200000))
      } else {
        this.feeOptions = []
      }
    },
    async checkGasSponsored() {
      const userStore = useUserStore()
      const accountInfo = await DB.getAccountInfo()
      console.log('accountInfo: ', accountInfo)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      /* @ts-ignore */
      const wallet = await userStore.unipassWallet.wallet(this.chain, accountInfo)
      const feeOptions = await wallet.relayer?.getFeeOptions(BigNumber.from(600_000).toHexString())
      if (feeOptions?.options?.length && feeOptions?.options?.length > 0) {
        return false
      }
      return true
    },
    async estimateGasLimit() {
      const userStore = useUserStore()
      const transaction = this.getTransaction()
      if (!transaction) return

      let gasLimit = BigNumber.from(500000)
      if (transaction.chain === 'rangers') return gasLimit
      try {
        const ret = await userStore.unipassWallet.estimateTransferTransactionsGasLimits(transaction)
        gasLimit = ret.gasLimit
      } catch (err) {
        // TODO: for account sync, return default gas limit 500000
        console.log('Need Account Sync', err)
      }

      return gasLimit
    },
    async updateFeeItemsByGasLimit(gasLimit: BigNumber) {
      const userStore = useUserStore()
      const wallet = await userStore.unipassWallet.wallet(this.chain)
      const feeOptions = await wallet.relayer?.getFeeOptions(gasLimit.toHexString())
      if (feeOptions?.options) {
        this.feeOptions = []

        // FIX: relayer returned token symbol is camel case
        for (const option of feeOptions.options) {
          const feeOption = option as FeeOption
          const contractAddress = feeOption.token.contractAddress ?? ADDRESS_ZERO
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const transferGas = BigNumber.from(feeOption.token.transferGas ?? 20000).add(
            BigNumber.from(feeOption.gasLimit),
          )

          const amount = transferGas
            .mul(BigNumber.from(feeOption.amount))
            .div(BigNumber.from(feeOption.gasLimit))

          const token = userStore.coins.find(
            (x) =>
              x.chain === this.chain &&
              x.contractAddress.toLowerCase() === contractAddress.toLowerCase(),
          )

          // TODO: show fee tokens not in useStore.coins
          if (token) {
            this.feeOptions.push({ ...feeOption, token: token, amount: amount.toHexString() })
          }
        }
      }
    },
    getTransaction() {
      const userStore = useUserStore()
      for (const { data, type } of this.cards) {
        const coin = userStore.coins.find((e) => e.symbol === data.symbol && e.chain === data.chain)
        if (!coin) {
          console.error('not found coin')
          return
        }

        const feeCoin = this.feeOptions.find((e) => e.token.symbol === this.feeSymbol)

        let fee
        if (feeCoin && data.chain !== 'rangers') {
          fee = {
            token: feeCoin.token.contractAddress || ADDRESS_ZERO,
            value: BigNumber.from(feeCoin.amount),
            receiver: feeCoin.to,
          }
        }

        if (type === 'contract-call') {
          const transaction: TransactionProps = {
            tx: {
              target: data.to,
              value:
                !data.value || data.value === '0x' ? BigNumber.from(0) : BigNumber.from(data.value),
              revertOnError: true,
              data: data.data,
            },
            fee,
            chain: coin.chain,
          }
          return transaction
        }
        if (coin.contractAddress === ADDRESS_ZERO) {
          const transaction: TransactionProps = {
            tx: { target: data.address, value: etherToWei(data.amount), revertOnError: true },
            fee,
            chain: coin.chain,
          }
          return transaction
        } else {
          const erc20Interface = new utils.Interface([
            'function transfer(address _to, uint256 _value)',
          ])
          const erc20TokenData = erc20Interface.encodeFunctionData('transfer', [
            data.address,
            etherToWei(data.amount, coin.decimals),
          ])
          const transaction: TransactionProps = {
            tx: {
              target: coin.contractAddress,
              value: etherToWei('0'),
              revertOnError: true,
              data: erc20TokenData,
            },
            fee,
            chain: coin.chain,
          }
          return transaction
        }
      }
    },
  },
})
