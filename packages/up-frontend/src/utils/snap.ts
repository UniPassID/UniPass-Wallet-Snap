import { arrayify, isHexString, verifyMessage } from 'ethers/lib/utils'

// const snapId = 'npm:up-snap'
const snapId = process.env.VUE_APP_SNAP_ID as string
console.log('snapId', snapId)

export async function connect() {
  const result = await window.ethereum.request({
    method: 'wallet_enable',
    params: [
      {
        wallet_snap: {
          [snapId]: {},
        },
        eth_accounts: {},
      },
    ],
  })
  console.log('result', result)

  return result
}

export async function getMasterKeyAddressFromSnap() {
  const address = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: [snapId, { method: 'up_getMasterKeyAddress' }],
  })

  console.log('snap address', address)
  return address
}

export async function signMessageFromSnap(message: string, from: string) {
  const sig = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: [snapId, { method: 'up_signMessage', params: { from, message } }],
  })

  console.log('snap sig', sig)
  console.log('message', message)
  const recoveredAddress = verifyMessage(isHexString(message) ? arrayify(message) : message, sig)
  console.log('recoveredAddress', recoveredAddress)

  return sig
}
