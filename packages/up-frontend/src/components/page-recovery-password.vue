<template>
  <div id="page-recovery-password">
    <up-header :back="back" />

    <up-confirm
      v-model="sourceFailed"
      :title="$t('LoginFailed')"
      destroy-on-close
      @closed="back()"
      class="dialog-show-oauth"
    >
      <div class="el-dialog__subtitle">
        {{ $t('LoginFailedGuide') }}
      </div>

      <template #footer>
        <up-button type="primary" @click="loginUniPass">
          {{ $t('LoginUniPass') }}
        </up-button>
        <div class="dialog-footer-extension">
          <a class="underline" @click="recovery">
            {{ $t('RestoreWallet') }}
          </a>
        </div>
      </template>
    </up-confirm>
    <up-confirm
      v-model="addressFailed"
      :title="$t('LoginFailed')"
      destroy-on-close
      @closed="back()"
      class="dialog-show-oauth"
    >
      <div class="el-dialog__subtitle">
        {{ $t('AddressNotSameGuide') }}
      </div>

      <template #footer>
        <up-button type="primary" @click="back">
          {{ $t('TryAgain') }}
        </up-button>
        <div class="dialog-footer-extension">
          <a class="underline" @click="recovery">
            {{ $t('LostWallet') }}
          </a>
        </div>
      </template>
    </up-confirm>
  </div>
</template>

<script lang="ts" setup>
import { useRecovery } from '@/composable/useRecovery'
import router from '@/plugins/router'
import { clearStorage } from '@/utils/clear'
const APP_LOCATION = process.env.VUE_APP_LOCATION as string

const route = useRoute()

const addressFailed = ref(route.query.type === 'address')
const sourceFailed = ref(route.query.type === 'source')

const { recovery } = useRecovery()

const loginUniPass = () => {
  window.location.href = APP_LOCATION
}

const back = async () => {
  await clearStorage()
  router.replace('/login')
}
</script>

<style lang="scss">
#page-recovery-password {
  h2 {
    margin-top: 40px;
    font-size: 20px;
  }
  .guide {
    font-size: 14px;
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

  .dialog-footer-extension {
    margin-top: 12px;
  }
}
</style>
