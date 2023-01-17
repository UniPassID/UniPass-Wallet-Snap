<template>
  <up-confirm
    v-model="userStore.showOAuth"
    :title="$t('SecurityVerification')"
    destroy-on-close
    @closed="userStore.showOAuth = false"
    class="dialog-show-oauth"
  >
    <div class="el-dialog__subtitle">{{ $t('SecurityVerify') }}</div>

    <div class="will" v-if="userStore.showTimeSelect">{{ $t('SecurityExpire') }}:</div>
    <el-select
      v-if="userStore.showTimeSelect"
      v-model="userStore.showOAuthHours"
      class="oauth-validity-period"
      popper-class="oauth-validity-period-popper"
      placement="top-start"
    >
      <el-option
        v-for="item in hourList"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <template #footer>
      <up-button type="primary" @click="submit">
        {{ $t('Confirm') }}
      </up-button>
    </template>
  </up-confirm>
</template>

<script lang="ts" setup>
import { LocalStorageService } from '@/store/storages'
import { useUserStore } from '@/store/user'

const { t: $t } = useI18n()

const submit = () => {
  if (!userStore.showTimeSelect) {
    const expire = LocalStorageService.get('UP_SIGN_TOKEN_DURATION') ?? '60'
    LocalStorageService.set('UP_SIGN_TOKEN_DURATION', expire)
  } else {
    LocalStorageService.set('UP_SIGN_TOKEN_DURATION', (userStore.showOAuthHours * 60).toString())
  }

  userStore.showOAuth = false
  userStore.showTimeSelect = true
  userStore.showOAuthCallback()
}

const hourList = computed(() => [
  {
    value: 0,
    label: $t('ExpireZero'),
  },
  {
    value: 1,
    label: $t('ExpireOneHour'),
  },
  {
    value: 4,
    label: $t('ExpireFourHours'),
  },
  {
    value: 12,
    label: $t('ExpireTwelve'),
  },
])

const userStore = useUserStore()
</script>
<style lang="scss">
.el-dialog.up-confirm.dialog-show-oauth {
  .el-dialog__subtitle {
    margin-top: 16px;
    hyphens: auto;
  }
  .subtitle {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;

    color: var(--up-text-secondary);
  }
  .will {
    margin-top: 16px;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;

    color: var(--up-text-secondary);
  }
  .el-select.oauth-validity-period {
    margin-top: 8px;
    .el-input__wrapper {
      background: var(--up-bg);
      border-radius: 12px;
      box-shadow: none;
      height: 60px;
      padding: 0 16px;
    }
  }
}
.el-select__popper.el-popper.oauth-validity-period-popper {
  box-shadow: none;
  background: var(--up-card-bg);
  border-radius: 12px;
  border: 0;
  .el-select-dropdown__wrap {
    max-height: 42vh;
  }
  .el-popper__arrow {
    display: none;
  }
  .el-select-dropdown__item {
    height: 44px;
    line-height: 44px;
    color: var(--up-text-primary);
    &.hover,
    &:hover {
      background-color: var(--up-bg);
    }

    &.selected {
      color: var(--up-primary);
    }
  }
}
</style>
