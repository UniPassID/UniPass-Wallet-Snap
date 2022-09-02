<template>
  <div class="up-header">
    <div class="left">
      <up-icon v-if="!props.hideBack" name="back" class="back" @click="goBack"></up-icon>
      <slot name="left"></slot>
    </div>
    <div class="right">
      <el-button v-show="false" @click="changeLanguage">
        {{ $t('Language') }}
      </el-button>
      <el-button @click="toggleDark()">{{ isDark ? 'dark' : 'light' }}</el-button>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  hideBack?: boolean
  back?: () => void
}

const props = withDefaults(defineProps<Props>(), { hideBack: false })
const isDark = useDark()
const toggleDark = useToggle(isDark)
const router = useRouter()
const i18n = useI18n()

const goBack = () => {
  if (props.back) {
    props.back()
  } else {
    router.back()
  }
}
const changeLanguage = () => {
  i18n.locale.value = i18n.locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('language', i18n.locale.value)
}
</script>

<style lang="scss">
.up-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  > .left {
    display: flex;
    align-items: center;
    > .back {
      cursor: pointer;
      padding: 8px;
    }
  }
  > .right {
    display: flex;
    align-items: center;
  }
}
</style>
