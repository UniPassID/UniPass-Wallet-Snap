import { upError } from './../utils/useUniPass'
import { ADDRESS_ZERO } from './constants'
import { providers } from 'ethers'
import SID, { getSidAddress } from '@siddomains/sidjs'
import { chain_config } from '@unipasswallet/provider'

export const convertDomainToAddress = async (domain: string): Promise<string> => {
  let address = ADDRESS_ZERO
  try {
    if (domain.endsWith('.bnb')) {
      const rpc = chain_config['bsc-mainnet'].rpc_url
      const provider = new providers.JsonRpcProvider(rpc)
      const sid = new SID({ provider, sidAddress: getSidAddress('56') })
      address = await sid.name(domain).getAddress()
    } else if (domain.endsWith('.eth')) {
      const rpc = chain_config['eth-mainnet'].rpc_url
      const provider = new providers.JsonRpcProvider(rpc)
      address = (await provider.resolveName(domain)) || ADDRESS_ZERO
    } else if (domain.endsWith('.nft')) {
      const rpc = chain_config['eth-mainnet'].rpc_url
      const provider = new providers.JsonRpcProvider(rpc, {
        name: 'mainnet',
        chainId: 1,
        ensAddress: '0x81132c2FF472691f3e0b52b61dF50Cd4a64B6D20',
      })
      address = (await provider.resolveName(domain)) || ADDRESS_ZERO
    } else {
      return address
    }
  } catch {
    upError('domain convert error')
  }

  return address
}
