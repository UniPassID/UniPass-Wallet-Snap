import BNB_MAINNET_ERC20 from '@/utils/account-token/tokens-mainnet/bnb/erc20.json'
import ETH_MAINNET_ERC20 from '@/utils/account-token/tokens-mainnet/mainnet/erc20.json'
import POLYGON_MAINNET_ERC20 from '@/utils/account-token/tokens-mainnet/polygon/erc20.json'
import ETH_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/goerli/erc20.json'
import POLYGON_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/mumbai/erc20.json'
import BNB_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/bsc-testnet/erc20.json'

import RANGERS_MAINNET_ERC20 from '@/utils/account-token/tokens-mainnet/rangers/erc20.json'
import RANGERS_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/rangers-robin/erc20.json'
import SCROLL_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/scroll-testnet/erc20.json'
import ARBITRUM_TESTNET_ERC20 from '@/utils/account-token/tokens-testnet/arbitrum-goerli/erc20.json'
import {
  ARBITRUM_MAINNET,
  ARBITRUM_TESTNET,
  BSC_MAINNET,
  BSC_TESTNET,
  ETHEREUM_GOERLI,
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  POLYGON_MUMBAI,
  RANGERS_MAINNET,
  RANGERS_ROBIN,
  SCROLL_TESTNET,
} from '@/service/constants'

export const CHAIN_ERC20_LIST = [
  ETH_MAINNET_ERC20,
  ETH_TESTNET_ERC20,

  BNB_MAINNET_ERC20,
  BNB_TESTNET_ERC20,

  POLYGON_MAINNET_ERC20,
  POLYGON_TESTNET_ERC20,

  RANGERS_MAINNET_ERC20,
  RANGERS_TESTNET_ERC20,

  SCROLL_TESTNET_ERC20,
  ARBITRUM_TESTNET_ERC20,
]

export const getRpcByChainID = (chainId: number) => {
  switch (chainId) {
    case ETHEREUM_MAINNET:
    case ETHEREUM_GOERLI:
      return process.env.VUE_APP_ETH_RPC
    case POLYGON_MAINNET:
    case POLYGON_MUMBAI:
      return process.env.VUE_APP_Polygon_RPC
    case BSC_MAINNET:
    case BSC_TESTNET:
      return process.env.VUE_APP_BSC_RPC
    case RANGERS_MAINNET:
    case RANGERS_ROBIN:
      return process.env.VUE_APP_Rangers_RPC
    case SCROLL_TESTNET:
      return process.env.VUE_APP_SCROLL_RPC
    case ARBITRUM_MAINNET:
    case ARBITRUM_TESTNET:
      return process.env.VUE_APP_ARBITRUM_RPC
  }

  return undefined
}

export const getNativeTokenSymbolByChainId = (chainId: number) => {
  switch (chainId) {
    case ETHEREUM_MAINNET:
    case ETHEREUM_GOERLI:
    case SCROLL_TESTNET:
    case ARBITRUM_MAINNET:
    case ARBITRUM_TESTNET:
      return 'ETH'
    case POLYGON_MAINNET:
    case POLYGON_MUMBAI:
      return 'MATIC'
    case BSC_MAINNET:
    case BSC_TESTNET:
      return 'BNB'
    case RANGERS_MAINNET:
    case RANGERS_ROBIN:
      return 'RPG'
  }

  return undefined
}

export interface ILocalTokenInfo {
  cmcId?: number
  price?: number
  chainId: number
  address: string
  name: string
  symbol: string
  type?: string
  decimals?: number
  logoURI?: string
  balance?: string
  default?: boolean
}

export interface ChainInfo {
  chainId: number
  default?: boolean
  rpc?: string
  symbol?: string
  cmcId?: number
  price?: number
  balance?: string
  tokens: ILocalTokenInfo[]
}
