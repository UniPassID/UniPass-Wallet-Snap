import { toUtf8Bytes, toUtf8String } from 'ethers/lib/utils'
import { encryptKeystore, decryptKeystore } from '@unipasswallet/utils'
import { genUnipassWalletContext } from '@/service/blockchain'
import { SyncAccountTxBuilder } from '@unipasswallet/transaction-builders'
import { useChainAccountStore } from '@/store/chain-account'

export const AWS_CONFIG = {
  region: 'us-east-1',
  // (optional) -  Amazon Cognito User Pool ID
  aws_user_pools_id: 'us-east-1_37CBi928o',
  // (optional) - Amazon Cognito App Client ID (App client secret needs to be disabled)
  aws_user_pools_web_client_id: '7nf4apvrm5a269r9c40h271u3e',
  // (optional) - Amazon Cognito Identity Pool ID
  aws_cognito_identity_pool_id: 'us-east-1:f378a48d-242b-4b85-9bf9-b8b81005147f',
  aws_mandatory_sign_in: 'enable',
  KeyId: '0175d998-7b7d-459c-93ba-eb2f30696b1a',
}

// const formatFederatedType = (type: number) => {
//   switch (type) {
//     case 0:
//       return 'google' // google oauth
//     case 1:
//       return AUTH0_CONFIG.domain // auth0
//     default:
//       return 'google'
//   }
// }

// interface HMacKMSParams {
//   oauth_provider: OAuthProvider
//   id_token: string
//   expires_at: string
//   email: string
//   password: string
//   unipass_info?: any
// }

// export const generateHMacByKMS = async (params: HMacKMSParams, password: string) => {
//   const { oauth_provider, id_token, expires_at, email } = params
//   const credentials = await Auth.federatedSignIn(
//     formatFederatedType(oauth_provider),
//     { token: id_token, expires_at: Number(expires_at) },
//     { email, name: email.split('@')[0] },
//   )

//   const client = new KMSClient({ region: AWS_CONFIG.region, credentials })

//   const command = new GenerateMacCommand({
//     KeyId: AWS_CONFIG.KeyId,
//     Message: toUtf8Bytes(`${email}:${password}`),
//     MacAlgorithm: 'HMAC_SHA_256',
//   })

//   const ret = await client.send(command)
//   const { Mac } = ret
//   if (!Mac) throw new Error('KMS HMac password error')
//   return hexlify(Mac)
// }

export async function safeEncryptKeystore(
  originKey: string,
  // params: HMacKMSParams,
  password: string,
): Promise<string> {
  // const hmac = await generateHMacByKMS(params, password)
  const encryptedKeystore = await encryptKeystore(toUtf8Bytes(originKey), password, {
    scrypt: { N: 16 },
  })
  return encryptedKeystore
}

export async function safeDecryptKeyStore(
  enctypedKeystore: string,
  // params: HMacKMSParams,
  password: string,
): Promise<string> {
  // const hmac = await generateHMacByKMS(params, password)
  const originKey = await decryptKeystore(enctypedKeystore, password)
  return toUtf8String(originKey)
}

export const getSyncAccountDigestMessage = async (
  keysetHash: string,
  metaNonce: number,
  accountAddress: string,
): Promise<string> => {
  metaNonce = metaNonce - 1
  const chainAccountStore = useChainAccountStore()
  const implementationAddress = genUnipassWalletContext().moduleMainUpgradable

  console.log(`keysetHash: ${keysetHash}`)
  console.log(`metaNonce: ${metaNonce}`)
  console.log(`accountAddress: ${accountAddress}`)
  console.log(`lockDuration: ${chainAccountStore.lockDuration}`)
  console.log(`implementationAddress: ${implementationAddress}`)

  const txBuilder = new SyncAccountTxBuilder(
    accountAddress,
    metaNonce,
    keysetHash,
    chainAccountStore.lockDuration,
    implementationAddress,
    false,
  )

  return txBuilder.digestMessage()
}
