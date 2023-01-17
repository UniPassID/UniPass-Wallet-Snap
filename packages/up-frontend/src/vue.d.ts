declare global {
  interface Window {
    // metamask
    ethereum: any
    // walletconnect
    connector: any
    WeixinJSBridge: any
    // flutter webview global var
    flutter_inappwebview: any
    onConnectPageReady: any
    onSignMessageReady: any
    onSendTransactionReady: any

    // unity webview global var
    vuplex: any
    vuplexReady: any
    onSignMessagePageReady: any
    onSendTransactionPageReady: any

    // unreal webview global var
    ue: any

    // camera
    mozRequestAnimationFrame: (callback: FrameRequestCallback) => number
    webkitRequestAnimationFrame: (callback: FrameRequestCallback) => number
    msRequestAnimationFrame: (callback: FrameRequestCallback) => number
    mozCancelAnimationFrame: (callback: FrameRequestCallback) => number
  }
}

export {}
