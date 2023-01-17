<template>
  <div id="page-register-password">
    <up-header :back="back" />
    <h2>{{ $t('RegisterTitle') }}</h2>
    <h4>{{ $t('RegisterPasswordSubtitle') }}</h4>

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
          @keydown.enter="oauthStore.password && oauthStore.confirmPassword && signUp()"
          :disabled="loading"
          clearable
        />
      </up-form-item>
      <up-form-item
        :label="oauthStore.confirmPassword && $t('ConfirmPassword')"
        prop="confirmPassword"
        type="password"
        :rules="[{ validator: checkConfirmPassword, trigger: 'blur' }]"
      >
        <up-input
          :placeholder="$t('PleaseConfirmPassword')"
          v-model="oauthStore.confirmPassword"
          @focus="formElement?.clearValidate('confirmPassword')"
          show-password
          @keydown.enter="oauthStore.password && oauthStore.confirmPassword && signUp()"
          :disabled="loading"
          clearable
        />
      </up-form-item>
      <up-button
        class="submit"
        type="primary"
        @click="signUp"
        :loading="loading"
        :disabled="!(oauthStore.confirmPassword && oauthStore.password)"
      >
        {{ $t('CreateAccountButton') }}
      </up-button>
      <div class="terms">
        {{ $t('ByCreating') }}
        <br />
        <a
          class="underline"
          target="_blank"
          href="https://lay2.notion.site/Terms-of-Service-83e8822541874c899a9f963e699266ec"
          >{{ $t('TermsService') }}</a
        >
        {{ $t('And') }}
        <a
          class="underline"
          target="_blank"
          href="https://lay2.notion.site/Privacy-Policy-213acbb03cb540f3934141a8472723c0"
          >{{ $t('PrivacyPolicy') }}</a
        >
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useOAuth } from '@/composable/useOAuth'
import router from '@/plugins/router'

const { unipass, oauthStore, checkConfirmPassword, signUp, formElement, loading } = useOAuth()
const back = () => router.replace('/login')
</script>

<style lang="scss">
#page-register-password {
  .el-form {
    margin-top: 40px;
    .el-form-item + .el-form-item {
      margin-top: 20px;
    }
    .terms {
      margin-top: 16px;
      color: var(--up-text-third);
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
    }
  }
  .submit {
    margin-top: 40px;
  }
}
</style>
