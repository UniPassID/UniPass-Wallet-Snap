import {
  arrayify,
  computeAddress,
  concat,
  hashMessage,
  hexlify,
  keccak256,
  solidityPack,
  zeroPad,
} from 'ethers/lib/utils'
import { SignType } from '@unipasswallet/keys'
import api, {
  FinishKeygenInput,
  KeyGenInput,
  SignInput,
  StartKeyGenInput,
} from '../service/backend'
import { TssWorker } from '@unipasswallet/provider'
import { subDigest } from '@unipasswallet/utils'

export const SIG_PREFIX = {
  LOGIN: 'login UniPass:',
  UPDATE_GUARDIAN: 'update guardian:',
  UPLOAD: 'up master key server upload request:',
  BIND_2FA: 'bind 2FA:',
  UNBIND_2FA: 'unbind 2FA:',
  UPDATE_2FA: 'update 2FA:',
  QUERY_SYNC_STATUS: 'query sync status:',
  GET_SYNC_TRANSACTION: 'get sync transaction:',
}

export interface StartKeygenData {
  keygenInput: KeyGenInput
  context2: string
}

export interface GetKeygenData {
  signContext2: any
  finishKeygenInput: FinishKeygenInput
}

export interface LocalKeyData {
  localKeyAddress: string
  userId: string
  keystore: string
}

export interface decryptLocalKeyData {
  localKey: any
  localKeyAddress: string
}

const startKeygen = async (data: StartKeyGenInput): Promise<StartKeygenData> => {
  const startKeygen = await api.startKeygen(data)

  const res = startKeygen.data.tssRes

  const [context2, p2FirstMsg] = await TssWorker.getP2KeyGen1(res)
  const keygenInput: KeyGenInput = {
    sessionId: res.sessionId,
    tssMsg: p2FirstMsg,
    email: data.email,
    action: data.action,
  }
  return {
    context2,
    keygenInput,
  }
}

const getKeygen = async (startKeygenData: StartKeygenData): Promise<GetKeygenData> => {
  const keygen = await api.getKeygen(startKeygenData.keygenInput)
  const res = keygen.data.tssRes

  const [signContext2, pubkey] = await TssWorker.getP2KeyGen2(res, startKeygenData.context2)
  const localKeyAddress = computeAddress(pubkey.point)
  const finishKeygenInput = {
    sessionId: res.sessionId,
    email: startKeygenData.keygenInput.email,
    userId: res.userId,
    localKeyAddress,
    action: startKeygenData.keygenInput.action,
  }

  return { signContext2, finishKeygenInput }
}

const finishKeygen = async (getKeygenData: GetKeygenData): Promise<LocalKeyData> => {
  const { signContext2, finishKeygenInput } = getKeygenData

  // const keystore = await encryptKeystore(Buffer.from(JSON.stringify(signContext2)), password, {
  //   scrypt: { N: 16 },
  // })

  await api.finishKeygen(finishKeygenInput)
  const { userId, localKeyAddress } = finishKeygenInput
  return { localKeyAddress, userId, keystore: JSON.stringify(signContext2) }
}

const generateLocalKey = async (data: StartKeyGenInput): Promise<LocalKeyData | null> => {
  try {
    let startKeygenData: StartKeygenData
    try {
      startKeygenData = await startKeygen(data)
    } catch (error) {
      return null
    }
    const keygenData = await getKeygen(startKeygenData)
    const localKeyData = await finishKeygen(keygenData)
    console.log('[generateLocalKey] localKeyData', localKeyData.localKeyAddress)
    return localKeyData
  } catch (error) {
    return generateLocalKey(data)
  }
}

export function digestPermitMessage(
  sessionKeyAddress: string,
  timestamp: number,
  weight: number,
  userAddr: string,
): string {
  return subDigest(
    0,
    userAddr,
    keccak256(
      solidityPack(['address', 'uint32', 'uint32'], [sessionKeyAddress, timestamp, weight]),
    ),
  )
}

const startMessageSign = async (
  localKey: any,
  localKeyAddress: string,
  rawData: string,
): Promise<SignInput> => {
  const messageHash = hashMessage(arrayify(rawData))
  const msgHash = Array.from(arrayify(messageHash))

  const data = await TssWorker.getLi17P2Sign1(localKey, msgHash)
  if (!data) throw Error('error')

  const [context1, message1] = data
  const value = rawData
  const startSign = await api.startSign({
    tssMsg: message1,
    value,
    localKeyAddress,
  })
  const res = startSign.data.tssRes
  const sessionId = res.sessionId

  const [partialSig, message2] = await TssWorker.getLi17P2Sign2(context1, res.msg)

  return { tssMsg: [partialSig, message2], value, sessionId }
}
const sign = async (signInput: SignInput): Promise<string> => {
  const startSign = await api.sign(signInput)
  const res = startSign.data.tssRes
  let sig = res.msg
  sig.r = zeroPad(sig.r, 32)
  sig.s = zeroPad(sig.s, 32)
  const sigArray = concat([sig.r, sig.s, sig.recid])
  sig = hexlify(sigArray)
  console.log(`[sign] sign = ${sig}`)
  const signStart = sig.slice(0, sig.length - 2)
  if (sig.endsWith('01')) {
    // 01 => 1c
    sig = `${signStart}1c`
  }
  if (sig.endsWith('00')) {
    // 00 => 1b
    sig = `${signStart}1b`
  }
  return sig
}

const generateTxSig = async (
  localKey: any,
  localKeyAddress: string,
  rawData: string,
): Promise<string> => {
  try {
    let signInput: SignInput
    try {
      signInput = await startMessageSign(localKey, localKeyAddress, rawData)
    } catch (error) {
      return ''
    }

    const signData = await sign(signInput)
    console.log('[generateTxSig] signData', rawData)
    return signData
  } catch (error) {
    return generateTxSig(localKey, localKeyAddress, rawData)
  }
}

// todo rbac tx
const generateTssTxSignature = async (
  localKey: any,
  localKeyAddress: string,
  rawData: string,
  signType = SignType.EthSign,
) => {
  const sig = await generateTxSig(JSON.parse(localKey), localKeyAddress, rawData)
  console.log('[generateTssTxSignature] sig', sig)
  const signature = solidityPack(['bytes', 'uint8'], [sig, signType])

  return signature
}

const Tss = {
  generateLocalKey,
  generateTssTxSignature,
}

export default Tss
