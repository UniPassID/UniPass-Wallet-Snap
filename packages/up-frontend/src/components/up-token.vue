<template>
  <div class="up-token" :class="type">
    <div class="token-box">
      <img class="box-icon" v-if="props.icon" :src="props.icon" alt="icon" />
      <up-icon v-else class="box-token" :name="props.name" />
      <up-icon class="box-chain" :name="chainName" />
    </div>
    <div class="index" v-if="props.type === 'index'">
      <div class="index-title">{{ props.name }}</div>
      <div class="index-subtitle">{{ props.subtitle || subtitleDefault }}</div>
    </div>
    <div class="overage" v-else-if="props.balance !== undefined">
      <div class="token-name">{{ props.name }}</div>
      <div class="token-overage">
        {{ $t('Balance') }}：{{ unipass.formatBalance(props.balance) }}
      </div>
    </div>
    <div class="name" v-else>{{ props.name }}</div>
  </div>
</template>

<script lang="ts" setup>
import { getChainName } from '@/service/chains-config'
import { useUniPass } from '@/utils/useUniPass'
import { ChainType } from '@unipasswallet/provider'

interface Props {
  name: string
  chain: ChainType
  balance?: string
  type?: string
  icon?: string
  subtitle?: string
}

const chainName = computed(() => {
  return getChainName(props.chain)
})

const props = withDefaults(defineProps<Props>(), {
  name: '',
  chain: 'polygon',
  balance: undefined,
})

const unipass = useUniPass()

const subtitleDefault = computed(() => {
  const dict = {
    MATIC: 'MATIC',
    WETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
  }
  return dict[props.name] || props.name
})
</script>

<style lang="scss">
.up-token {
  display: flex;
  align-items: center;
  .token-box {
    position: relative;
    height: 40px;
    width: 40px;
    .box-icon {
      width: 100%;
      height: 100%;
    }
    .box-token {
      font-size: 40px;
    }
    .box-chain {
      border-radius: 50%;
      position: absolute;
      right: -6px;
      bottom: 0;
      font-size: 20px;
      border: 1px solid #ffffff;
      background: #ffffff;
    }
  }
  .name {
    margin-left: 18px;
    color: var(--up-text-primary);

    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
  }
  .overage {
    margin-left: 20px;
    .token-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--up-text-primary);
      line-height: 16px;
    }
    .token-overage {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 400;
      color: var(--up-text-third);
      line-height: 12px;
    }
  }
}
.up-token.index {
  .index {
    text-align: left;
    margin-left: 18px;
    .index-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 16px;
    }
    .index-subtitle {
      margin-top: 10px;
      font-size: 14px;
      font-weight: 400;
      color: var(--up-text-third);
      line-height: 14px;
    }
  }
}
</style>
