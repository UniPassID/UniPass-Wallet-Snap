<template>
  <div id="page-recovery-password">
    <up-header :back="back" />
    <up-supported-by />

    <h2>{{ $t('RecoveryPasswordTitle') }}</h2>
    <h4>{{ $t('RecoveryPasswordSubtitle') }}</h4>
    <el-form @submit.prevent ref="formElement" :model="recoveryStore">
      <up-form-item
        :label="recoveryStore.password && $t('Password')"
        prop="password"
        type="password"
        :rules="[{ validator: unipass.checkPassword, trigger: 'blur' }]"
      >
        <up-input
          :placeholder="$t('EnterPassword')"
          @input="(v: string) => (recoveryStore.password = unipass.formatPassword(v))"
          v-model="recoveryStore.password"
          @keydown.enter="recoveryStore.password && submitPassword()"
          @focus="formElement?.clearValidate('password')"
          show-password
          :disabled="recoveryStore.loading"
          clearable
        />
      </up-form-item>
      <up-form-item
        :label="recoveryStore.confirmPassword && $t('ConfirmPassword')"
        prop="confirmPassword"
        type="password"
        :rules="[{ validator: checkConfirmPassword, trigger: 'blur' }]"
      >
        <up-input
          v-model="recoveryStore.confirmPassword"
          @keydown.enter="recoveryStore.password && submitPassword()"
          @focus="formElement?.clearValidate('confirmPassword')"
          show-password
          :disabled="recoveryStore.loading"
          :placeholder="$t('PleaseConfirmPassword')"
          clearable
        />
      </up-form-item>
    </el-form>
    <up-button
      class="submit"
      type="primary"
      :loading="recoveryStore.loading"
      :disabled="!recoveryStore.password"
      @click="submitPassword"
    >
      {{ $t('NextStep') }}
    </up-button>
  </div>
</template>

<script lang="ts" setup>
import { useRecovery } from '@/composable/useRecovery'
import router from '@/plugins/router'
import { clearStorage } from '@/utils/clear'
import { useUniPass } from '@/utils/useUniPass'

const unipass = useUniPass()
const { recoveryStore, formElement, submitPassword, checkConfirmPassword } = useRecovery()

const back = async () => {
  await clearStorage()
  router.replace('/login')
}
</script>

<style lang="scss">
#page-recovery-password {
  h2 {
    margin-top: 40px;
  }
  .el-form {
    margin-top: 40px;
    .el-form-item + .el-form-item {
      margin-top: 20px;
    }
  }
  .submit {
    margin-top: 40px;
  }
}
</style>
