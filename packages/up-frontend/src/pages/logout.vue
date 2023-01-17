<template>
  <div class="page connect-page-loading header-bg-img">
    <div class="info">
      <div class="user-from">
        <div class="to-box">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
      <div class="tips">Logging out</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { utils } from 'ethers'
import { useUserStore } from '@/store/user'
import { isRedirectEnv } from '@/service/check-environment'

const userStore = useUserStore()
const route = useRoute()
let redirectUrl

if (isRedirectEnv()) {
  const response = {
    type: 'UP_LOGOUT',
  }
  const base64Response = utils.base64.encode(utils.toUtf8Bytes(JSON.stringify(response)))
  redirectUrl = `${decodeURI(route.query.redirectUrl as string)}#${base64Response}`
  userStore.exit(false, redirectUrl)
}
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
