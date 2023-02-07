import { GuardianData } from '@/service/backend'
import { utils, BytesLike } from 'ethers'
import {
  Keyset,
  KeyEmailDkim,
  KeyOpenIDWithEmail,
  KeySecp256k1,
  SignType,
  RoleWeight,
} from '@unipasswallet/keys'

import { Weight } from './weight'
import { createHash } from 'crypto'

interface GuardianEmailData {
  email: string
  emailHash: string
  weight: number
  isDkimEmail: boolean
}

export interface ISendRecoveryAction {
  canSendStartRecoveryTx: boolean
  isHaveTimeLock: boolean
  isPolicy: boolean
}

// for signUp
export function getAccountKeysetJson(
  guardians: GuardianData[],
  openIDOptionsOrOpenIDHash: any,
  email: string,
  masterKeyAddress: string,
  policyKeysetJson: string,
  pepper: string,
): Keyset {
  const weight = new Weight()
  const masterWeight = weight.getMasterKeyWeight()

  const masterKeyData = new KeySecp256k1(
    masterKeyAddress,
    new RoleWeight(
      masterWeight.ownerWeight,
      masterWeight.assetsOpWeight,
      masterWeight.guardianWeight,
    ),
    SignType.EthSign,
    async () => Promise.resolve(''),
  )
  const policyData = Keyset.fromJson(policyKeysetJson).keys[0]

  const guardiansList: KeyEmailDkim[] = []
  for (const item of guardians) {
    let emailRoleWeight =
      guardians.length < 2 ? weight.getOneGuardianWeight() : weight.getMoreGuardianWeight()

    if (item.isSelfGuardian === true) {
      emailRoleWeight = weight.getSelfGuardianlWeight()
    }
    const keyBase = new KeyEmailDkim(
      item.email.includes('*') ? 'Hash' : 'Raw',
      item.email,
      item.pepper,
      new RoleWeight(
        emailRoleWeight.ownerWeight,
        emailRoleWeight.assetsOpWeight,
        emailRoleWeight.guardianWeight,
      ),
      undefined,
      item.emailHash,
    )
    guardiansList.push(keyBase)
  }

  const getRegisterWeight = weight.getRegisterEmailWeight()
  const keysetData = Keyset.create(
    email,
    pepper,
    openIDOptionsOrOpenIDHash,
    masterKeyData,
    guardiansList,
    policyData,
    new RoleWeight(
      getRegisterWeight.ownerWeight,
      getRegisterWeight.assetsOpWeight,
      getRegisterWeight.guardianWeight,
    ),
  )

  return keysetData
}

// for Guardian
export function setGuardianForKeyset(keyset: Keyset, guardians: GuardianData[]) {
  const keys = keyset.keys
  const weight = new Weight()
  const guardianWeight =
    guardians.length === 1 ? weight.getOneGuardianWeight() : weight.getMoreGuardianWeight()
  const _guardians = guardians.map((g) => {
    return new KeyEmailDkim(
      g.rawOrHash,
      g.email,
      g.pepper,
      new RoleWeight(
        guardianWeight.ownerWeight,
        guardianWeight.assetsOpWeight,
        guardianWeight.guardianWeight,
      ),
      undefined,
      g.emailHash,
    )
  })
  const startKeys = keys.slice(0, 2)
  const endKeys = keys.slice(-1) ?? []
  const newKeys = [...startKeys, ..._guardians, ...endKeys]
  return new Keyset(newKeys)
}

export function updateKeyset(keysetJson: string, masterKeyAddress: string): Keyset {
  const keyset = Keyset.fromJson(keysetJson)
  const weight = new Weight()
  const masterWeight = weight.getMasterKeyWeight()
  const masterKeyData = new KeySecp256k1(
    masterKeyAddress,
    new RoleWeight(
      masterWeight.ownerWeight,
      masterWeight.assetsOpWeight,
      masterWeight.guardianWeight,
    ),
    SignType.EthSign,
    async () => Promise.resolve(''),
  )
  keyset.keys[0] = masterKeyData
  console.log(keyset.keys)

  return keyset
}

