import { createHash } from 'crypto'
import { syncScrypt } from 'scrypt-js'
import { Wallet } from 'ethers'
import { JsonRpcError } from '@metamask/types'
import {
  getCreate2Address,
  concat,
  hexlify,
  keccak256,
  solidityPack,
  arrayify,
} from 'ethers/lib/utils'
import {
  MainModuleAddress,
  DkimKeysAddress,
  FactoryAddress,
  ProxyContractCode,
} from '@/service/blockchain'
import { connect, getMasterKeyAddressFromSnap, signMessageFromSnap } from './snap'

async function encryptCloudKey(privkey: string, password: string): Promise<string> {
  const w = new Wallet(privkey)

  const encryptedWallet = await w.encrypt(password, { N: 16 })
  return encryptedWallet
}

export async function decryptCloudKey(keystore: string, password: string) {
  const w = await Wallet.fromEncryptedJson(keystore, password)

  const privkey = w.privateKey
  const address = w.address

  const encryptedKey = await encryptCloudKey(privkey, password)

  return {
    privkey,
    address,
    password,
    encryptedKey,
  }
}

export async function generateCloudKey(password: string) {
  const w = Wallet.createRandom()

  const privkey = w.privateKey
  const address = w.address

  const encryptedKey = await encryptCloudKey(privkey, password)

  return {
    privkey,
    address,
    password,
    encryptedKey,
  }
}

export async function getCloudKeyFromMM(isSnaps = true) {
  if (isSnaps) {
    let result
    try {
      await connect()
      return await getMasterKeyAddressFromSnap()
    } catch (error: any) {
      if (error.code === 4001) {
        console.log('The user rejected the request.')
      } else {
        console.log('Unexpected error:', error)
      }
      throw error
    }
  } else {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0]
  }
}

export async function signMsg(msg: string, privkey: string, isArrayify: boolean): Promise<string> {
  const w = new Wallet(privkey)
  const sig = await w.signMessage(isArrayify ? arrayify(msg) : msg)
  return sig
}

export async function signMsgWithMM(msg: string, from: string, isSnaps = true): Promise<string> {
  if (isSnaps) {
    return await signMessageFromSnap(msg, from)
  } else {
    return await window.ethereum.request({ method: 'personal_sign', params: [msg, from] })
  }
}

export const generateKdfPassword = (password: string): string => {
  const salt = 'hello unipass wallet'
  const N = 64
  const r = 8
  const p = 1
  const dkLen = 32
  const passwordBuffer = Buffer.from(password, 'utf-8')
  const saltBuffer = Buffer.from(salt, 'utf-8')
  const derivedKey = syncScrypt(passwordBuffer, saltBuffer, N, r, p, dkLen)
  return hexlify(concat([hexlify(new Uint8Array(saltBuffer)), hexlify(derivedKey)]))
}

// Permit
enum SignerType {
  EIP712 = 1,
  EthSig = 2,
}

export const emailHash = (email: string) => {
  const MAX_EMAIL_LEN = 100
  const FR_EMAIL_LEN = Math.floor(MAX_EMAIL_LEN / 31) + 1
  const split = email.split('@', 2)
  let hash = createHash('sha256').update(split[0]).update('@').update(split[1])
  let i
  const len = split[0].length + 1 + split[1].length
  for (i = 0; i < FR_EMAIL_LEN * 31 - len; ++i) {
    hash = hash.update(new Uint8Array([0]))
  }
  const hashRes = hash.digest()
  const hashResRev = hashRes.reverse()
  hashResRev[31] &= 0x1f
  return '0x' + hashResRev.toString('hex')
}
function digestPermitMessage(address: string, expired: number): string {
  return keccak256(solidityPack(['address', 'uint256'], [address, expired]))
}
export const generatePermit = async (
  sessionKeyAddress: string,
  expires: number,
  cloudKeyPrivkey: string,
) => {
  const sig = await signMsg(digestPermitMessage(sessionKeyAddress, expires), cloudKeyPrivkey, true)
  const permit = solidityPack(['bytes', 'uint8'], [sig, SignerType.EthSig])

  return permit
}

// keysetHash
export const generateKeysetHash = (
  cloudKeyAddress: string,
  threshold: number,
  originEmails: string[],
) => {
  let keysetHash = keccak256(solidityPack(['address', 'uint16'], [cloudKeyAddress, threshold]))

  for (const email of originEmails) {
    keysetHash = keccak256(solidityPack(['bytes32', 'bytes32'], [keysetHash, emailHash(email)]))
  }

  return keysetHash
}

export const generateAccountAddress = (keysetHash: string): string => {
  if (keysetHash && MainModuleAddress && DkimKeysAddress && FactoryAddress && ProxyContractCode) {
    const code = solidityPack(['bytes', 'uint256'], [ProxyContractCode, MainModuleAddress])
    const codeHash = keccak256(code)
    const salt = keccak256(solidityPack(['bytes32', 'address'], [keysetHash, DkimKeysAddress]))
    const address = getCreate2Address(FactoryAddress, salt, codeHash)
    return address
  }
  return ''
}
