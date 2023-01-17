<template>
  <div></div>
</template>

<!-- this page is for wallet connect desktop -->
<script setup lang="ts">
import { ElLoading } from 'element-plus'
import router from '@/plugins/router'
import { useWalletConnectStore } from '@/store/wallet-connect'
import DB from '@/store/index_db'
import { useUserStore } from '@/store/user'

const walletConnectStore = useWalletConnectStore()
const userStore = useUserStore()
const route = useRoute()

onBeforeMount(async () => {
  const _account_info = await DB.getAccountInfo()
  if (!_account_info) {
    sessionStorage.redirectUrl = location.href
    return
  }
  await userStore.init()

  const wallet_connect_uri = route.query?.uri || ''

  if (!wallet_connect_uri || typeof wallet_connect_uri !== 'string') {
    router.replace('/')
    return
  }

  console.log(`wallet_connect_uri: ${decodeURIComponent(wallet_connect_uri)}`)

  try {
    if (wallet_connect_uri) {
      walletConnectStore.init().then(() => {
        walletConnectStore.pair(decodeURIComponent(wallet_connect_uri))
      })
    }
  } catch (e) {
    router.replace('/')
  }
})

const loading = ElLoading.service({
  lock: true,
  background: 'transparent',
})

onBeforeUnmount(() => {
  loading.close()
})
</script>

<style lang="scss"></style>
