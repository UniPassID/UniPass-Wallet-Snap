import { Contract, providers } from 'ethers'
import { getWalletAddress } from '@unipasswallet/utils'
import { moduleMain } from '@unipasswallet/abi'
import {
  MAINNET_UNIPASS_WALLET_CONTEXT,
  TESTNET_UNIPASS_WALLET_CONTEXT,
} from '@unipasswallet/network'
import { CreationCode } from '@unipasswallet/utils'
import { aggregate } from 'makerdao-multicall'
import { multicallAddress } from './constants'

let provider: providers.JsonRpcProvider
let moduleMainContract: Contract

export const genUnipassWalletContext = () => {
  const net = process.env.VUE_APP_Net
  if (net !== 'mainnet' && net !== 'preview') {
    return TESTNET_UNIPASS_WALLET_CONTEXT
  }
  return MAINNET_UNIPASS_WALLET_CONTEXT
}

export const MainModuleAddress = genUnipassWalletContext().moduleMain
export const DkimKeysAddress = genUnipassWalletContext().dkimKeys || ''
export const ProxyContractCode = CreationCode

export const EthContractAddress = CreationCode

const initProvider = () => {
  if (!provider) {
    provider = new providers.JsonRpcProvider(process.env.VUE_APP_Polygon_RPC)
    moduleMainContract = new Contract(MainModuleAddress, moduleMain.abi, provider)
  }
}

export interface IPendingStatus {
  keysetHash: string
  isPending: boolean
  pendingKeysetHash: string
  unlockTime: number
  lockDuration: number
}

const blockchain = {
  getProvider(): providers.JsonRpcProvider {
    provider = new providers.JsonRpcProvider(process.env.VUE_APP_Polygon_RPC)
    return provider
  },

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

  async getAccountInfo(address: string, currentKeysetHash?: string): Promise<IPendingStatus> {
    initProvider()

    try {
      const calls = [
        {
          target: address,
          call: ['getKeysetHash()(bytes32)'],
          returns: [['KEYSET_HASH', (val: any) => val]],
        },
        {
          target: address,
          call: ['getLockInfo()(bytes32)'],
          type: [
            [
              {
                internalType: 'bool',
                name: 'isLockedRet',
                type: 'bool',
              },
              {
                internalType: 'uint32',
                name: 'lockDuringRet',
                type: 'uint32',
              },
              {
                internalType: 'bytes32',
                name: 'lockedKeysetHashRet',
                type: 'bytes32',
              },
              {
                internalType: 'uint256',
                name: 'unlockAfterRet',
                type: 'uint256',
              },
            ],
          ],
          returns: [['LOCK_INFO', (val: any) => val]],
        },
      ]

      if (currentKeysetHash) {
        calls.push({
          target: address,
          call: ['isValidKeysetHash(bytes32)(bool)', currentKeysetHash],
          returns: [['IS_VALID_KEYSET_HASH', (val: any) => val]],
        })
      }

      const data = await aggregate(calls, {
        multicallAddress,
        rpcUrl: process.env.VUE_APP_Polygon_RPC,
      })

      let keysetHash = data.results.transformed['KEYSET_HASH']
      const lockInfo = data.results.transformed['LOCK_INFO']
      const isPending = lockInfo.isLockedRet
      const newKeysetHash = lockInfo.lockedKeysetHashRet
      const unlockTime = Number(lockInfo.unlockAfterRet)
      const lockDuration = lockInfo.lockDuringRet

      if (currentKeysetHash) {
        if (data.results.transformed['IS_VALID_KEYSET_HASH'] === true) {
          keysetHash = currentKeysetHash
        }
      }

      return { isPending, pendingKeysetHash: newKeysetHash, keysetHash, unlockTime, lockDuration }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  generateAccountAddress(keysetHash: string) {
    initProvider()
    return getWalletAddress(MainModuleAddress, keysetHash)
  },
}

export const waitForBlocks = async (blocks: number, provider?: providers.Provider) => {
  if (!provider) return
  let first: number
  await new Promise((resolve) => {
    provider.on('block', (blockNumber) => {
      console.log('block number', blockNumber)
      if (!first) {
        first = blockNumber
      } else {
        if (blockNumber >= first + blocks) {
          resolve(blockNumber)
          provider.off('block')
        }
      }
    })
  })
}

export default blockchain
