<template>
  <div style="color: white"></div>
</template>

<script lang="ts" setup>
// parse url hash from oauth redirect
import { parseOAuthHash } from '@/utils/oauth/parse_hash'
import { ElLoading } from 'element-plus'

const loading = ElLoading.service({
  lock: true,
  background: 'transparent',
})

parseOAuthHash(loading)

onBeforeUnmount(() => {
  loading.close()
})
</script>

<style scoped></style>
