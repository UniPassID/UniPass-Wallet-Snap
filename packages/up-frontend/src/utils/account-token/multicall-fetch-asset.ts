import { aggregate } from 'makerdao-multicall'
import { formatUnits } from 'ethers/lib/utils'
import { getChainNameByChainId, TokenInfo } from '@/service/chains-config'
import { ADDRESS_ZERO, multicallAddress } from '@/service/constants'
import { CHAIN_ERC20_LIST, getNativeTokenSymbolByChainId, getRpcByChainID } from './cmc/init-tokens'
import { ChainType } from '@unipasswallet/provider'

export async function multicallGetAsset(
  account: string,
  chainId: number,
  onlyNativeToken = false,
): Promise<TokenInfo[]> {
  try {
    const configChainInfo = CHAIN_ERC20_LIST.find((x) => x.chainId === chainId)
    if (!configChainInfo) return []

    const calls = [
      {
        target: multicallAddress,
        call: ['getEthBalance(address)(uint256)', account],
        returns: [[`TOKEN_BALANCE_NATIVE`, (val: any) => val]],
      },
    ]

    if (!onlyNativeToken) {
      for (let i = 0; i < configChainInfo.tokens.length; i++) {
        const token = configChainInfo.tokens[i]

        const contractAddress = token.address
        if (!contractAddress) continue

        calls.push({
          target: contractAddress,
          call: ['balanceOf(address)(uint256)', account],
          returns: [[`TOKEN_BALANCE_${i}`, (val: any) => val]],
        })
      }
    }

    const ret = await aggregate(calls, {
      rpcUrl: getRpcByChainID(chainId),
      multicallAddress,
    })
    const { transformed } = ret.results

    const result = [
      {
        chain: getChainNameByChainId(configChainInfo.chainId) as ChainType,
        symbol: getNativeTokenSymbolByChainId(configChainInfo.chainId) as string,
        name: getNativeTokenSymbolByChainId(configChainInfo.chainId) as string,
        decimals: 18,
        balance: formatUnits(transformed[`TOKEN_BALANCE_NATIVE`], 18),
        contractAddress: ADDRESS_ZERO,
        price: 0,
        cmcId: configChainInfo.cmcId,
        gasFee: '0',
      },
    ]
    for (let i = 0; i < configChainInfo.tokens.length; i++) {
      const token = configChainInfo.tokens[i]
      const contractAddress = token.address
      if (!contractAddress) break
      result.push({
        chain: getChainNameByChainId(configChainInfo.chainId) as ChainType,
        symbol: token.symbol as string,
        name: token.name,
        decimals: token.decimals as number,
        balance: formatUnits(transformed[`TOKEN_BALANCE_${i}`], token.decimals),
        contractAddress,
        price: 0,
        cmcId: token.cmcId ?? 0,
        gasFee: '0',
      })
    }
    return result
  } catch (err) {
    console.error('load asset error', err)
    return []
  }
}
