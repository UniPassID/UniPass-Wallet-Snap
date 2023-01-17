<template>
  <div class="page connect-page-loading header-bg-img">
    <up-header :close="close" title="WalletConnect" />
    <div class="info">
      <div class="user-from">
        <div class="app-icon">
          <img src="@/assets/img/connect/wallet-connect.svg" />
        </div>
        <div class="to-box">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <img src="@/assets/img/index/avatar.svg" />
      </div>
      <div class="tips">WalletConnect Connecting</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@/plugins/router'
import { upTip } from '@/utils/useUniPass'

const { t: $t } = useI18n()

const close = () => {
  router.replace('/')
}

let timer: any

onMounted(() => {
  timer = setTimeout(() => {
    upTip($t('WCConnectTimeout'), 10000, true)
    router.replace('/')
  }, 12000)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<style lang="scss">
.connect-page-loading {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  padding: 24px;
  text-align: center;
  background-color: var(--up-background);
  background-size: cover;

  .info {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    .user-from {
      margin: 28px 0;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 74px;
        height: 74px;
      }

      .to-box {
        margin: 0 32px;
        width: 36px;
        height: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .dot {
          width: 4px;
          height: 4px;
          background: var(--up-line);
          border-radius: 50%;
        }
      }

      .app-icon {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        overflow: hidden;
      }
    }
    .tips {
      font-size: 16px;
      line-height: 24px;
      text-align: center;
      color: var(--up-text-secondary);
    }
  }
}
</style>