export function getGuardianEmailData(keysetJson: string): GuardianEmailData[] {
  const keyset = Keyset.fromJson(keysetJson)

  const emails: GuardianEmailData[] = []

  keyset.keys.forEach((item) => {
    if (KeyEmailDkim.isKeyEmailDkim(item)) {
      emails.push({
        email: item.emailFrom,
        emailHash: item.emailHash,
        weight: item.roleWeight.guardianWeight,
        isDkimEmail: true,
      })
    } else if (KeyOpenIDWithEmail.isKeyOpenIDWithEmail(item)) {
      const email =
        typeof item.emailOptionsOrEmailHash === 'string'
          ? ''
          : item.emailOptionsOrEmailHash.emailFrom
      const emailHash =
        typeof item.emailOptionsOrEmailHash === 'string'
          ? ''
          : item.emailOptionsOrEmailHash.emailHash
      emails.push({
        email,
        emailHash,
        weight: item.roleWeight.guardianWeight,
        isDkimEmail: false,
      })
    }
  })

  return emails
}

function getGuardianWeight(guardianWeight: number, isPolicy: boolean): ISendRecoveryAction {
  const sendRecoveryEmailWeight: ISendRecoveryAction = {
    canSendStartRecoveryTx: false,
    isHaveTimeLock: true,
    isPolicy,
  }

  if (guardianWeight >= 100) {
    sendRecoveryEmailWeight.canSendStartRecoveryTx = true
    sendRecoveryEmailWeight.isHaveTimeLock = false
  } else if (guardianWeight < 100 && guardianWeight >= 50) {
    // guardian email+ guardian email or guardian+ register email
    sendRecoveryEmailWeight.canSendStartRecoveryTx = true
    sendRecoveryEmailWeight.isHaveTimeLock = true
  } else {
    sendRecoveryEmailWeight.canSendStartRecoveryTx = false
    sendRecoveryEmailWeight.isHaveTimeLock = false
  }

  return sendRecoveryEmailWeight
}

export function calculateGuardianWeight(
  keysetJson: string,
  verificationEmailHashs: string[],
): ISendRecoveryAction {
  const keyset = Keyset.fromJson(keysetJson)
  let guardianWeight = 0
  const isPolicy = keyset.keys.length > 3 ? false : true

  for (const item of keyset.keys) {
    let hash = ''
    const weight = item.roleWeight.guardianWeight

    if (KeyOpenIDWithEmail.isKeyOpenIDWithEmail(item)) {
      hash =
        typeof item.emailOptionsOrEmailHash === 'string'
          ? item.emailOptionsOrEmailHash
          : item.emailOptionsOrEmailHash.emailHash
    } else if (KeyEmailDkim.isKeyEmailDkim(item)) {
      hash = item.emailHash
    } else continue

    if (!verificationEmailHashs.includes(hash)) {
      continue
    }

    guardianWeight += weight
  }

  if (isPolicy && keyset.keys.length === 3) {
    guardianWeight += keyset.keys[keyset.keys.length - 1].roleWeight.ownerWeight
  }

  const sendRecoveryEmailWeight = getGuardianWeight(guardianWeight, isPolicy)

  return sendRecoveryEmailWeight
}

export function addSignCapabilityToKeyset(
  keysetJson: string,
  signFunc: (digestHash: BytesLike, signType: SignType) => Promise<string>,
): Keyset {
  const keyset = Keyset.fromJson(keysetJson)
  const masterKey = keyset.keys[0] as KeySecp256k1
  masterKey.signFunc = signFunc
  keyset.keys[0] = masterKey
  return keyset
}

export function sha256Hash(email: string, pepper: string): string {
  if (!email) {
    return ''
  }

  const data = utils.concat([utils.toUtf8Bytes(email), utils.arrayify(pepper)])
  const hash = createHash('sha256').update(data).digest('hex')

  return `0x${hash}`
}

export function getFuzzyEmail(email: string) {
  if (!email) {
    return ''
  }

  const emailData = email.split('@')
  const emailStart = emailData[0][0]
  const emailEnd = emailData[0][emailData[0].length - 1]

  if (email.includes('@')) {
    return `${emailStart}***${emailEnd}@${emailData[1]}`
  }

  return `${emailStart}***${emailEnd}`
}

export function hideSecurityInformation(keysetJson: string) {
  const keyset = Keyset.fromJson(keysetJson)

  const keys = keyset.keys

  for (const [index, item] of keys.entries()) {
    if (index < 2) {
      // register email show info
      continue
    }

    const key = item as KeyEmailDkim

    if (!key.emailFrom) {
      continue
    }

    const hiddenKey = new KeyEmailDkim(
      'Hash',
      getFuzzyEmail(key.emailFrom),
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      key.roleWeight,
      key.getDkimParams(),
      key.emailHash,
    )
    keys[index] = hiddenKey
  }

  return keyset.toJson()
}
