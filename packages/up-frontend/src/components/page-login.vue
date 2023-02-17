<template>
  <div class="page-login">
    <!-- <img class="logo" src="@/assets/img/register/logo.svg" /> -->
    <h1>{{ isLogin ? $t('LoginTitle') : $t('RegisterTitle') }}</h1>
    <div class="to-continue-to" v-if="appName">
      {{ $t('ToContinueTo') }} <span>{{ appName }}</span>
    </div>

    <div
      class="oauth-box"
      v-if="oauthStore.connectType === 'google' || oauthStore.connectType === 'both'"
    >
      <div class="one" @click="google">
        <img src="@/assets/img/register/google.svg" />
        <span>{{ isLogin ? $t('LoginWithGoogle') : $t('SignUpWithGoogle') }}</span>
      </div>
      <!-- <div class="one">
        <img src="@/assets/img/register/apple.svg" />
        <span> {{ isLogin ? $t('LoginWithApple') : $t('SignUpWithApple') }}</span>
      </div> -->
    </div>

    <div class="or-box" v-if="oauthStore.connectType === 'both'">
      <div class="line"></div>
      <span>{{ isLogin ? $t('OrEmailLogin') : $t('OrEmailRegister') }}</span>
      <div class="line"></div>
    </div>

    <el-form
      v-if="oauthStore.connectType === 'email' || oauthStore.connectType === 'both'"
      @submit.prevent
      ref="formElement"
      :model="oauthStore"
    >
      <up-form-item
        :label="oauthStore.email && $t('Email')"
        prop="email"
        type="email"
        :rules="[{ validator: unipass.checkEmailFormat, trigger: 'blur' }]"
      >
        <up-input
          ref="emailElement"
          :placeholder="$t('EmailEmpty')"
          @input="(v: string) => (oauthStore.email = unipass.formatEmail(v))"
          @focus="formElement?.clearValidate('email')"
          v-model="oauthStore.email"
          clearable
          @keydown.enter="oauthStore.email && login()"
          autofocus
        />
      </up-form-item>
    </el-form>

    <up-button
      v-if="oauthStore.connectType === 'email' || oauthStore.connectType === 'both'"
      class="submit"
      type="primary"
      @click="submit"
      :loading="oauthStore.auth0EmailLoading"
    >
      {{ isLogin ? $t('Login') : $t('Continue') }}
    </up-button>

    <div class="other">
      {{ isLogin ? $t('NoAccount') : $t('HaveAccount') }}
      <router-link replace :to="isLogin ? '/register' : '/login'" class="underline">
        {{ isLogin ? $t('ToSignUp') : $t('Login') }}
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FormInstance } from 'element-plus'
import { useOAuthLoginStore } from '@/store/oauth_login'
import { upGA, useUniPass } from '@/utils/useUniPass'

const formElement = ref<FormInstance>()
const emailElement = ref()
const route = useRoute()

const unipass = useUniPass()
const oauthStore = useOAuthLoginStore()

const isLogin = computed(() => {
  return route.path === '/login'
})

const submit = () => {
  if (isLogin.value) {
    login()
  } else {
    register()
  }
}
const google = () => {
  if (isLogin.value) {
    upGA('login_click_google')
  } else {
    upGA('register_click_google')
  }
  oauthStore.loginWithGoogle()
}

const login = () => {
  if (!oauthStore.email) {
    emailElement.value?.element?.focus()
    return
  }
  if (!formElement.value) return
  formElement.value.validate(async (ok) => {
    if (ok) {
      upGA('login_click_continue', { email: oauthStore.email }, 1)
      await oauthStore.auth0Login()
    }
  })
}

const register = () => {
  if (!oauthStore.email) {
    emailElement.value?.element?.focus()
    return
  }
  if (!formElement.value) return
  formElement.value.validate((ok) => {
    if (ok) {
      upGA('register_click_continue', { email: oauthStore.email }, 1)
      oauthStore.auth0Login()
    }
  })
}

const appName = computed(() => sessionStorage.appName)
</script>

<style lang="scss">
.page-login {
  width: 480px;
  padding-bottom: 60px;
  display: flex;
  flex: 1;
  justify-content: center;
  flex-direction: column;

  .logo {
    margin-top: 60px;
    width: 80px;
    height: 80px;
  }

  h1 {
    margin-top: 24px;
    font-weight: 700;
    font-size: 24px;
    line-height: 36px;
  }

  .to-continue-to {
    margin-top: 4px;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: var(--up-text-primary);

    span {
      color: var(--up-primary);
      font-weight: 600;
    }
  }

  .oauth-box {
    margin-top: 40px;
    width: 100%;

    .one {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      background-color: var(--up-bg-checked);
      border-radius: 12px;
      transition: all 0.15s;
      box-shadow: inset 1px 1px 3px var(--up-line);

      &:hover {
        background-color: #eee;
      }

      & + .one {
        margin-top: 20px;
      }

      span {
        margin-left: 10px;
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
      }
    }
  }

  .or-box {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    align-items: center;

    .line {
      width: 50px;
      height: 1px;
      background-color: var(--up-text-third);
    }

    span {
      margin: 0 10px;
      font-size: 12px;
      font-weight: 400;
    }
  }

  .el-form {
    width: 100%;
    margin-top: 28px;
  }

  .submit {
    margin-top: 28px;
  }

  .other {
    margin-top: 16px;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: var(--up-text-secondary);
  }
}
html.dark {
  .page-login .oauth-box .one:hover {
    background-color: #616268;
  }
}
</style>
