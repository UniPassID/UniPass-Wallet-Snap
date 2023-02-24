<template>
  <div id="page-verify-phone" class="header-bg-img">
    <up-header :title="$t('PhoneVerify')" />
    <img
      class="up-illustration"
      :src="require(`@/assets/img/verify/phone${isDark ? '' : '-light'}.png`)"
    />
    <h6>{{ $t('VerifyPhoneTip') }}</h6>
    <el-form @submit.prevent ref="formElement" :model="form">
      <up-form-item class="phone" prop="phone" :label="form.phone && $t('Phone')">
        <up-input
          v-model="form.phone"
          :placeholder="$t('EnterPhone')"
          :disabled="form.loading"
          @keydown.enter="form.phone && form.phoneCode && fetchPhoneCode()"
          type="tel"
          maxlength="11"
          @input="(v: string) => (form.phone = v.replaceAll(/\D/g, ''))"
          clearable
        >
          <template #prefix>
            <el-select
              v-model="form.areaCode"
              filterable
              class="country-code"
              :filter-method="country.filter"
              popper-class="country-code-popper"
            >
              <el-option
                v-for="item in country.list"
                :key="item.en"
                :label="item.phone_code"
                :value="item.phone_code"
              >
                <div class="one">
                  <span class="left">{{ $i18n.locale === 'zh' ? item.cn : item.en }}</span>
                  <span class="right">{{ item.phone_code }}</span>
                </div>
              </el-option>
            </el-select>
          </template>
        </up-input>
      </up-form-item>
      <up-form-item class="code" prop="phoneCode" :label="form.phoneCode && $t('PhoneCode')">
        <up-input
          v-model="form.phoneCode"
          :placeholder="$t('EnterPhoneCode')"
          :disabled="form.loading"
          @keydown.enter="form.phone && form.phoneCode && verifyPhoneCode()"
          type="tel"
          maxlength="6"
          @input="(v: string) => (form.phoneCode = v.replaceAll(/\D/g, ''))"
        >
          <template #suffix>
            <el-button
              class="send-code"
              :loading="form.isPhoneCodeLoading"
              :disabled="form.count > 0 || form.loading || !form.phone"
              link
              @click="fetchPhoneCode"
            >
              <template v-if="form.count > 0"> {{ form.count }}s </template>
              <template v-else>{{ $t('FetchEmailCode') }}</template>
            </el-button>
          </template>
        </up-input>
      </up-form-item>

      <up-button
        class="submit"
        type="primary"
        @click="verifyPhoneCode"
        :disabled="!(form.phone && form.phoneCode)"
        :loading="form.loading"
      >
        {{ $t('Confirm') }}
      </up-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useVerifyPhone } from '@/composable/useVerify'
import CountryCode from '@/utils/country-code'

const isDark = useDark()
const country = reactive({
  filter(v: string) {
    country.list = CountryCode.filter((e) => {
      const en = e.en.toLowerCase()
      const cn = e.cn
      if (v) {
        return cn.includes(v) || en.includes(v) || e.phone_code.includes(v)
      } else {
        return true
      }
    })
  },
  list: CountryCode,
})

const { form, formElement, fetchPhoneCode, verifyPhoneCode } = useVerifyPhone()
</script>

<style lang="scss">
.country-code-popper {
  border: 0;
  background: var(--up-bg);
  box-shadow: inset 0px 0px 3px 0px var(--up-line);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  .one {
    display: flex;
    width: 100%;
    justify-content: space-between;
    .right {
      margin-left: 8px;
    }
  }
  .el-popper__arrow {
    display: none;
  }
}
#page-verify-phone {
  .phone {
    margin-top: 40px;
    > .el-form-item__content {
      > .el-input {
        > .el-input__wrapper {
          padding-left: 100px;
        }
      }
    }
    .country-code {
      width: 100px;
      .el-input__wrapper {
        box-shadow: none !important;
        background: transparent;
      }
    }
  }

  .code {
    margin-top: 24px;
  }

  .submit {
    margin-top: 40px;
  }
}
</style>
