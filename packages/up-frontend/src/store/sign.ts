import jwt_decode from 'jwt-decode'
import { TransactionType, upError } from '@/utils/useUniPass'
import { useUserStore } from '@/store/user'
import { getChainIdByChainType, TokenInfo } from '@/service/chains-config'
import router from '@/plugins/router'
import { AppSettings, UPTransactionMessage } from '@unipasswallet/popup-types'
import { formatEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, utils } from 'ethers'
import { ChainType, TransactionProps } from '@unipasswallet/provider'
import { etherToWei } from '@/service/format-bignumber'
import { ADDRESS_ZERO } from '@/service/constants'
import { SimulateResult } from '@unipasswallet/relayer'
import { IdTokenParams } from '@/utils/oauth/parse_hash'
import DB from './index_db'
import {
  handleOAuthForSendTransaction,
  handleOAuthForSignMessage,
  updateUpSignToken,
} from '@/utils/oauth/check_up_sign_token'
import { isSameAddress } from '@/utils/string-utils'
import { formatUnits } from 'ethers/lib/utils'
import { useCoinStore } from '@/store/coin'
import { initTheme } from '@/utils/init-theme'
import { convertSelector } from '@/service/convert-selector'
import { analyzeTransactionData, generateSimulateTransaction } from '@/service/tx-data-analyzer'
import i18n from '@/plugins/i18n'
import api, { SyncStatusEnum } from '@/service/backend'
import { getAuthNodeChain } from '@/service/chains-config'
import { checkStatusForSendTransaction } from '@/utils/oauth/check_up_sign_token'

export interface TransactionCard {
  show: boolean
  type: TransactionType
  tokenType: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'contract'
  data: any
  actionName?: string
  rawData?: UPTransactionMessage
}

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
  cards: TransactionCard[]
  feeSymbol: string
  feeOptions: FeeItem[]
  loading: boolean
  appIcon: string
  appName: string
  referrer: string
  chain: ChainType
  symbol: string
  transaction: UPTransactionMessage
  gasFeeLoading: boolean
  gasFeeLoadSuccess: boolean
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
      appIcon: '',
      appName: '',
      referrer: '',
      chain: 'polygon',
      symbol: 'MATIC',
      gasFeeLoadSuccess: true,
      transaction: {
        from: '',
        data: '',
        to: '',
        value: '',
      },
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
    async initTransactionData(appSetting: AppSettings, payload: UPTransactionMessage) {
      this.feeOptions = []
      this.initAppSetting(appSetting)
      const transactionCards = await analyzeTransactionData(payload, appSetting.chain)
      if (!transactionCards) return
      this.transaction = payload
      this.cards = transactionCards
      await this.updateGasFee()
    },
    initAppSetting(appSetting?: AppSettings) {
      if (appSetting) {
        const { theme, chain, appName, appIcon } = appSetting
        if (!sessionStorage.theme && theme) {
          sessionStorage.theme = theme
          initTheme(theme)
        }
        if (chain) {
          sessionStorage.chain = chain
          this.chain = chain
        }
        if (appName) {
          sessionStorage.appName = appName
          this.appName = appName
        }
        if (appIcon) {
          this.appIcon = appIcon
        }
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
                tokenType: 'erc20',
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
            tokenType: 'contract',
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
            tokenType: 'native',
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
    },
    initCards(cards: TransactionCard[]) {
      this.cards = cards
    },
    updateSymbolAndChain(chain: ChainType, symbol?: string) {
      if (symbol) {
        this.symbol = symbol
      }
      this.chain = chain
    },
    async updateGasFee() {
      console.log('updateGasFee')
      const userStore = useUserStore()
      const signStore = useSignStore()
      const {
        data: { syncStatus },
      } = await api.getSyncStatus({
        email: userStore.accountInfo.email,
        authChainNode: getAuthNodeChain(signStore.chain),
      })

      if (syncStatus === SyncStatusEnum.NotReceived || syncStatus === SyncStatusEnum.NotSynced) {
        checkStatusForSendTransaction(
          'multiSync',
          JSON.stringify({ ...signStore.$state, loading: false }),
        )
        return
      }
      const { t: $t } = i18n.global
      try {
        this.gasFeeLoading = true
        await this._updateGasFee()
      } catch (e) {
        console.error(`Loading Gas Failed: ${JSON.stringify(e)}`)
        console.error(e)
        upError($t('GasFeeLoadingFailed'))
      } finally {
        this.gasFeeLoading = false
      }
    },
    async _updateGasFee() {
      const coinStore = useCoinStore()
      const userStore = useUserStore()
      coinStore.getAccountAssets(userStore.accountInfo.address, getChainIdByChainType(this.chain))
      if (this.chain === 'rangers') {
        return
      }
      const { isFeeRequired, feeTokens, feeReceiver, discount, gasPrice } =
        await this._simulateTransaction()

      if (isFeeRequired) {
        this.feeOptions = []
        feeTokens.forEach(({ token, gasUsed, nativeTokenPrice, tokenPrice }) => {
          const coinToken = coinStore.coins.find(
            (x) =>
              x.chain === this.chain && x.contractAddress.toLowerCase() === token.toLowerCase(),
          )

          // TODO: show fee tokens not in useStore.coins
          if (coinToken) {
            let gasFee
            let transFee: BigNumber
            if (this.chain === 'rangers') {
              gasFee = BigNumber.from(1000000)
              transFee = utils.parseEther('0.0001')
            } else {
              gasFee = BigNumber.from(gasUsed)
              transFee = gasFee.mul(gasPrice)
            }
            const amount = transFee
              .mul(Math.ceil(nativeTokenPrice * 10 ** 8))
              .div(Math.ceil(tokenPrice * 10 ** 8))
              .mul(discount)
              .div(100)
              .div(10 ** (18 - coinToken.decimals))
            this.feeOptions.push({
              to: feeReceiver,
              gasLimit: gasFee.toNumber(),
              token: coinToken,
              amount: amount.toHexString(),
            })
          }
        })
      }
    },
    async _simulateTransaction(): Promise<SimulateResult> {
      const userStore = useUserStore()
      const signStore = useSignStore()
      const transaction = generateSimulateTransaction()
      if (!transaction) {
        throw new Error('Expected Transaction For Simulating Transaction')
      }
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        userStore.unipassWallet.setAccountInfo(userStore.accountInfo)
        const simulateResult = await userStore.unipassWallet.simulateTransactions(transaction)
        signStore.gasFeeLoadSuccess = true
        return simulateResult
      } catch (err) {
        // TODO: for account sync, return default gas limit 500000
        console.log('Need Account Sync', err)
        signStore.gasFeeLoadSuccess = false
        return {
          feeTokens: [
            {
              token: '0x0000000000000000000000000000000000000000',
              gasUsed: BigNumber.from(5000).toHexString(),
              tokenPrice: 1,
              nativeTokenPrice: 1,
            },
          ],
          discount: 100,
          feeReceiver: '',
          isFeeRequired: true,
          gasPrice: parseUnits('10', 'gwei').toHexString(),
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
