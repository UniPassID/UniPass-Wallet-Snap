import { OAuthUserInfo } from '@/utils/oauth/parse_hash'
import { TransactionProps, UnipassWalletProps } from '@unipasswallet/provider'

const snapId = process.env.VUE_APP_SNAP_ID as string
const snapVersion = process.env.VUE_APP_SNAP_VERSION as string

export async function snapConnect() {
  return await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: {
        version: snapVersion,
      },
    },
  })
}

async function checkSnaps() {
  const result = await window.ethereum.request({
    method: 'wallet_getSnaps',
  })
  return result[snapId] && result[snapId].version === snapVersion
}

export async function manageState(
  type: 'update' | 'get' | 'clear',
  data?: Record<string, unknown>,
) {
  const state = await checkSnaps()
  if (!state) {
    await snapConnect()
  }
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'up_manageState',
        params: { type, data },
      },
    },
  })
}

export async function getMasterKeyAddress(email: string): Promise<string> {
  const state = await checkSnaps()
  if (!state) {
    await snapConnect()
  }
  console.log('wallet_invokeSnap', 'up_getMasterKeyAddress')
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'up_getMasterKeyAddress',
        params: { email },
      },
    },
  })
}

export async function signMsgWithMM(
  message: string,
  from: string,
  email: string,
  prefix?: string,
): Promise<string> {
  const state = await checkSnaps()
  if (!state) {
    await snapConnect()
  }
  console.log('wallet_invokeSnap', 'up_signMessage')
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'up_signMessage',
        params: { from, message, email, prefix },
      },
    },
  })
}

export async function sendTransactionWithMM(
  unipassWalletProps: UnipassWalletProps & { oauthUserInfo: OAuthUserInfo | undefined },
  transactionParams: TransactionProps,
  email: string,
) {
  const state = await checkSnaps()
  if (!state) {
    await snapConnect()
  }
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'up_sendTransaction',
        params: { unipassWalletProps, transactionParams, email },
      },
    },
  })
}

export async function isMetamaskSnapsSupported() {
  try {
    await window.ethereum.request({
      method: 'wallet_getSnaps',
    })
    return true
  } catch (e) {
    return false
  }
}
