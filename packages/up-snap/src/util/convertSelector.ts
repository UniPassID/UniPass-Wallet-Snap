import { Contract } from 'ethers'
import { chain_config } from '../provider/config'

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

const uniPassSelectorMap: {[key: string]: string} = {
  a22cb465: 'setApprovalForAll',
}

export const convertSelector = async (data: string): Promise<string> => {
  if (!data.startsWith('0x') || data.length < 10) return 'unknown'

  try {
    const selector = data.slice(2, 10)

    // save some crash abi function name for unipass
    if (selector in uniPassSelectorMap) return uniPassSelectorMap[selector]

    const rpc = chain_config['eth-mainnet'].rpc_url

    const res = await fetch(rpc, {
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

    const resJson = await res.json()

    const contract = new Contract('0x44691b39d1a75dc4e0a0346cbb15e310e6ed1e86', abi)

    const utf8Selector = contract.interface.decodeFunctionResult('entries', resJson.result)
    if (!utf8Selector || utf8Selector.toString() === '') return 'unknown'
    const functionName = utf8Selector.toString().split('(')[0] ?? 'unknown'
    return functionName
  } catch (e) {
    return 'unknown'
  }
}
