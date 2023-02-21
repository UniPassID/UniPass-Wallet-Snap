import { getChainNameByChainId, TokenInfo } from '@/service/chains-config'
import { CHAIN_ERC20_LIST, getNativeTokenSymbolByChainId } from './cmc/init-tokens'
import { getMainnetAssets } from './tokens-mainnet/mainnet-assets'
import { getTestnetAssets } from './tokens-testnet/testnet-assets'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { isNumber } from '@vueuse/core'
import api from '@/service/backend'
import { ChainType } from '@unipasswallet/provider'
import { ADDRESS_ZERO, MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '@/service/constants'

function sortTokens(tokens: TokenInfo[]) {
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
}

async function fetchTokenPrices(tokens: TokenInfo[]) {
  const ids = tokens.map((x) => x.cmcId).filter((x) => isNumber(x) && x > 0)
  const prices = await api.getPriceConversion(ids.join(','))
  if (prices.ok) {
    tokens = tokens.map((x) => {
      if (x.cmcId && prices?.data[x.cmcId]) {
        const price = prices.data[x.cmcId]?.quote?.USD?.price || 0
        x.price = parseFloat(price.toFixed(18))
      }
      return x
    })
  }

  return tokens
}

export function getDefaultAsset(): TokenInfo[] {
  let chainList: number[] = []
  const net = process.env.VUE_APP_Net
  if (net === 'mainnet' || net === 'preview') {
    chainList = MAINNET_CHAIN_IDS
  } else {
    chainList = TESTNET_CHAIN_IDS
  }

  const configChains = CHAIN_ERC20_LIST.filter((x) => chainList.includes(x.chainId))

  const defaultTokens = []
  for (const configChainInfo of configChains) {
    const nativeToken = {
      chain: getChainNameByChainId(configChainInfo.chainId) as ChainType,
      symbol: getNativeTokenSymbolByChainId(configChainInfo.chainId) as string,
      name: getNativeTokenSymbolByChainId(configChainInfo.chainId) as string,
      decimals: 18,
      balance: '-',
      contractAddress: ADDRESS_ZERO,
      price: 0,
      cmcId: configChainInfo.cmcId,
      gasFee: '0',
    }
    defaultTokens.push(nativeToken)

    for (const token of configChainInfo.tokens) {
      if (!token.default) continue

      const erc20Token = {
        chain: getChainNameByChainId(configChainInfo.chainId) as ChainType,
        symbol: token.symbol as string,
        name: token.name,
        decimals: token.decimals as number,
        balance: '-',
        contractAddress: token.address,
        price: 0,
        cmcId: token.cmcId ?? 0,
        gasFee: '0',
      }
      defaultTokens.push(erc20Token)
    }
  }

  return defaultTokens
}

export async function getAccountAssets(address: string): Promise<TokenInfo[]> {
  const net = process.env.VUE_APP_Net
  let tokens = []
  if (net === 'mainnet' || net === 'preview') {
    tokens = await getMainnetAssets(address)
  } else {
    tokens = await getTestnetAssets(address)
  }

  tokens = await fetchTokenPrices(tokens)

  tokens = sortTokens(tokens)
  return tokens
}
