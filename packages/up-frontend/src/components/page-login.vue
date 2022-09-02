<template>
  <div class="page-login">
    <up-header hide-back />
    <br />
    <h2>{{ $t('LoginTitle') }}</h2>
    <h4>{{ $t('LoginSubtitle') }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="loginStore">
      <div v-if="unlockEmail">{{ unlockEmail }}</div>
      <el-form-item
        v-else
        :label="$t('Email')"
        prop="email"
        :rules="[{ validator: unipass.checkEmailFormat, trigger: 'blur' }]"
      >
        <!-- <el-popover
          v-if="users.length"
          placement="top"
          trigger="click"
          :width="327"
          :show-arrow="false"
        >
          <div class="users">
            <div v-for="user in users" :key="user.email" class="user">{{ user.email }}</div>
          </div>
          <template #reference>
            <el-input
              @input="(v) => (loginStore.email = unipass.formatEmail(v))"
              v-model="loginStore.email"
              clearable
              @keydown.enter="submit"
            />
          </template>
        </el-popover> -->
        <template #label>
          <span>{{ $t('Email') }}</span>
          <router-link to="/recovery" tabindex="-1">{{ $t('Lost Key') }}</router-link>
        </template>
        <el-input
          ref="emailElement"
          @input="(v) => (loginStore.email = unipass.formatEmail(v))"
          @focus="formElement?.clearValidate('email')"
          v-model="loginStore.email"
          clearable
          @keydown.enter="submit"
        />
      </el-form-item>

      <!-- <el-form-item
        prop="password"
        :rules="[{ validator: unipass.checkPassword, trigger: 'blur' }]"
      >
        <template #label>
          <span>{{ $t('Password') }}</span>
          <router-link to="/recovery" tabindex="-1">{{ $t('ForgotPassword') }}</router-link>
        </template>
        <el-input
          @input="(v) => (loginStore.password = unipass.formatPassword(v))"
          v-model="loginStore.password"
          @keydown.enter="submit"
          @focus="formElement?.clearValidate('password')"
          show-password
        />
      </el-form-item> -->
    </el-form>
    <up-button type="primary" :loading="loginStore.loading" @click="submit">
      {{ $t('NextStep') }}
    </up-button>
    <br />
    <br />
    <router-link to="/register">
      <el-button type="primary" link>{{ $t('NoAccountSignUp') }}</el-button>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { useLogin } from '@/composable/useLogin'
import { useUniPass } from '@/utils/useUniPass'
const { loginStore, formElement, emailElement, unlockEmail, submit } = useLogin()
const unipass = useUniPass()
</script>
