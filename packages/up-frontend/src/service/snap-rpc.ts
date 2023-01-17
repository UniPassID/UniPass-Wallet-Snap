const snapId = process.env.VUE_APP_SNAP_ID as string

export async function getMasterKeyAddress(): Promise<string> {
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: [
      snapId,
      {
        method: 'up_getMasterKeyAddress',
      },
    ],
  })
}

export async function signMsgWithMM(message: string, from: string): Promise<string> {
  return window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: [
      snapId,
      {
        method: 'up_signMessage',
        params: { from, message },
      },
    ],
  })
}
