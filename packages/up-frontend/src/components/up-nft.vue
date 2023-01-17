<template>
  <div class="up-nft">
    <div class="img-box">
      <el-image :src="props.src" />
    </div>
    <div class="name">
      {{ props.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  name: string
  src: string
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  src: '',
})
</script>

<style lang="scss">
.up-nft {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;

  .img-box {
    width: 40px;
    height: 40px;
    padding: 5px;
    background: #ffffff;
    border-radius: 6px;
    margin-right: 12px;
  }
}
</style>
