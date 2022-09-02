declare global {
  interface Window {
    // metamask
    ethereum: any
    // walletconnect
    connector: any
    WeixinJSBridge: any
    // scan
    mozRequestAnimationFrame: any
    webkitRequestAnimationFrame: any
    msRequestAnimationFrame: any
    mozCancelAnimationFrame: any
  }
}

export {}
