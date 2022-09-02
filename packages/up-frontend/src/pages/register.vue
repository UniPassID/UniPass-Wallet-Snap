<template>
  <!-- <page-verify
    v-if="registerStore.step === 2"
    action="signUp"
    :email="registerStore.email"
    @back="back"
    @token="getToken"
  /> -->
  <!-- <page-register-guardians v-else-if="registerStore.step === 3" @back="back" /> -->
  <page-register />
</template>

<script lang="ts" setup>
// import { useRegister } from '@/composable/useRegister'

// const { registerStore, getToken } = useRegister()
// const back = () => {
//   registerStore.password = ''
//   registerStore.confirmPassword = ''
//   registerStore.step = 1
// }
</script>
