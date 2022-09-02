<template>
  <div class="page-recovery-password">
    <up-header :back="() => $emit('back')" />
    <br />
    <h2>{{ $t('RecoveryPasswordTitle') }}</h2>
    <h4>{{ $t('RecoveryPasswordSubtitle') }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="recoveryStore">
      <el-form-item
        :label="$t('Password')"
        prop="password"
        :rules="[{ validator: unipass.checkPassword, trigger: 'blur' }]"
      >
        <el-input
          @input="(v) => (recoveryStore.password = unipass.formatPassword(v))"
          v-model="recoveryStore.password"
          @keydown.enter="submitPassword"
          @focus="formElement?.clearValidate('password')"
          show-password
          :disabled="recoveryStore.loading"
        />
      </el-form-item>
      <el-form-item
        :label="$t('ConfirmPassword')"
        prop="confirmPassword"
        :rules="[{ validator: checkConfirmPassword, trigger: 'blur' }]"
      >
        <el-input
          v-model="recoveryStore.confirmPassword"
          @keydown.enter="submitPassword"
          @focus="formElement?.clearValidate('confirmPassword')"
          show-password
          :disabled="recoveryStore.loading"
        />
      </el-form-item>
    </el-form>
    <br />
    <up-button type="primary" :loading="recoveryStore.loading" @click="submitPassword">
      {{ $t('NextStep') }}
    </up-button>
  </div>
</template>

<script lang="ts" setup>
import { useRecovery } from '@/composable/useRecovery'
import { useUniPass } from '@/utils/useUniPass'

const unipass = useUniPass()
const { recoveryStore, formElement, submitPassword, checkConfirmPassword } = useRecovery()
</script>
