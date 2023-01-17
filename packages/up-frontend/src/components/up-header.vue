<template>
  <div class="up-header">
    <div class="left">
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
      <up-icon
        v-if="!props.title"
        name="more"
        @click="userStore.showHeaderMore = !userStore.showHeaderMore"
      />
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  // height: 50px;
  > .left {
    display: flex;
    align-items: center;
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
  }
}
</style>
