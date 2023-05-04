import { ChainType, Environment, TransactionFee, UniTransaction } from '../provider/interface/unipassWalletProvider'
import { TransactionProps } from '@unipasswallet/provider';
import { BigNumber, Contract, providers } from 'ethers'
import { formatUnits, Interface } from 'ethers/lib/utils'
import { getAuthNodeChain } from '../provider/utils/unipass'
import { formatEther } from 'ethers/lib/utils'
import { chain_config } from '../provider/config'
import ABI from './ABI'
import UniPassABI from './UniPassABI';
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

async function decodeTxData(tx: UniTransaction, from: string, chain: ChainType, env: Environment) {
  if (tx.data && tx.data !== '0x') {
    const functionName = await convertSelector(tx.data as string)
    const ABI_TX = [
      'function transfer(address _to, uint256 _value)', // ERC20
      'function safeTransferFrom(address _from, address _to, uint256 _tokenId)', // ERC721
      'function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _amount, bytes _data)', // ERC1155
    ]
    let iface = new Interface(ABI_TX)
    if (tx.target === from) {
      iface = new Interface(UniPassABI)
    }
    try {
      const decodedData = iface.parseTransaction({ data: tx.data as string })
      const authNode = getAuthNodeChain(env, chain)
      const rpc_url = chain_config[authNode].rpc_url
      let amount = '0'

      if (decodedData.name === 'selfExecute') {
        // selfExecute for batch transactions
        const txs = decodedData.args[3]
        const decodedTxs = await Promise.all(
          txs.map(async (subTx: any[]) => {
            const cards = await decodeTxData(
              {
                from: from,
                to: subTx[2],
                value: '0x00',
                data: subTx[5],
              },
              from,
              chain,
              env,
            )
            return cards[0]
          }),
        )
        return decodedTxs
      }

      if (decodedData.args[0] !== ADDRESS_ZERO) {
        const contract = new Contract((tx.target || tx.to) as string, ABI, new providers.JsonRpcProvider(rpc_url))
        const decimals = await contract.decimals()
        amount = formatUnits(BigNumber.from(decodedData.args[1]), decimals)
      }

      return [{
        type: 'contract-call',
        name: decodedData.name,
        args: decodedData.args,
        to: tx.target || tx.to,
        amount,
        function: decodedData.signature,
        rawData: tx.data,
      }]
    } catch(e) {
      return [{
        type: 'contract-call',
        name: functionName,
        args: [],
        to: tx.target || tx.to,
        amount: '0',
        function: functionName,
        rawData: tx.data,
      }]
    }
  } else {
    return [{
      type: 'send-token',
      to: tx.target || tx.to,
      amount: formatEther(BigNumber.from(tx.value)),
      rawData: tx.data,
    }]
  }
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

export const txDecoder = async (transaction: TransactionProps, env: Environment, from: string) => {
  const tx = transaction.tx
  const chain = transaction.chain

  return await decodeTxData(tx, from, chain!, env)
}