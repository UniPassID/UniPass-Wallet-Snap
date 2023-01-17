<template>
  <div class="buy-coins-card">
    <div class="title" @click="clickAction">
      <img :src="isDark ? data.providerLogoDark : data.providerLogo" alt="logo" />
      <div class="jump" v-if="data.platform">{{ $t('Open') }} ></div>
    </div>
    <div class="card-content-container payment-list">
      <div class="container-title">{{ $t('Payment') }}</div>
      <div class="content">
        <div class="payment-method" v-for="(item, idx) in data.paymentMethodList" :key="idx">
          {{ item }}
        </div>
      </div>
    </div>
    <div class="card-content-container gas-fee">
      <div class="container-title">{{ $t('Fee') }}</div>
      <div class="content">{{ data.gasFee }}</div>
    </div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
import api from '@/service/backend'
import BuyCoinsCardItem from '@/types/buy-coins-card'

const isDark = useDark()

interface Props {
  data: BuyCoinsCardItem
}

const props = defineProps<Props>()

const clickAction = async () => {
  if (props.data?.platform) {
    const data = await api.onRampUrl({ platform: props.data.platform, chain: 'polygon' })
    if (data.ok) {
      window.open(data?.data?.url, '_self')
    }
  }
}
</script>

<style lang="scss">
.buy-coins-card {
  padding-bottom: 20px;
  background: var(--up-bg);
  border-radius: 12px;
  color: var(--up-text-primary);

  & + & {
    margin-top: 20px;
  }

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px dashed var(--up-line);
    cursor: pointer;

    img {
      height: 28px;
      width: auto;
    }

    .jump {
      font-size: 14px;
      line-height: 20px;
      color: var(--up-text-third);
    }
  }

  .card-content-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 0 20px;
    margin-top: 12px;

    .container-title {
      flex-shrink: 0;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      margin-right: 13px;
    }

    .content {
      text-align: right;
      color: var(--up-text-secondary);
      font-size: 12px;
      line-height: 20px;

      .payment-method {
        display: inline-block;
        white-space: nowrap;
        padding: 2px 6px;
        background: var(--up-tag-bg);
        border-radius: 4px;
        font-size: 10px;
        line-height: 16px;
        margin-left: 8px;
        margin-top: 8px;
        color: var(--up-text-primary);
        font-weight: 400;
      }
    }
  }
}
</style>
