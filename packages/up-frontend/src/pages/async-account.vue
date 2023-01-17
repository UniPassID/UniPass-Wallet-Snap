<template>
  <div class="page-sign header-bg-img">
    <up-header-connect hide-chain />
    <up-sign class="transaction" :cancel="reject" :sync-mode="true" />
  </div>
</template>
<script setup lang="ts">
import { useSign } from '@/composable/useSign'
import router from '@/plugins/router'
import { useWalletConnectStore } from '@/store/wallet-connect'

const { signStore, updateGasFee, userStore } = useSign()
const walletConnectStore = useWalletConnectStore()

onBeforeMount(() => {
  sessionStorage.path = '/async-account'
  updateGasFee()
  userStore.pollNetWorth()
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
  router.replace('/')
}
</script>

<style lang="scss">
.page-sign {
  .up-sign.transaction {
    margin-top: 0;
  }
}
</style>
