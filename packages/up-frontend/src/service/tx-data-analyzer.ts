import { BigNumber, utils } from 'ethers'
import { TransactionCard, useSignStore } from '@/store/sign'
import { useCoinStore } from '@/store/coin'
import { useUserStore } from '@/store/user'
import { upError } from '@/utils/useUniPass'
import { UPTransactionMessage } from '@unipasswallet/popup-types'
import { ChainType, TransactionProps } from '@unipasswallet/provider'
import { ADDRESS_ZERO } from './constants'
import { isSameAddress } from '@/utils/string-utils'
import { convertSelector } from './convert-selector'
import { weiToEther, etherToWei } from './format-bignumber'

const { Interface, formatEther, parseEther } = utils

export interface TransactionData {
  amount: string | number
  address: string
  symbol: string
  chain: ChainType
  nftType?: string
  contractAddress?: string
  nftTokenId?: string
}

export const analyzeTransactionData = async (
  payload: UPTransactionMessage,
  chain?: ChainType,
): Promise<TransactionCard[] | undefined> => {
  const userStore = useUserStore()
  const coinStore = useCoinStore()
  const signStore = useSignStore()
  if (!chain) {
    upError('chain not found')
    return
  }
  // mainnet coin
  const coin = coinStore.coins.find((e) => e.chain === chain && e.contractAddress === ADDRESS_ZERO)
  if (!coin) {
    upError('coin not found')
    return
  }
  signStore.updateSymbolAndChain(coin.chain)
  if (!isSameAddress(payload.from, userStore.accountInfo.address)) {
    upError('address inconsistent')
    return
  }

  if (payload.data && payload.data !== '0x') {
    const functionName = await convertSelector(payload.data)
    const ABI = [
      'function transfer(address _to, uint256 _value)', // ERC20
      'function safeTransferFrom(address _from, address _to, uint256 _tokenId)', // ERC721
      'function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _amount, bytes _data)', // ERC1155
    ]
    const iface = new Interface(ABI)
    try {
      const decodedData = iface.parseTransaction({ data: payload.data })

      if (decodedData.name === 'transfer') {
        const coin = coinStore.coins.find(
          (e) => e.chain === chain && isSameAddress(e.contractAddress, payload.to),
        )
        if (coin) {
          const amount = weiToEther(decodedData.args[1], coin.decimals)
          const address = decodedData.args[0]
          return [
            {
              show: true,
              type: 'send-token',
              tokenType: 'erc20',
              data: {
                amount,
                address,
                symbol: coin.symbol,
                chain: coin.chain,
              },
              actionName: functionName,
            },
          ]
        }
      } else if (decodedData.name === 'safeTransferFrom') {
        if (decodedData.functionFragment.inputs.length === 3) {
          // ERC721
          return [
            {
              show: true,
              type: 'send-nft',
              tokenType: 'erc721',
              data: {
                chain,
                symbol: coin.symbol,
                // tokenType: 'erc721',
                address: decodedData.args[1],
                contractAddress: payload.to,
                tokenId: BigNumber.from(decodedData.args[2]),
                amount: BigNumber.from(1),
              },
              actionName: functionName,
            },
          ]
        } else if (decodedData.functionFragment.inputs.length === 5) {
          // ERC1155
          return [
            {
              show: true,
              type: 'send-nft',
              tokenType: 'erc1155',
              data: {
                chain,
                symbol: coin.symbol,
                address: decodedData.args[1],
                contractAddress: payload.to,
                tokenId: BigNumber.from(decodedData.args[2]),
                amount: BigNumber.from(decodedData.args[3]),
              },
              actionName: functionName,
            },
          ]
        }
      }
    } catch (error) {
      console.log(`parse tx data failed:`, error)
    }
    return [
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
    ]
  } else {
    return [
      {
        show: true,
        type: 'send-token',
        tokenType: 'native',
        data: {
          amount: formatEther(!payload.value || payload.value === '0x' ? 0 : payload.value),
          address: payload.to,
          symbol: coin.symbol,
          chain: coin.chain,
        },
      },
    ]
  }
}

