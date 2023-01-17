<template>
  <page-recovery-guardian v-if="recoveryStore.step === 2" @back="guardianPageBack" />
  <page-recovery-password v-else />
</template>

<script lang="ts" setup>
import { useRecoveryStore } from '@/store/recovery'

const recoveryStore = useRecoveryStore()

const guardianPageBack = () => {
  // clear password
  recoveryStore.password = ''
  recoveryStore.confirmPassword = ''
  recoveryStore.step = 1
}
</script>
