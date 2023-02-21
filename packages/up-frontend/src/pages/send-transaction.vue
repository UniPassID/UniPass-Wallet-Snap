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

const { signStore } = useSign()
const walletConnectStore = useWalletConnectStore()

const init = async () => {
  sessionStorage.path = '/send-transaction'
  const sdkHandle = useSDK()

  // Make sure the unreal callback function is before the async function
  await sdkHandle.initUserStoreFromSDK()

  await walletConnectStore.init()
}

onBeforeMount(init)

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
}
</script>

<style lang="scss">
.page-sign {
  .up-sign.transaction {
    margin-top: 0;
  }
}
</style>