export const encodeTransactionData = (
  txData: TransactionData,
): UPTransactionMessage | undefined => {
  const coinStore = useCoinStore()
  const userStore = useUserStore()
  const { chain, symbol, address, amount, nftType, nftTokenId, contractAddress } = txData
  // encode nft tx data
  if (nftType === 'ERC1155') {
    if (!contractAddress) return
    const erc1155 = new utils.Interface([
      'function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _amount, bytes _data)',
    ])
    const erc1155Data = erc1155.encodeFunctionData('safeTransferFrom', [
      userStore.accountInfo.address,
      address,
      nftTokenId,
      amount,
      '0x',
    ])
    return {
      from: userStore.accountInfo.address,
      to: contractAddress,
      value: '0x',
      data: erc1155Data,
    }
  } else if (nftType === 'ERC721') {
    if (!contractAddress) return
    const erc721 = new utils.Interface([
      'function safeTransferFrom(address _from, address _to, uint256 tokenId)',
    ])
    const erc721Data = erc721.encodeFunctionData('safeTransferFrom', [
      userStore.accountInfo.address,
      address,
      nftTokenId,
    ])
    return {
      from: userStore.accountInfo.address,
      to: contractAddress,
      value: '0x',
      data: erc721Data,
    }
  } else {
    const coin = coinStore.coins.find((e) => e.symbol === symbol && e.chain === chain)
    if (!coin) return
    if (coin.contractAddress === ADDRESS_ZERO) {
      return {
        from: userStore.accountInfo.address,
        to: address,
        value: parseEther(amount.toString()).toHexString(),
        data: '0x',
      }
    } else {
      const erc20Interface = new utils.Interface(['function transfer(address _to, uint256 _value)'])
      const erc20TokenData = erc20Interface.encodeFunctionData('transfer', [
        address,
        etherToWei(amount.toString(), coin.decimals),
      ])
      return {
        from: userStore.accountInfo.address,
        to: coin.contractAddress,
        value: '0x',
        data: erc20TokenData,
      }
    }
  }
}

export const generateTransaction = (): TransactionProps | undefined => {
  const signStore = useSignStore()
  const { transaction, feeOptions, feeSymbol, chain } = signStore
  const { data, to, value } = transaction
  if (!data) return
  console.log('feeOptions: ', feeOptions)
  const feeCoin = feeOptions.find((e) => e.token.symbol === feeSymbol)
  let fee
  if (feeCoin && chain !== 'rangers') {
    fee = {
      token: feeCoin.token.contractAddress || ADDRESS_ZERO,
      value: BigNumber.from(feeCoin.amount),
      receiver: feeCoin.to,
    }
  }
  return {
    tx: {
      target: to,
      value: !value || value === '0x' ? BigNumber.from(0) : BigNumber.from(value),
      revertOnError: true,
      data,
    },
    fee,
    chain,
  }
}

export const generateSimulateTransaction = (): TransactionProps | undefined => {
  const signStore = useSignStore()
  const { transaction, feeOptions, feeSymbol, chain, cards } = signStore
  const { data, to, value } = transaction
  if (!data) return
  const feeCoin = feeOptions.find((e) => e.token.symbol === feeSymbol)
  let fee
  if (feeCoin && chain !== 'rangers') {
    fee = {
      token: feeCoin.token.contractAddress || ADDRESS_ZERO,
      value: BigNumber.from(feeCoin.amount),
      receiver: feeCoin.to,
    }
  }
  if (cards[0].tokenType === 'native') {
    return {
      tx: {
        target: to,
        value: BigNumber.from(1),
        revertOnError: true,
        data,
      },
      fee,
      chain,
    }
  } else if (cards[0].tokenType === 'erc20') {
    const erc20Interface = new utils.Interface(['function transfer(address _to, uint256 _value)'])
    const erc20TokenData = erc20Interface.encodeFunctionData('transfer', [
      cards[0].data.address,
      BigNumber.from(1),
    ])
    return {
      tx: {
        target: to,
        value: BigNumber.from(0),
        revertOnError: true,
        data: erc20TokenData,
      },
      fee,
      chain,
    }
  } else {
    return {
      tx: {
        target: to,
        value: !value || value === '0x' ? BigNumber.from(0) : BigNumber.from(value),
        revertOnError: true,
        data,
      },
      fee,
      chain,
    }
  }
}
