<template>
  <div class="up-header">
    <div class="left">
      <img class="unipass-logo" src="@/assets/img/logo.png" />
      <up-icon v-if="props.hideBack" name="UniPass" width="96px" height="16px"></up-icon>
      <up-icon
        v-else-if="props.close"
        name="close"
        width="24px"
        height="24px"
        @click="close"
      ></up-icon>
      <up-icon v-else name="back" @click="goBack"></up-icon>
      <div v-if="props.title" class="title">{{ props.title }}</div>
    </div>
    <div class="right">
      <!-- <up-icon
        v-if="!props.title"
        name="more"
        @click="userStore.showHeaderMore = !userStore.showHeaderMore"
      /> -->
      <!-- <div class="one" @click="toggleDark()"> -->
      <div class="one" @click="toggleDark()">
        <div class="left">
          <up-icon name="theme" />
          <div>{{ isDark ? $t('ThemeLight') : $t('ThemeDark') }}</div>
        </div>
        <div class="right">
          <up-icon name="cutover" />
        </div>
      </div>
      <div class="one" @click="changeLanguage">
        <div class="left">
          <up-icon name="english" />
        </div>
        <div class="right">
          <div>{{ $t('LanguageNow') }}</div>
          <up-icon name="jump" />
        </div>
      </div>
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const isDark = useDark()
const i18n = useI18n()
const { t: $t } = useI18n()
let themeColor = isDark.value

const changeLanguage = () => {
  i18n.locale.value = i18n.locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('language', i18n.locale.value)
}

const emit = defineEmits(['toggleTheme'])

// const toggleDark = useToggle(isDark)

const toggleDark = () => {
  useToggle(isDark)()
  themeColor = !themeColor
  emit('toggleTheme', themeColor)
}

interface Props {
  hideBack?: boolean
  back?: () => void
  close?: () => void
  title?: string
}

const props = withDefaults(defineProps<Props>(), { hideBack: false })

const router = useRouter()

const close = () => {
  props?.close?.()
}

const goBack = () => {
  if (props.back) {
    props.back()
  } else {
    router.back()
  }
}
</script>

<style lang="scss">
.up-header {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid #79797f;
  box-shadow: 0px 4px 12px rgba(34, 34, 47, 0.2);
  padding: 0 20px;
  > .left {
    display: flex;
    align-items: center;
    > .unipass-logo {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
    > .iconpark {
      cursor: pointer;
    }
    > .icon-back {
      font-size: 24px;
    }
    > .title {
      margin-left: 12px;
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
    }
  }
  > .right {
    display: flex;
    align-items: center;
    > .icon-more {
      cursor: pointer;
      font-size: 24px;
    }
    > .one {
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      line-height: 60px;
      cursor: pointer;
      user-select: none;

      .iconpark {
        font-size: 24px;
      }
      .left {
        display: flex;
        align-items: center;
        .iconpark {
          margin-right: 6px;
        }
      }
      .right {
        display: flex;
        align-items: center;
        .icon-cutover {
          font-size: 20x;
        }
        .icon-jump {
          margin-left: 6px;
          font-size: 14px;
        }
        .now {
          font-size: 16px;
          font-weight: 400;
          color: var(--up-text-third);
          line-height: 16px;
        }
      }
    }
  }
}
</style>
