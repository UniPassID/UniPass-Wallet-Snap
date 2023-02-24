<template>
  <div id="page-password-login">
    <up-header :back="back" />

    <div v-if="oauthStore.isPending" class="account-recovering">
      <div class="left">
        <span>{{ $t('Notification') }}</span>
        <span>{{ $t('IsRecovering') }}</span>
      </div>
      <up-button class="right" type="primary" @click="toRecovering">{{ $t('Details') }}</up-button>
    </div>

    <h2>{{ $t('WelcomeBack') }}</h2>
    <h4>{{ $t('WelcomeMessage') }}</h4>
    <el-form @submit.prevent ref="formElement" :model="oauthStore">
      <up-form-item
        :label="oauthStore.password && $t('Password')"
        prop="password"
        type="password"
        :rules="[{ validator: unipass.checkPassword, trigger: 'blur' }]"
      >
        <up-input
          :placeholder="$t('EnterPassword')"
          @input="(v: string) => (oauthStore.password = unipass.formatPassword(v))"
          v-model="oauthStore.password"
          @focus="formElement?.clearValidate('password')"
          show-password
          :disabled="loading || oauthStore.passwordLoading"
          @keydown.enter="oauthStore.password && login()"
          clearable
        />
      </up-form-item>
      <div v-if="!oauthStore.isPending" class="forgot-password">
        <router-link class="underline" to="/recovery">{{ $t('ForgotPassword') }}</router-link>
      </div>
      <up-button
        class="submit"
        type="primary"
        @click="login"
        :loading="loading || oauthStore.passwordLoading"
        :disabled="!oauthStore.password"
      >
        {{ $t('Login') }}
      </up-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useOAuth } from '@/composable/useOAuth'
import router from '@/plugins/router'
import { getOAuthUserInfo } from '@/store/storages'

const { unipass, oauthStore, login, formElement, loading } = useOAuth()

const back = () => router.replace('/login')
const oauthUserInfo = getOAuthUserInfo()

const toRecovering = () => {
  router.replace({
    path: '/recovery/result',
    query: { address: oauthUserInfo?.unipass_info?.address },
  })
}
</script>

<style lang="scss">
#page-password-login {
  .account-recovering {
    margin-top: 20px;
    height: 88px;
    background: var(--up-app-background);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    .left {
      text-align: left;
      display: flex;
      flex-direction: column;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #97989d;
      span:nth-child(1) {
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
        color: var(--up-text-primary);
      }
    }
    .right {
      width: 64px;
      height: 32px;
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      border-radius: 6px;
    }
  }

  h2 {
    margin-top: 40px;
  }

  .el-form {
    margin-top: 40px;

    .forgot-password {
      margin-top: 8px;
      text-align: left;
      line-height: 24px;
    }
  }

  .submit {
    margin-top: 40px;
  }
}
</style>
