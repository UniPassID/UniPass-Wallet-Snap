import { getChainNameByChainId, TokenInfo } from '@/service/chains-config'
import { getDefaultAsset } from '@/utils/account-token'
import { useUserStore } from '@/store/user'
import { MAINNET_CHAIN_IDS, RANGERS_MAINNET, TESTNET_CHAIN_IDS } from '@/service/constants'
import { CHAIN_ERC20_LIST } from '@/utils/account-token/cmc/init-tokens'
import { isNumber } from '@vueuse/core'
import { multicallGetAsset } from '@/utils/account-token/multicall-fetch-asset'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import api from '@/service/backend'
import { getAccountTokens } from '@/utils/account-token/tokens-mainnet/mainnet-assets'

interface CoinStore {
  coins: TokenInfo[]
  active: number
  showLumpSum: boolean
  netWorth: string
}
export const useCoinStore = defineStore({
  id: 'coinStore',
  state: (): CoinStore => {
    return {
      coins: getDefaultAsset(),
      active: -1,
      showLumpSum: true,
      netWorth: '-',
    }
  },
  actions: {
    async fetchBalances() {
      const userStore = useUserStore()
      if (userStore.accountInfo.address) {
        this.getAccountAssets(userStore.accountInfo.address)
      }
    },
    async fetchTokenPrices(cmcIds: number[]) {
      const res = await api.getPriceConversion(cmcIds.join(','))
      if (res.ok) {
        for (let i = 0; i < this.coins.length; i++) {
          const cmcId = this.coins[i].cmcId
          if (res.data[cmcId]) {
            let price = res.data[cmcId]?.quote?.USD?.price || 0
            price = parseFloat(price.toFixed(18))
            this.coins[i].price = price
          }
        }
        this.updateNetWorth()
      }
    },
    async _netWorthTask() {
      const userStore = useUserStore()
      if (userStore.accountInfo.address) {
        const isSameHash = await userStore.checkKeysetHash()
        if (isSameHash) {
          await this.fetchBalances()
        }
      }
    },
    getAccountAssets(address: string, chainId?: number) {
      const net = process.env.VUE_APP_Net
      if (net === 'mainnet' || net === 'preview') {
        this.getMainnetAssets(address, chainId)
      } else {
        this.getTestnetAssets(address, chainId)
      }
    },
    async getMainnetAssets(address: string, chainId?: number) {
      if (chainId === RANGERS_MAINNET) {
        // rangers tokens
        this.updateCoin(address, RANGERS_MAINNET)
        return
      }
      if (chainId) {
        // api tokens
        this.updateApiCoin(address, chainId)
        // native tokens
        this.updateCoin(address, chainId, true)
        return
      }

      const chainIds = MAINNET_CHAIN_IDS.filter((x) => x !== RANGERS_MAINNET)
      const promise = []
      for (const chainId of chainIds) {
        // api tokens
        promise.push(this.updateApiCoin(address, chainId))
        // native tokens
        promise.push(this.updateCoin(address, chainId, true))
      }
      // rangers tokens
      promise.push(this.updateCoin(address, RANGERS_MAINNET))

      // tokens sort
      await Promise.all(promise)
      this.coins = this.sortTokens(this.coins)
    },
    async getTestnetAssets(address: string, chainId?: number) {
      if (chainId) {
        this.updateCoin(address, chainId)
        return
      }
      const configChainInfoList = CHAIN_ERC20_LIST.filter((x) =>
        TESTNET_CHAIN_IDS.includes(x.chainId),
      )

      const promise = []
      for (const chain of configChainInfoList) {
        promise.push(this.updateCoin(address, chain.chainId))
      }

      // tokens sort
      await Promise.all(promise)
      this.coins = this.sortTokens(this.coins)
    },
    async updateCoin(address: string, chainId: number, onlyNative?: boolean) {
      const tokens = await multicallGetAsset(address, chainId, onlyNative)

      const cmcIds = tokens.map((x) => x.cmcId).filter((x) => isNumber(x) && x > 0)
      this.fetchTokenPrices(Array.from(new Set(cmcIds)))

      for (const token of tokens) {
        const i = this.coins.findIndex((e) => e.chain === token.chain && e.symbol === token.symbol)
        if (i !== -1) {
          this.coins[i].balance = token.balance
        }
      }
      this.updateNetWorth()
    },
    updateNetWorth() {
      const totalWorth = this.coins
        .map((x) => {
          if (x.balance === '-') {
            return BigNumber.from(0)
          }
          const value = parseUnits(x.balance, 18)
            .div(10 ** 12)
            .mul(parseUnits(x.price && x.price !== -1 ? x.price.toString() : '0', 18).div(10 ** 12))
          return value
        })
        .reduce((a, b) => a.add(b))
      const netWorth = Number(formatUnits(totalWorth, 12)).toFixed(2)
      this.netWorth = netWorth
    },
    sortTokens(tokens: TokenInfo[]) {
      return tokens.sort((a, b) => {
        const chainIndexA = CHAIN_ERC20_LIST.findIndex(
          (x) => getChainNameByChainId(x.chainId) === a.chain,
        )
        const chainIndexB = CHAIN_ERC20_LIST.findIndex(
          (x) => getChainNameByChainId(x.chainId) === b.chain,
        )

        if (chainIndexA !== chainIndexB) return chainIndexA - chainIndexB

        const worthA = formatUnits(
          parseUnits(a.balance, a.decimals).mul(parseUnits(a.price.toString(), 18)),
          a.decimals,
        )
        const worthB = formatUnits(
          parseUnits(b.balance, b.decimals).mul(parseUnits(b.price.toString(), 18)),
          b.decimals,
        )

        if (worthA !== worthB) return Number(worthB) - Number(worthA)

        return Number(b.balance) - Number(a.balance)
      })
    },
    async updateApiCoin(address: string, chainId: number) {
      const apiTokens = await getAccountTokens(address, chainId)

      for (const coin of apiTokens) {
        const token: TokenInfo = {
          chain: getChainNameByChainId(coin.chainId),
          symbol: coin.symbol,
          price: coin.price || 0,
          decimals: coin.decimals || 18,
          balance: formatUnits(coin.balance || '0', coin.decimals || 18),
          contractAddress: coin.address,
          icon: coin.logoURI,
          cmcId: coin.cmcId || 0,
        }
        const i = this.coins.findIndex((e) => e.chain === token.chain && e.symbol === token.symbol)
        if (i !== -1) {
          this.coins[i] = token
        } else {
          this.coins.push(token)
        }
      }
      this.updateNetWorth()
    },
  },
})
