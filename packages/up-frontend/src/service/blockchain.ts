import { Contract, providers, utils } from 'ethers'
import { moduleMainAbi } from '@/service/module.main.abi'

let provider: providers.JsonRpcProvider
let moduleMainContract: Contract

export const MainModuleAddress = process.env.VUE_APP_MainModuleAddress || ''
export const DkimKeysAddress = process.env.VUE_APP_DkimKeysAddress || ''
export const FactoryAddress = process.env.VUE_APP_FactoryAddress || ''
export const ProxyContractCode = process.env.VUE_APP_ProxyContractCode || ''

export const EthContractAddress = process.env.VUE_APP_ProxyContractCode || ''

const initProvider = () => {
  if (!provider) {
    provider = new providers.JsonRpcProvider(process.env.VUE_APP_RPC)
    moduleMainContract = new Contract(MainModuleAddress, moduleMainAbi.abi, provider)
  }
}

const blockchain = {
  async isRegistered(address: string) {
    initProvider()
    const code = await provider.getCode(address)
    return code !== '0x'
  },

  async getMetaNonce(address: string) {
    initProvider()
    const proxyModuleMainContract = moduleMainContract.attach(address)
    let metaNonce = 0

    try {
      metaNonce = await proxyModuleMainContract.getMetaNonce()
    } catch (error) {
      //
    }

    return Number(metaNonce.toString()) + 1
  },

  async getAccountKeysetHash(address: string) {
    initProvider()
    const proxyModuleMainContract = moduleMainContract.attach(address)
    let keysetHash = '0x'
    try {
      keysetHash = await proxyModuleMainContract.getKeysetHash()
    } catch (error) {
      //
    }
    return keysetHash
  },

  async getNonce(address: string): Promise<number> {
    initProvider()
    const proxyModuleMainContract = moduleMainContract.attach(address)
    let nonce = 0
    try {
      nonce = await proxyModuleMainContract.getNonce()
    } catch (error) {
      //
      console.log(error)
    }
    return Number(nonce.toString()) + 1
  },

  async getNetwork(): Promise<providers.Network> {
    initProvider()
    return await provider.getNetwork()
  },

  async getAddressAssest(address: string) {
    initProvider()
    const balance = await provider.getBalance(address)
    const maticBalance = utils.formatEther(balance)
    return { maticBalance }
  },

  async getTransactionReceipt(hash: string) {
    initProvider()
    try {
      const res = await provider.getTransactionReceipt(hash)
      return res
    } catch (error) {
      //
    }
    return null
  },
}

export default blockchain
