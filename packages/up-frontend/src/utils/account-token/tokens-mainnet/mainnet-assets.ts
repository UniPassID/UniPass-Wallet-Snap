import api, { APIERC20TokenInfo, APIChainInfo } from '@/service/backend'
import { getChainNameByChainId, TokenInfo } from '@/service/chains-config'
import { ADDRESS_ZERO, MAINNET_CHAIN_IDS, RANGERS_MAINNET } from '@/service/constants'
import {
  ILocalTokenInfo,
  CHAIN_ERC20_LIST,
  getNativeTokenSymbolByChainId,
} from '@/utils/account-token/cmc/init-tokens'
import { formatUnits } from 'ethers/lib/utils'
import { multicallGetAsset } from '../multicall-fetch-asset'

const wrapTokenWithCmcId = (
  apiChainInfoList: APIChainInfo[],
  chainId: number,
): ILocalTokenInfo[] => {
  const allTokens = []

  const configChainInfoList = CHAIN_ERC20_LIST.filter((x) => x.chainId === chainId).filter((x) =>
    MAINNET_CHAIN_IDS.includes(x.chainId),
  )

  for (const { chainId, cmcId, tokens } of configChainInfoList) {
    const name = getChainNameByChainId(chainId) as string
    const symbol = getNativeTokenSymbolByChainId(chainId) as string

    const apiChainInfo = apiChainInfoList.find((x) => x.chainId === chainId)

    const nativeToken = {
      chainId,
      balance: apiChainInfo?.balance ?? '0x0',
      cmcId,
      name,
      symbol,
      decimals: 18,
      address: ADDRESS_ZERO,
    }

    const erc20Tokens: ILocalTokenInfo[] = tokens
      .map((x) => {
        const token = apiChainInfo?.data.find(
          (y) => y.contract_address.toLowerCase() === x.address.toLowerCase(),
        )
        return { ...x, balance: token?.balance } as ILocalTokenInfo
      })
      .filter((x) => x.default || !!x.balance)

    allTokens.push(nativeToken)
    allTokens.push(...erc20Tokens)
  }

  return allTokens
}

const delTokensWithNoBalance = (tokens: APIERC20TokenInfo[]): APIERC20TokenInfo[] => {
  const result: APIERC20TokenInfo[] = []
  if (!tokens) {
    return result
  }
  for (const token of tokens) {
    if (token.balance === '0x0') continue
    result.push(token)
  }
  return result
}

export const getAccountTokens = async (address: string, chainId: number) => {
  try {
    const allTokenList = await api.getAccountTokens({
      address,
      chainIds: [chainId],
    })
    for (const apiChainInfo of allTokenList.data) {
      apiChainInfo.data = delTokensWithNoBalance(apiChainInfo.data)
    }

    const tokenList = wrapTokenWithCmcId(allTokenList.data, chainId)
    return tokenList
  } catch (err) {
    console.error(`[apiGetAccountToken] get account token failed for chain = ${chainId}`, err)
    return []
  }
}

export const getMainnetAssets = async (address: string): Promise<TokenInfo[]> => {
  const chainIds = MAINNET_CHAIN_IDS.filter((x) => x !== RANGERS_MAINNET)

  const [apiTokens, nativeTokens, rangersTokens] = await Promise.all([
    Promise.all(chainIds.map((x) => getAccountTokens(address, x))), // api tokens
    Promise.all(chainIds.map((x) => multicallGetAsset(address, x, true))), // native tokens
    multicallGetAsset(address, RANGERS_MAINNET), // rangers tokens
  ])

  console.log('apiTokens', apiTokens)

  const coins: TokenInfo[] = []

  // process api tokens
  for (const tokens of apiTokens) {
    for (const token of tokens) {
      const coin: TokenInfo = {
        chain: getChainNameByChainId(token.chainId),
        symbol: token.symbol,
        price: token.price || 0,
        decimals: token.decimals || 18,
        balance: formatUnits(token.balance || '0', token.decimals || 18),
        contractAddress: token.address,
        icon: token.logoURI,
        cmcId: token.cmcId || 0,
      }
      coins.push(coin)
    }
  }

  // replace native tokens value
  for (const [newNativeToken] of nativeTokens) {
    const oldNativeToken = coins.find(
      (x) =>
        x.chain === newNativeToken.chain && x.contractAddress === newNativeToken.contractAddress,
    )
    if (oldNativeToken) {
      oldNativeToken.balance = newNativeToken.balance
    }
  }

  coins.push(...rangersTokens)

  return coins
}
