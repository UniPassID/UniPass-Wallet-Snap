<template>
  <div class="up-header-connect">
    <div class="header">
      <div class="user">
        <div class="left">
          <img src="@/assets/img/index/avatar.svg" />
        </div>
        <div class="right">
          <div class="email">{{ userStore.accountInfo.email }}</div>
          <div class="address" @click="unipass.copy(userStore.accountInfo.address)">
            <span>{{ unipass.formatAddress(userStore.accountInfo.address) }}</span>
            <up-icon name="copy" />
          </div>
        </div>
      </div>
      <div class="wallet">
        <up-button type="info" class="setting" @click="$router.push('/setting')">
          <up-icon name="setting" />
        </up-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIndex } from '@/composable/useIndex'
import { useUniPass } from '@/utils/useUniPass'
import UpIcon from '@/components/up-icon.vue'

const unipass = useUniPass()

const { userStore } = useIndex()
</script>

<style lang="scss">
.up-header-connect {
  width: 100%;
  max-width: 1180px;
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    .user {
      text-align: left;
      display: flex;
      .left {
        border-radius: 50%;
        width: 40px;
        height: 40px;
        background: #000000;
        border: 1px solid #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
      }
      .right {
        .email {
          font-size: 16px;
          font-weight: 600;
          line-height: 16px;
        }
        .address {
          cursor: pointer;
          margin-top: 8px;
          font-size: 14px;
          line-height: 14px;
          font-weight: 400;
          color: var(--up-text-third);
          display: flex;
          justify-content: flex-start;
          align-items: center;
          .icon-copy {
            margin-left: 6px;
          }
        }
      }
    }
    .wallet {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      line-height: 16px;

      .setting {
        border-radius: 16px;
        width: 40px;
        height: 40px;
        margin-left: 20px;
        .icon-setting {
          font-size: 24px;
        }
      }

      .icon-wallet {
        margin-right: 6px;
        font-size: 20px;
      }
    }
  }
  .more-box {
    margin-top: 24px;
    display: flex;
    align-items: center;
    .up-button {
      height: 40px;

      &.setting,
      &.exit {
        border-radius: 16px;
        width: 40px;
        margin-left: 20px;
      }
    }
  }
  .more {
    // cursor: pointer;
    margin-top: 12px;
    font-size: 20px;
    transition: transform var(--el-transition-duration);
    &.show {
      transform: rotateZ(180deg);
    }
  }
}
</style>
