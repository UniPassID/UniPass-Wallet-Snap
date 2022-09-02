<template>
  <div id="page-register">
    <up-header hide-back />
    <br />
    <h2>{{ $t('RegisterTitle') }}</h2>
    <h4>{{ $t('RegisterSubtitle') }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="form">
      <el-form-item
        prop="email"
        :rules="[{ validator: unipass.checkEmailFormat, trigger: 'blur' }]"
      >
        <template #label>
          <span>{{ $t('Email') }}</span>
          <a type="primary" @click="userStore.showSupportEmail = true">
            {{ $t('SupportedMails') }}
          </a>
        </template>
        <el-input
          ref="emailElement"
          @input="(v) => (form.email = unipass.formatEmail(v))"
          @blur="unipass.formatEmail(form.email, true)"
          @focus="formElement?.clearValidate('email')"
          v-model="form.email"
          @keydown.enter="doRegister"
          clearable
        />
      </el-form-item>
      <el-form-item
        :label="$t('EmailCode')"
        prop="emailCode"
        :rules="[{ validator: checkEmailCode, trigger: 'blur' }]"
      >
        <el-input
          v-model="form.emailCode"
          :disabled="form.loading"
          type="tel"
          maxlength="6"
          @input="(v) => (form.emailCode = v.replaceAll(/\D/g, ''))"
        >
          <template #suffix>
            <el-button
              :loading="form.isEmailCodeLoading"
              :disabled="form.count > 0 || form.loading"
              type="primary"
              link
              @click="fetchEmailCode"
            >
              <template v-if="form.count > 0">
                {{ $t('RefetchEmailCode', { data: form.count }) }}
              </template>
              <template v-else>{{ $t('FetchEmailCode') }}</template>
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <br />
    <br />
    <up-button type="primary" :disabled="!form.emailCode" @click="doRegister">{{
      $t('RegisterWithMM')
    }}</up-button>
    <br />
    <br />
    <router-link to="/login">
      <el-button type="primary" link>{{ $t('RegisteredLogin') }}</el-button>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { useRegister } from '@/composable/useRegister'
import { useUniPass } from '@/utils/useUniPass'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const unipass = useUniPass()

interface Emits {
  (event: 'token', token: string): void
  (event: 'code', code: string): void
  (event: 'back'): void
}

const $emit = defineEmits<Emits>()

const { form, formElement, fetchEmailCode, checkEmailCode, doRegister, emailElement } = useRegister(
  'signUp',
  '',
  $emit,
)
</script>
