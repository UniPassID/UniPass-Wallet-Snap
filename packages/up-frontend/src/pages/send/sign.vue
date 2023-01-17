<template>
  <div id="page-send-sign">
    <up-header :title="$t('Sign')" :back="back" />
    <up-sign :cancel="back" class="transaction" />
  </div>
</template>

<script lang="ts" setup>
import { useSign } from '@/composable/useSign'
import router from '@/plugins/router'
import { getChainName } from '@/service/chains-config'
import { upGA } from '@/utils/useUniPass'
const { t: $t } = useI18n()

const { updateGasFee, signStore, userStore } = useSign()

const back = () => router.replace('/')

onBeforeMount(async () => {
  if (signStore.cards.length === 0) {
    router.replace('/')
    return
  }
  updateGasFee()
  signStore.signMassage.referrer = ''
  userStore.appIcon = ''
})

onMounted(() => {
  upGA('transaction_start', {
    dapp: 'unipassWallet',
    chain: getChainName(signStore.chain),
  })
})
</script>

<style lang="scss">
#page-send-sign {
  .up-sign {
    border: 0;
  }
}
</style>
