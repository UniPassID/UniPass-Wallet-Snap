<template>
  <div class="up-banner" v-if="showUpBanner">
    {{ $t('UpBanner') }}
  </div>
  <div class="up-app">
    <div class="up-loading" v-show="userStore.upLoading">
      <img src="/img/loading.gif" />
    </div>

    <router-view v-if="inited" class="page" />
    <dialog-support-email />
    <dialog-header-more />
    <dialog-oauth />
  </div>
</template>

<script lang="ts" setup>
import router from '@/plugins/router'
import { ElMessageBox } from 'element-plus'
import api from '@/service/backend'
import { useUserStore } from '@/store/user'
import { ElLoading } from 'element-plus'
import { checkAuthorizationExpired } from './utils/oauth/check_authorization'
import { useUniPass } from '@/utils/useUniPass'
import { isRedirectEnv } from '@/service/check-environment'
import { isMetamaskSnapsSupported } from '@/service/snap-rpc'

const unipass = useUniPass()
const { t: $t } = useI18n()
const userStore = useUserStore()
let loading: any

const showUpBanner = computed(
  () => process.env.VUE_APP_Net !== 'mainnet' && process.env.VUE_APP_Net !== 'preview',
)

router.beforeEach(async (_, __, next) => {
  loading = ElLoading.service({
    lock: true,
  })
  next()
})

router.afterEach(() => {
  loading?.close()
})

const initSuffixes = async () => {
  const res = await api.getConfig()
  if (res.ok) {
    sessionStorage.mailServices = res.data.suffixes
    sessionStorage.policyKeysetJson = res.data.policyKeysetJson
  } else {
    router.push('/404')
  }
}
const initUser = async () => {
  const { pathname, origin, search } = window.location

  // reset pathname if it's contain '//+' string
  if (/\/{2,}/g.test(pathname)) {
    const _pathname = pathname.replace(/\/{1,}/g, '/')
    console.log(`formatted pathname: ${_pathname}`)
    window.location.href = origin + _pathname + search
    return
  }

  if (pathname.startsWith('/loading') || pathname.startsWith('/wc')) {
    inited.value = true
    return
  }

  for (const path of ['/login', '/register', '/recovery', '/recovery/result', '/404']) {
    if (pathname.startsWith(path)) {
      await userStore.exit()
      inited.value = true
      return
    }
  }
  // sessionStorage.path
  for (const path of ['/connect', '/sign-message', '/send-transaction']) {
    if (pathname.startsWith(path)) {
      sessionStorage.path = pathname
      if (isRedirectEnv()) {
        sessionStorage.redirectUrl = location.href
      }
      inited.value = true
      checkAuthorizationExpired()
      return
    }
  }

  await userStore.init()
  checkAuthorizationExpired()
  inited.value = true
}
const initLanguage = () => {
  const lang = localStorage.getItem('language') ?? 'en'
  unipass.setLanguage(lang)
}
const initTheme = () => {
  const theme = sessionStorage.theme
  if (theme) {
    userStore.initTheme(theme)
  }
}

const environmentCheck = async () => {
  const support = await isMetamaskSnapsSupported()
  if (!support) {
    ElMessageBox.alert($t('SnapGuide'), $t('SnapEnvFailed'), {
      confirmButtonText: $t('InstallSnap'),
      // showClose: false,
    }).then(() => {
      window.location.href = 'https://metamask.io/flask/'
    })
  }
}

const inited = ref(false)
const init = () => {
  environmentCheck()
  initSuffixes()
  initUser()
  initLanguage()
  initTheme()
}

init()
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.main-container {
  position: relative;
  max-width: 1180px;
  padding: 20px;
  width: 100%;
}
.up-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: #fdf0b4;
  color: black;
  font-weight: 600;
  font-size: 14px;
  padding: 4px 8px;
  text-align: center;
}

.up-loading {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;

  img {
    pointer-events: none;
    width: 160px;
  }
}

// app
.up-app {
  background: var(--up-app-background);
  width: 100%;
  display: flex;
  flex: 1;

  > .page {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    text-align: center;
  }

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

// pc
@media screen and (min-width: 480px) {
  // app
  .up-app {
    padding-top: 30px;
  }

  // dark
  html.dark {
    .up-app {
      background: var(--up-app-background);
    }
  }
}
</style>
