<template>
  <span class="iconfont" :class="`icon-${props.name}`"></span>
</template>

<script setup lang="ts">
interface Props {
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
})
</script>
