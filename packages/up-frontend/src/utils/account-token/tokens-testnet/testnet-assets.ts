import { TESTNET_CHAIN_IDS } from '@/service/constants'
import { CHAIN_ERC20_LIST } from '../cmc/init-tokens'
import { multicallGetAsset } from '../multicall-fetch-asset'

export async function getTestnetAssets(account: string) {
  const promiseArray = []

  const configChainInfoList = CHAIN_ERC20_LIST.filter((x) => TESTNET_CHAIN_IDS.includes(x.chainId))

  for (const chain of configChainInfoList) {
    promiseArray.push(multicallGetAsset(account, chain.chainId))
  }
  const resArray = await Promise.all(promiseArray)
  const result = []
  for (const tokens of resArray) {
    result.push(...tokens)
  }

  return result
}
