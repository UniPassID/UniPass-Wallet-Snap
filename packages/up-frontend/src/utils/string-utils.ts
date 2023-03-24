import { getChainIdByChainType } from '@/service/chains-config'
import dayjs from 'dayjs'
import { randomString } from './oauth/google-oauth'

export const isSameAddress = (addr1?: string, addr2?: string) => {
  if (!addr1 || !addr2) return false
  return addr1.toLowerCase() === addr2.toLowerCase()
}

export const isNewerVersion = (current: string, comparingWith: string): boolean => {
  if (current === comparingWith) return false

  const regex = /[^\d.]/g
  const currentFragments = current.replace(regex, '').split('.')
  const comparingWithFragments = comparingWith.replace(regex, '').split('.')

  const length =
    currentFragments.length > comparingWithFragments.length
      ? currentFragments.length
      : comparingWithFragments.length
  for (let i = 0; i < length; i++) {
    if ((Number(currentFragments[i]) || 0) === (Number(comparingWithFragments[i]) || 0)) continue
    return (Number(comparingWithFragments[i]) || 0) > (Number(currentFragments[i]) || 0)
  }

  return true
}

export function prepareSignMessage(scene: 'signUp' | 'signIn' | 'recovery', masterKey: string) {
  const uri = process.env.VUE_APP_LOCATION
  const version = 1
  const chainId = getChainIdByChainType('polygon')
  const nonce = randomString()
  const issuedAt = dayjs().toISOString()
  const expirationTime = dayjs().add(10, 'minute').toISOString()
  let message = ''
  const descriptionMap = {
    signUp: `Smart Wallet Snap wants you to sign up with your Ethereum account:\n${masterKey}\n\nI accept to register Smart Wallet Snap with my Ethereum account.\n\n`,
    signIn: `Smart Wallet Snap wants you to sign in with your Ethereum account:\n${masterKey}\n\nI accept to sign in to Smart Wallet Snap with my Ethereum account.\n\n`,
    recovery: `Smart Wallet Snap wants you to recover with your Ethereum account:\n${masterKey}\n\nI accept to recover Smart Wallet Snap with my Ethereum account.\n\n`,
  }
  message += descriptionMap[scene]
  message += `URI: ${uri}\n\n`
  message += `Version: ${version}\n\n`
  message += `Chain ID: ${chainId}\n\n`
  message += `Nonce: ${nonce}\n\n`
  message += `Issued At: ${issuedAt}\n\n`
  message += `Expiration Time: ${expirationTime}`
  return message
}
