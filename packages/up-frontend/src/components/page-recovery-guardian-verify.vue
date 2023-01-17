<template>
  <div id="page-recovery-guardian-verify">
    <up-header :back="() => $emit('back')" />
    <h2>{{ $t('SecurityVerification') }}</h2>
    <h4>{{ $t('VerifySubtitle') }}</h4>
    <div class="two-step">
      <div
        class="one google"
        v-if="twoStep.google"
        :class="{ active: twoStep.active === 'google' }"
        @click="twoStep.active = 'google'"
      >
        <up-icon :name="`google-${isDark ? 'dark' : 'light'}`" />
        <span>{{ $t('GoogleVerify') }}</span>
        <div class="dot"></div>
      </div>
      <div
        class="one phone"
        v-if="twoStep.phone"
        :class="{ active: twoStep.active === 'phone' }"
        @click="twoStep.active = 'phone'"
      >
        <up-icon :name="`phone-${isDark ? 'dark' : 'light'}`" />
        <span>{{ $t('PhoneVerify') }}</span>
        <div class="dot"></div>
      </div>
    </div>
    <div class="up-puzzle">
      <el-form @submit.prevent>
        <div v-show="twoStep.active === 'google'">
          <div class="key">
            <img src="@/assets/img/login/key-google.svg" />
            <div class="info">
              <h3>{{ $t('GoogleVerify') }}</h3>
              <h4>{{ $t('EnterGoogleCode') }}</h4>
            </div>
          </div>
          <up-form-item :label="google.form.code && $t('GoogleCode')">
            <up-input
              :placeholder="$t('EnterGoogleCode')"
              v-model="google.form.code"
              :disabled="loading"
              @keydown.enter="google.form.code && google.verify()"
              type="tel"
              maxlength="6"
              @input="(v: string) => (google.form.code = v.replaceAll(/\D/g, ''))"
              clearable
            >
            </up-input>
          </up-form-item>
        </div>
        <div v-show="twoStep.active === 'phone'">
          <div class="key">
            <img src="@/assets/img/login/key-phone.svg" />
            <div class="info">
              <h3>{{ $t('PhoneVerify') }}</h3>
              <h4>
                {{ $t('CodeWillBeSentTo') }}<br />
                {{ twoStep.phone }}
              </h4>
            </div>
          </div>
          <up-form-item :label="phone.form.code && $t('PhoneCode')">
            <up-input
              :placeholder="$t('EnterPhoneCode')"
              v-model="phone.form.code"
              :disabled="loading"
              @keydown.enter="phone.form.code && submit()"
              type="tel"
              maxlength="6"
              @input="(v: string) => (phone.form.code = v.replaceAll(/\D/g, ''))"
            >
              <template #suffix>
                <el-button
                  class="send-code"
                  :loading="phone.form.phoneCodeLoading"
                  :disabled="phone.form.count > 0 || phone.form.loading"
                  link
                  @click="phone.fetch"
                >
                  <template v-if="phone.form.count > 0"> {{ phone.form.count }}s </template>
                  <template v-else>{{ $t('FetchEmailCode') }}</template>
                </el-button>
              </template>
            </up-input>
          </up-form-item>
        </div>
      </el-form>
    </div>
    <up-button
      class="submit"
      type="primary"
      :loading="loading"
      :disabled="disabled"
      @click="submit"
    >
      {{ $t('Submit') }}
    </up-button>
  </div>
</template>

<script lang="ts" setup>
import { useRecoveryGuardianVerify } from '@/composable/useRecovery'
import { AuthType } from '@/service/backend'

export interface Emits {
  (event: 'back'): void
  (event: 'token', token: string, type: AuthType): void
}

const $emit = defineEmits<Emits>()

const { isDark, loading, disabled, submit, twoStep, google, phone } =
  useRecoveryGuardianVerify($emit)
</script>

<style lang="scss">
#page-recovery-guardian-verify {
  .two-step {
    margin-top: 40px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    .one {
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      & + .one {
        margin-left: 4px;
      }
      .iconpark {
        opacity: 0.6;
        font-size: 40px;
      }
      span {
        opacity: 0.6;
        margin-top: 8px;
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
      }
      .dot {
        margin-top: 16px;
        width: 24px;
        height: 3px;
        background: transparent;
        border-radius: 4px;
      }
      &.active {
        .iconpark {
          opacity: 1;
        }

        span {
          opacity: 1;
        }
        .dot {
          background: #8864ff;
        }
      }
    }
  }
  .up-puzzle {
    margin-top: 0;
  }
  .submit {
    margin-top: 40px;
  }
}
</style>
