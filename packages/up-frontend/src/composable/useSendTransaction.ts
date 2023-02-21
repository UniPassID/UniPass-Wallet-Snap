import { postMessage as popupPostMessage, registerPopupHandler } from '@unipasswallet/popup-utils'
import { useSignStore } from '@/store/sign'
import { UPTransactionMessage, UPMessage, UPResponse } from '@unipasswallet/popup-types'
import { isFlutterEnv, isPopupEnv, isUnityEnv, isUnRealEnv } from '@/service/check-environment'
import { utils } from 'ethers'
import { base64URLFormatter } from '@/utils/formatter'
import { useWalletConnectStore } from '@/store/wallet-connect'

const { toUtf8String, base64, toUtf8Bytes } = utils

export const useSendTransaction = () => {
  const signStore = useSignStore()
  const router = useRouter()
  const walletConnectStore = useWalletConnectStore()

  const popupHandler = async (event: MessageEvent) => {
    if (typeof event.data !== 'object') return
    if (event.data.type !== 'UP_TRANSACTION') return
    try {
      const { payload, appSetting } = event.data as UPMessage
      if (appSetting && payload) {
        signStore.initTransactionData(appSetting, JSON.parse(payload) as UPTransactionMessage)
      }

      // referrer
      if (sessionStorage.referrer) {
        signStore.referrer = sessionStorage.referrer
      } else {
        signStore.referrer = window.document.referrer
        sessionStorage.referrer = window.document.referrer
      }
    } catch (err) {
      console.error('err', err)
    }
  }

  const androidAndIosHandler = async () => {
    if (sessionStorage.redirectUrl) {
      try {
        // parse message from url hash
        const url = new URL(sessionStorage.redirectUrl)
        const hash = url.hash?.slice(1)
        const messageRequest = toUtf8String(base64.decode(base64URLFormatter(hash)))
        console.log('messageRequest', messageRequest)
        const value = JSON.parse(messageRequest)
        if (value.type !== 'UP_TRANSACTION') return
        const { payload, appSetting } = value
        // store current url for oauth redirect
        signStore.redirectUrl = sessionStorage.redirectUrl
        if (appSetting && payload) {
          signStore.initTransactionData(appSetting, payload as unknown as UPTransactionMessage)
        }
      } catch (err) {
        console.error('redirect init error', err)
      }
    }
  }

  const resister = async () => {
    sessionStorage.path = '/send-transaction'

    // unrealSendTransactionReady(unrealHandler)

    registerPopupHandler(popupHandler)

    // sendTransactionReady(flutterHandler)

    // vuplexSendTransactionReady(unityHandler)

    androidAndIosHandler()

    await walletConnectStore.init()
  }

  const reject = async () => {
    sessionStorage.removeItem('path')

    if (signStore.walletConnectId != null) {
      await walletConnectStore.walletConnectReject(
        signStore.walletConnectTopic,
        signStore.walletConnectId,
      )
      signStore.walletConnectTopic = ''
      signStore.walletConnectId = undefined
      router.replace('/')
      return
    }

    // popup must be first
    if (isPopupEnv()) {
      popupPostMessage(
        new UPMessage(
          'UP_RESPONSE',
          JSON.stringify(new UPResponse('DECLINE', 'user reject send transaction')),
        ),
      )
      return
    }

    if (isFlutterEnv()) {
      console.log('[flutter reject send transaction]')
      window.flutter_inappwebview.callHandler(
        'onSendTransactionResponse',
        new UPMessage(
          'UP_RESPONSE',
          JSON.stringify(new UPResponse('DECLINE', 'user reject send transaction')),
        ),
      )
      return
    }
    // for unity
    if (isUnityEnv()) {
      console.log('[unity reject]')
      window.vuplex.postMessage(
        new UPMessage(
          'UP_RESPONSE',
          JSON.stringify(new UPResponse('DECLINE', 'user reject send transaction')),
        ),
      )
      return
    }

    // for unity
    if (isUnRealEnv()) {
      console.log('[unreal reject]')
      window?.ue?.unipass?.onsendtransaction('')
      return
    }

    if (sessionStorage.redirectUrl) {
      const redirectUrl = new URL(sessionStorage.redirectUrl).searchParams.get('redirectUrl')
      sessionStorage.removeItem('redirectUrl')
      const response = {
        type: 'UP_SIGN_TRANSACTION',
        errorCode: 401,
        errorMsg: 'user reject sign transaction',
      }
      const base64Response = base64.encode(toUtf8Bytes(JSON.stringify(response)))
      // awake native app
      location.href = `${decodeURI(redirectUrl as string)}#${base64Response}`
    }
  }
  return { resister, reject }
}
