<template>
  <div class="up-app">
    <div class="up-banner">
      This is the PoC of UniPass Wallet on Polygon, for testing only. Please do not deposit much
      assets here and remember to withdraw them after testing.
    </div>
    <div v-if="gasType === 'unacceptable'" class="under-construction">
      <img src="/img/under-construction.png" alt="under construction" />
    </div>
    <router-view v-else-if="gasType === 'acceptable'" class="page" />
    <dialog-support-email />
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import router from './plugins/router'
import api from './service/backend'
import { useUserStore } from './store/user'

const gasType = ref('acceptable')
// axios
//   .get(
//     'https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=6QQXQ81TGYF8NBGUDK86W17R4UMBBMRPEU',
//   )
//   .then((res) => {
//     if (res.data && res.data.message === 'OK') {
//       const FastGasPrice = Number(res.data.result.FastGasPrice)
//       if (FastGasPrice < 200) {
//         gasType.value = 'acceptable'
//       } else {
//         gasType.value = 'unacceptable'
//       }
//     }
//     if (gasType.value === '') {
//       gasType.value = 'unacceptable'
//     }
//   })
//   .catch(() => {
//     gasType.value = 'unacceptable'
//   })

const init = async () => {
  const res = await api.getSuffixes()
  const userStore = useUserStore()
  if (res.ok) {
    userStore.mailServices = res.data.suffixes
  } else {
    router.push('/404')
  }
}
init()
</script>

<style lang="scss">
.up-app {
  > .under-construction {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    > img {
      pointer-events: none;
      width: 50%;
      max-height: 80%;
      min-width: 360px;
      object-fit: contain;
    }
  }
}
</style>
