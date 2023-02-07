<template>
  <div style="color: white"></div>
  <!-- <up-confirm :title="$t('LoginFailed')" v-model="oauthStore.loginFailed" destroy-on-close>
    <div class="el-dialog__subtitle">
      {{ $t('LoginFailedGuide') }}
    </div>
    <template #footer>
      <up-button type="primary" @click="loginUnipass">
        {{ $t('LoginUnipass') }}
      </up-button>
      <div @click="restore">Restore my wallet</div>
    </template>
  </up-confirm> -->
</template>

<script lang="ts" setup>
// parse url hash from oauth redirect
// import router from '@/plugins/router'
// import { useOAuthLoginStore } from '@/store/oauth_login'
import { parseOAuthHash } from '@/utils/oauth/parse_hash'
// import { useRecovery } from '@/composable/useRecovery'
import { ElLoading } from 'element-plus'
// const { recoveryStore, recovery } = useRecovery()
// const APP_LOCATION = process.env.VUE_APP_LOCATION as string

// const oauthStore = useOAuthLoginStore()

const loading = ElLoading.service({
  lock: true,
  background: 'transparent',
})

// const restore = () => {
//   router.replace('/recovery')
// }
// const loginUnipass = () => {
//   window.location.href = APP_LOCATION
// }

parseOAuthHash(loading)

onBeforeUnmount(() => {
  loading.close()
})
</script>

<style scoped></style>
