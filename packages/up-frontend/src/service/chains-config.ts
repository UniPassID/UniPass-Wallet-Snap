import {
  ChainType,
  dev_api_config,
  test_api_config,
  testnet_api_config,
  mainnet_preview_api_config,
  mainnet_api_config,
  Environment,
} from '@unipasswallet/provider'
import {
  ARBITRUM_MAINNET,
  ARBITRUM_TESTNET,
  BSC_MAINNET,
  BSC_TESTNET,
  ETHEREUM_GOERLI,
  ETHEREUM_MAINNET,
  MAINNET_CHAIN_IDS,
  POLYGON_MAINNET,
  POLYGON_MUMBAI,
  RANGERS_MAINNET,
  RANGERS_ROBIN,
  SCROLL_TESTNET,
  TESTNET_CHAIN_IDS,
} from './constants'

export interface Chain {
  chain: ChainType
  tokens: Token[]
  RPC: string
}
export interface Token {
  symbol: string
  contractAddress: string
  decimals: number
  cmcId: number
}

export interface TokenInfo extends Token {
  chain: ChainType
  balance: string
  price: number
  icon?: string
}

const getSdkConfig = () => {
  const env = process.env.VUE_APP_Net
  let net: Environment = 'testnet'
  let urlConfig = undefined
  if (env === 'dev') {
    urlConfig = dev_api_config
  } else if (env === 'test') {
    urlConfig = test_api_config
  } else if (env === 'testnet') {
    urlConfig = testnet_api_config
  } else if (env === 'preview') {
    net = 'mainnet'
    urlConfig = mainnet_preview_api_config
  } else if (env === 'mainnet') {
    net = 'mainnet'
    urlConfig = mainnet_api_config
  } else {
    urlConfig = testnet_api_config
  }
  return {
    net,
    urlConfig,
  }
}

export const sdkConfig = getSdkConfig()

export const getChainName = (chain?: ChainType) => {
  if (!chain) {
    return ''
  }
  const dict = {
    bsc: 'BSC',
    polygon: 'Polygon',
    rangers: 'Rangers',
    eth: 'ETH',
    scroll: 'Scroll',
    arbitrum: 'Arbitrum',
  }
  return dict[chain]
}

const getCurrentEnv = () => {
  const env = process.env.VUE_APP_Net
  let net: Environment = 'testnet'
  if (env === 'dev') {
    net = 'testnet'
  } else if (env === 'test') {
    net = 'testnet'
  } else if (env === 'testnet') {
    net = 'testnet'
  } else if (env === 'preview') {
    net = 'mainnet'
  } else if (env === 'mainnet') {
    net = 'mainnet'
  }
  return net
}

export const getAuthNodeChain = (chainType: ChainType): string => {
  const net = getCurrentEnv()

  if (net === 'testnet') {
    switch (chainType) {
      case 'eth':
        return 'eth-goerli'
      case 'polygon':
        return 'polygon-mumbai'
      case 'bsc':
        return 'bsc-testnet'
      case 'rangers':
        return 'rangers-robin'
      case 'scroll':
        return 'scroll-testnet'
      case 'arbitrum':
        return 'arbitrum-testnet'
      default:
        return 'polygon-mumbai'
    }
  } else if (net === 'mainnet') {
    switch (chainType) {
      case 'eth':
        return 'eth-mainnet'
      case 'polygon':
        return 'polygon-mainnet'
      case 'bsc':
        return 'bsc-mainnet'
      case 'rangers':
        return 'rangers-mainnet'
      case 'arbitrum':
        return 'arbitrum-mainnet'
      default:
        return 'polygon-mainnet'
    }
  }
  return 'polygon-mumbai'
}

export const getSupportedChainIds = (): number[] => {
  const net = getCurrentEnv()

  if (net === 'testnet') {
    return TESTNET_CHAIN_IDS
  } else if (net === 'mainnet') {
    return MAINNET_CHAIN_IDS
  } else return []
}

export const getDefaultChainId = (): number => {
  const net = getCurrentEnv()

  if (net === 'testnet') {
    return POLYGON_MUMBAI
  } else if (net === 'mainnet') {
    return POLYGON_MAINNET
  } else return POLYGON_MUMBAI
}

export const getChainNameByChainId = (id: number | string): ChainType => {
  switch (Number(id)) {
    case ETHEREUM_MAINNET:
    case ETHEREUM_GOERLI:
      return 'eth'

    case POLYGON_MAINNET:
    case POLYGON_MUMBAI:
      return 'polygon'

    case BSC_MAINNET:
    case BSC_TESTNET:
      return 'bsc'

    case RANGERS_MAINNET:
    case RANGERS_ROBIN:
      return 'rangers'

    case SCROLL_TESTNET:
      return 'scroll'

    case ARBITRUM_TESTNET:
      return 'arbitrum'

    default:
      return 'polygon'
  }
}

export const getChainIdByChainType = (chainType: ChainType): number => {
  const net = getCurrentEnv()

  switch (chainType) {
    case 'polygon':
      return net === 'mainnet' ? POLYGON_MAINNET : POLYGON_MUMBAI
    case 'eth':
      return net === 'mainnet' ? ETHEREUM_MAINNET : ETHEREUM_GOERLI
    case 'bsc':
      return net === 'mainnet' ? BSC_MAINNET : BSC_TESTNET
    case 'rangers':
      return net === 'mainnet' ? RANGERS_MAINNET : RANGERS_ROBIN
    case 'arbitrum':
      return net === 'mainnet' ? ARBITRUM_MAINNET : ARBITRUM_TESTNET
    case 'scroll':
      // TODO add scroll mainnet chain id
      return net === 'mainnet' ? -1 : SCROLL_TESTNET
  }
}

export const supportedChainListInfo = getSupportedChainIds().map((chainId) => {
  return {
    label: getChainName(getChainNameByChainId(chainId)),
    value: chainId.toString(),
  }
})
