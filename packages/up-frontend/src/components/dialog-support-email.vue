<template>
  <el-dialog
    v-model="userStore.showSupportEmail"
    center
    :title="$t('SupportMail')"
    custom-class="dialog-support-email"
  >
    <div class="content">
      {{ $t('UniPassDKIM') }}
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/google.svg" />
      <div class="suffix">
        <span>gmail.com</span>
        <span>googlemail.com</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/outlook.svg" />
      <div class="suffix">
        <span>outlook.com</span>
        <span>hotmail.com</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/yahoo.svg" />
      <div class="suffix">
        <span>yahoo.com</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/protonmail.svg" />
      <div class="suffix">
        <span>protonmail.com</span>
        <span>proton.me</span>
        <span>pm.me</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/icloud.png" />
      <div class="suffix">
        <span>icloud.com</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/mail.svg" />
      <div class="suffix">
        <span>mail.com</span>
      </div>
    </div>
    <div class="mail">
      <img class="logo" src="@/assets/img/support-email/consensys.svg" />
      <div class="suffix">
        <span>consensys.net</span>
      </div>
    </div>
  </el-dialog>
</template>
<script lang="ts" setup>
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
</script>
<style lang="scss">
.el-dialog.dialog-support-email {
  border-radius: 16px;

  .el-dialog__header {
    font-size: 20px;
    font-weight: bold;
  }

  .el-dialog__body {
    padding-top: 0;
    text-align: center;

    .content {
      color: var(--text-regular);
      word-break: break-word;
      margin-top: 0;
    }

    .mail {
      margin-top: 20px;

      .logo {
        height: 28px;
        width: 137px;
        object-fit: contain;
      }

      .suffix {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;

        span + span {
          margin-left: 10px;
        }
      }
    }
  }
}
</style>
