<template>
  <div class="up-balance">
    <div class="icon-box">
      <img class="icon" :src="require(`@/assets/img/index/chain/${name}.svg`)" :alt="name" />
      <img class="chain" src="@/assets/img/index/chain/Polygon.svg" alt="Polygon" />
    </div>
    <div class="info">
      <div class="title">{{ name }}</div>
      <div class="subtitle" v-if="subtitle !== 'none'">{{ subtitle || subtitleDefault }}</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
const props = defineProps({
  name: {
    type: String,
    default: 'MATIC',
  },
  subtitle: {
    type: String,
    default: '',
  },
})
const subtitleDefault = computed(() => {
  const dict = {
    MATIC: 'MATIC',
    WETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
  }
  return dict[props.name]
})
</script>

<style lang="scss">
.up-balance {
  display: flex;
  align-items: center;
  .icon-box {
    position: relative;
    width: 40px;
    height: 40px;
    margin-right: 12px;
    .icon {
      width: 100%;
      height: 100%;
    }
    .chain {
      position: absolute;
      right: -4px;
      bottom: 0;
      width: 16px;
      height: 16px;
    }
  }
  .info {
    text-align-last: left;
    .title {
      font-size: 16px;
      font-weight: 400;
      line-height: 16px;
    }
    .subtitle {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 400;
      color: #97989d;
      line-height: 12px;
    }
  }
}
</style>
