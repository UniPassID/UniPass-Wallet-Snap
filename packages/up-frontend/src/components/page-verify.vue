<template>
  <div class="page-verify">
    <up-header :back="() => $emit('back')" />
    <br />
    <h2>{{ $t('VerifyTitle') }}</h2>
    <h4>{{ $t('VerifySubtitle', { data: props.email }) }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="form">
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
          @keydown.enter="verifyEmailCode"
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
    <up-button
      type="primary"
      :loading="form.loading"
      :disabled="!form.emailCode"
      @click="verifyEmailCode"
    >
      {{ $t('Submit') }}
    </up-button>
  </div>
</template>

<script lang="ts" setup>
import { useVerifyEmail } from '@/composable/useVerifyEmail'
import { OtpAction } from '@/service/backend'

interface Emits {
  (event: 'token', token: string): void
  (event: 'code', code: string): void
  (event: 'back'): void
}
interface Props {
  action: OtpAction
  email?: string
}

const $emit = defineEmits<Emits>()
const props = defineProps<Props>()

const { form, formElement, fetchEmailCode, verifyEmailCode, checkEmailCode } = useVerifyEmail(
  props.action,
  props.email || '',
  $emit,
)
</script>
