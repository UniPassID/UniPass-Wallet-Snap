import { ChainType, Environment, TransactionFee, TransactionProps } from '../provider/interface/unipassWalletProvider'
import { BigNumber, Contract, providers } from 'ethers'
import { formatUnits, Interface } from 'ethers/lib/utils'
import { getAuthNodeChain } from '../provider/utils/unipass'
import { formatEther } from 'ethers/lib/utils'
import { chain_config } from '../provider/config'
import ABI from './ABI'
import { convertSelector } from './convertSelector'

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

const CHAIN_SYMBOL = {
	'polygon':  'MATIC',
	'eth': 'ETH',
	'bsc': 'BNB',
	'rangers': 'RPG',
	'scroll': 'ETH',
	'arbitrum': 'ETH'
}

export const feeDecoder = async function(fee: TransactionFee, chain: ChainType, env: Environment) {
	const feeData = {
		symbol: 'unknown',
		value: '0'
	}
	const authNode = getAuthNodeChain(env, chain)
	const rpc_url = chain_config[authNode].rpc_url

	const contract = new Contract(fee.token, ABI, new providers.JsonRpcProvider(rpc_url))
	if (fee.token === ADDRESS_ZERO) {
		feeData.symbol = CHAIN_SYMBOL[chain] || 'unknown'
		feeData.value = formatUnits(BigNumber.from(fee.value), 18)
	} else {
		feeData.symbol = await contract.symbol()
		const decimals = await contract.decimals()
		feeData.value = formatUnits(BigNumber.from(fee.value), decimals)
	}
	
	return feeData
}

export const txDecoder = async (transaction: TransactionProps, env: Environment) => {
  const tx = transaction.tx
  const chain = transaction.chain

  
  if (tx.data && tx.data !== '0x') {
    const functionName = await convertSelector(tx.data as string)
    const ABI_TX = [
      'function transfer(address _to, uint256 _value)', // ERC20
      'function safeTransferFrom(address _from, address _to, uint256 _tokenId)', // ERC721
      'function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _amount, bytes _data)', // ERC1155
    ]
    const iface = new Interface(ABI_TX)
    try {
      const decodedData = iface.parseTransaction({ data: tx.data as string })

      const authNode = getAuthNodeChain(env, chain)
      const rpc_url = chain_config[authNode].rpc_url
      let amount = '0'

      if (decodedData.args[0] !== ADDRESS_ZERO) {
        const contract = new Contract(tx.target as string, ABI, new providers.JsonRpcProvider(rpc_url))
        const decimals = await contract.decimals()
        amount = formatUnits(BigNumber.from(decodedData.args[1]), decimals)
      }

      return {
        type: 'contract-call',
        name: decodedData.name,
        args: decodedData.args,
        amount,
        function: decodedData.signature,
      }
    } catch(e) {
      return {
        type: 'contract-call',
        name: functionName,
        args: [],
        amount: '0',
        function: functionName,
      }
    }
  } else {
    return {
      type: 'send-token',
      amount: formatEther(BigNumber.from(tx.value)),
    }
  }
}