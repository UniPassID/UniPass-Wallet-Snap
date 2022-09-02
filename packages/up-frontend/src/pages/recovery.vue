<template>
  <page-verify
    v-if="recoveryStore.step === 2"
    @back="back"
    action="sendRecoveryEmail"
    :email="recoveryStore.email"
    @token="getToken"
  />
  <!-- <page-recovery-password v-else-if="recoveryStore.step === 3" @back="back" /> -->
  <page-recovery-guardian v-else-if="recoveryStore.step === 3" @back="back" />
  <page-recovery v-else />
</template>

<script lang="ts" setup>
import { useRecovery } from '@/composable/useRecovery'

const { recoveryStore, getToken } = useRecovery()
const back = () => {
  recoveryStore.password = ''
  recoveryStore.confirmPassword = ''
  recoveryStore.step = 1
}
</script>
