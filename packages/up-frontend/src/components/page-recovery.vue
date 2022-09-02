<template>
  <div class="page-recovery">
    <up-header />
    <br />
    <h2>{{ $t('RecoveryTitle') }}</h2>
    <h4>{{ $t('RecoverySubtitle') }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="recoveryStore">
      <el-form-item
        :label="$t('Email')"
        prop="email"
        :rules="[{ validator: unipass.checkEmailFormat, trigger: 'blur' }]"
      >
        <el-input
          ref="emailElement"
          @input="(v) => (recoveryStore.email = unipass.formatEmail(v))"
          @focus="formElement?.clearValidate('email')"
          v-model="recoveryStore.email"
          @keydown.enter="submitEmail"
          clearable
        />
      </el-form-item>
      <br />
      <up-button type="primary" @click="submitEmail">{{ $t('NextStep') }}</up-button>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { useRecovery } from '@/composable/useRecovery'
import { useUniPass } from '@/utils/useUniPass'

const unipass = useUniPass()
const { recoveryStore, submitEmail, formElement, emailElement } = useRecovery()
</script>
