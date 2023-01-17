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
import api from '@/service/backend'
import { useUserStore } from '@/store/user'
import { ElLoading } from 'element-plus'
import { checkAuthorizationExpired } from './utils/oauth/check_authorization'
import { useUniPass } from '@/utils/useUniPass'
import { isRedirectEnv } from '@/service/check-environment'

const unipass = useUniPass()
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

const inited = ref(false)
const init = () => {
  initSuffixes()
  initUser()
  initLanguage()
  initTheme()
}

init()
</script>

<style lang="scss">
.up-banner {
  position: absolute;
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
  min-height: 100vh;
  background: var(--up-app-background);
  display: flex;
  align-items: center;
  justify-content: center;

  > .page {
    width: 100%;
    max-width: 480px;
    min-height: 100vh;
    overflow: hidden;
    padding: 24px;
    text-align: center;
    background-color: var(--up-background);
    // background-image: url('./assets/img/bg-light.svg');
    // background-size: cover;
    position: relative;
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
    padding-top: 60px;
    padding-bottom: 60px;

    > .page {
      min-height: 800px;
      border-radius: 28px;
      padding-left: 40px;
      padding-right: 40px;
    }
  }

  // dark
  html.dark {
    .up-app {
      background: var(--up-app-background);
    }
  }
}
</style>
