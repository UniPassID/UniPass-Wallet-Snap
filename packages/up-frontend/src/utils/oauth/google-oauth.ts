import crypto from 'crypto'
import { UpdateKeysetHashTxBuilder } from '@unipasswallet/transaction-builders'

const redirectURI = encodeURIComponent(window.location.origin + '/loading')

export const randomString = () => {
  return crypto
    .randomBytes(Math.ceil(8 / 2))
    .toString('hex')
    .slice(0, 8)
}

export const GOOGLE_OAUTH_CONFIG = {
  clientID: '1076249686642-g0d42524fhdirjeho0t6n3cjd7pulmns.apps.googleusercontent.com',
}

export const genGoogleOAuthUrl = (email?: string) => {
  const state = randomString()
  const nonce = randomString()
  if (email) {
    return `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=${redirectURI}&prompt=consent&response_type=id_token%20token&client_id=${GOOGLE_OAUTH_CONFIG.clientID}&scope=openid%20email&state=${state}&nonce=${nonce}&login_hint=${email}&flowName=GeneralOAuthFlow`
  }
  return `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=${redirectURI}&prompt=consent&response_type=id_token%20token&client_id=${GOOGLE_OAUTH_CONFIG.clientID}&scope=openid%20email&state=${state}&nonce=${nonce}&flowName=GeneralOAuthFlow`
}

export const genGoogleOAuthSignUrl = (nonce: string, email?: string) => {
  const state = randomString()
  if (email) {
    return `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=${redirectURI}&prompt=consent&response_type=id_token%20token&client_id=${GOOGLE_OAUTH_CONFIG.clientID}&scope=openid&state=${state}&nonce=${nonce}&login_hint=${email}&flowName=GeneralOAuthFlow`
  }
  return `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=${redirectURI}&prompt=consent&response_type=id_token%20token&client_id=${GOOGLE_OAUTH_CONFIG.clientID}&scope=openid&state=${state}&nonce=${nonce}&flowName=GeneralOAuthFlow`
}

export function getAccountSubject(
  address: string,
  newKeysetHash: string,
  metaNonce: number,
): string {
  const txBuilder = new UpdateKeysetHashTxBuilder(address, metaNonce, newKeysetHash, false)

  return txBuilder.digestMessage()
}
