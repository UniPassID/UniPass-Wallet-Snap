<template>
  <div class="page-sign header-bg-img">
    <up-header-connect hide-chain />
    <up-sign class="transaction" :cancel="reject" />
  </div>
</template>
<script setup lang="ts">
import { useSign } from '@/composable/useSign'
import router from '@/plugins/router'
import { useSDK } from '@/composable/useSDK'
import { useWalletConnectStore } from '@/store/wallet-connect'
import { upGA } from '@/utils/useUniPass'
import { getChainName } from '@/service/chains-config'
import { UPTransactionMessage, UPMessage, UPResponse } from '@unipasswallet/popup-types'
import {
  registerPopupHandler,
  unregisterPopupHandler,
  postMessage,
} from '@unipasswallet/popup-utils'
import { isPopupEnv } from '@/service/check-environment'

const { signStore } = useSign()
const walletConnectStore = useWalletConnectStore()

const init = async () => {
  sessionStorage.path = '/send-transaction'
  const sdkHandle = useSDK()

  // Make sure the unreal callback function is before the async function
  await sdkHandle.initUserStoreFromSDK()

  await walletConnectStore.init()

  registerPopupHandler(async (event: MessageEvent) => {
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
  })
}

onBeforeMount(init)

onBeforeUnmount(() => {
  unregisterPopupHandler()
})

onMounted(() => {
  upGA('transaction_start', {
    dapp: walletConnectStore.getDappName(),
    chain: getChainName(signStore.chain),
  })
})

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
    postMessage(
      new UPMessage(
        'UP_RESPONSE',
        JSON.stringify(new UPResponse('DECLINE', 'user reject send transaction')),
      ),
    )
    return
  }
}
</script>

<style lang="scss">
.page-sign {
  .up-sign.transaction {
    margin-top: 0;
  }
}
</style>
