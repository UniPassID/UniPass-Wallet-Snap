<template>
  <page-login v-if="loginStore.step === 1" />
  <page-verify v-else action="signIn" :email="unlockEmail || loginStore.email" @back="back" />
</template>
<script lang="ts" setup>
import { useLogin } from '@/composable/useLogin'
const { loginStore, unlockEmail } = useLogin()
const back = () => {
  // clear password
  loginStore.password = ''
  loginStore.step = 1
}
</script>
