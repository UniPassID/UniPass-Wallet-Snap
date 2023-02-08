import { Contract, utils, BigNumber } from 'ethers'
import { formatEther, toUtf8String } from 'ethers/lib/utils'
import { chain_config } from '../provider/config'
import { TransactionProps } from '../provider/interface/unipassWalletProvider'

const abi = [
  {
    constant: true,
    inputs: [{ name: '', type: 'bytes4' }],
    name: 'entries',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    type: 'function',
  },
]

const uniPassSelectorMap = {
  a22cb465: 'setApprovalForAll',
}

export const convertSelector = async (data: string) => {
  if (!data.startsWith('0x') || data.length < 10) return 'unknown'

  try {
    const selector = data.slice(2, 10)
    // save some crash abi function name for uniPass
    if (uniPassSelectorMap[selector]) return uniPassSelectorMap[selector]

    const rpc = chain_config['eth-mainnet'].rpc_url
    const originRes = await fetch(rpc, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_call',
        params: [
          {
            from: '0x0000000000000000000000000000000000000000',
            data: `0xb46bcdaa${selector}00000000000000000000000000000000000000000000000000000000`,
            to: '0x44691b39d1a75dc4e0a0346cbb15e310e6ed1e86',
          },
          'latest',
        ],
      })
    })
    const res = await originRes.json()
    const contract = new Contract('0x44691b39d1a75dc4e0a0346cbb15e310e6ed1e86', abi)
    const utf8Selector = contract.interface.decodeFunctionResult('entries', res.result)
    if (!utf8Selector || utf8Selector.toString() === '') return 'unknown'
    const functionName = utf8Selector.toString().split('(')[0] ?? 'unknown'
    return functionName
  } catch (e) {
    return 'unknown'
  }
}

export const txDecoder = async (transaction: TransactionProps) => {
  const tx = transaction.tx
  const chain = transaction.chain
  if (tx.data && tx.data !== '0x') {
    const functionName = await convertSelector(tx.data as string)

    const ABI = ['function transfer(address _to, uint256 _value)']
    const iface = new utils.Interface(ABI)
    const decodedData = iface.parseTransaction({ data: tx.data as string })
    return {
      type: 'contract-call',
      data: {
        data: decodedData,
        chain: chain,
        value: tx.value,
      },
      actionName: functionName,
    }
  } else {
    return {
      type: 'send-token',
      data: {
        amount: formatEther(BigNumber.from(tx.value)),
      },
    }
  }
  
}
