<template>
  <div id="page-send-result">
    <up-header :back="back"></up-header>
    <el-result v-if="icon" :icon="icon" :title="$t('SendSuccess')">
      <template #extra>
        <a class="underline explorer" :href="`${explorer}/tx/${hash}`" target="_blank">
          {{ $t('ViewInExplorer') }}
        </a>
        <br />
        <br />
        <el-button type="primary" v-if="sessionStoragePath" @click="approve">
          {{ $t('ClosePage') }}
        </el-button>
        <router-link to="/" v-else>
          <el-button type="primary">{{ $t('BackToHome') }}</el-button>
        </router-link>
      </template>
    </el-result>
    <template v-else>
      <br />
      <el-button loading size="large" link></el-button>
      <div>{{ $t('isTrading') }}</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useSendLoading } from '@/composable/useSend'
import router from '@/plugins/router'
import { UPMessage, UPResponse } from '@unipasswallet/popup-types'
import { postMessage } from '@unipasswallet/popup-utils'

const { icon, explorer, hash } = useSendLoading()

const sessionStoragePath = computed(() => {
  return sessionStorage.path === '/send-transaction'
})

const approve = async () => {
  console.log('[send transaction]')
  if (window?.flutter_inappwebview?.callHandler) {
    window.flutter_inappwebview.callHandler(
      'onSendTransactionResponse',
      new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('APPROVE', hash))),
    )
    return
  }
  postMessage(new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('APPROVE', hash))))

  if (sessionStorage.awakeAppUrl) {
    const redirectUrl = sessionStorage.awakeAppUrl
    sessionStorage.awakeAppUrl = ''
    location.href = redirectUrl
  }
}

const back = () => router.replace('/')
</script>
<style lang="scss">
#page-send-result {
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    .title {
      margin-top: 48px;
      font-size: 24px;
      font-weight: 600;
    }
    img.success {
      margin-top: 28px;
      width: 95px;
      height: 95px;
    }
    a.explorer {
      margin-top: 60px;
      font-size: 16px;
      font-weight: 400;
      color: #0364ff;
      text-decoration: underline;
    }
    .el-button {
      margin-top: 24px;
    }
  }
}
</style>
