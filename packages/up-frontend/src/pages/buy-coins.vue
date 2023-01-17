<template>
  <div id="page-buy-coins" class="page">
    <up-header :title="$t('BuyCoins')" />
    <div class="page-main">
      <div class="tips">{{ $t('BuyCoinsTips') }}</div>
      <div class="card-list">
        <template v-for="(item, idx) in buyCoins">
          <BuyCoinsCard :key="idx" :data="item" v-if="item"></BuyCoinsCard>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BuyCoinsCardItem from '@/types/buy-coins-card'

const buyCoins: BuyCoinsCardItem[] = [
  // {
  //   providerLogo: require('@/assets/img/buy-coins/WhaleFin.png'),
  //   providerLogoDark: require('@/assets/img/buy-coins/WhaleFinDark.png'),
  //   platform: 'whaleFin',
  //   paymentMethodList: ['Credit / Debit Card'],
  //   gasFee: '2.8%-3.75%',
  // },
  {
    providerLogo: require('@/assets/img/buy-coins/FaTPay.png'),
    providerLogoDark: require('@/assets/img/buy-coins/FaTPayDark.png'),
    platform: 'fatPay',
    paymentMethodList: [
      'Credit / Debit Card',
      'Prompt Pay',
      'LINE Pay',
      'MoMo',
      'Zalo Pay',
      'Open Sans',
      'QRIS',
      'PIX',
      'SPEI',
    ],
    gasFee: '2.8%-3.75%',
  },
  {
    providerLogo: require('@/assets/img/buy-coins/AlchemyPay.png'),
    providerLogoDark: require('@/assets/img/buy-coins/AlchemyPayDark.png'),
    platform: 'alchemyPay',
    paymentMethodList: ['Credit / Debit Card', 'Prompt Pay', 'LINE Pay'],
    gasFee: '2.8%-3.75%',
  },
]
</script>

<style lang="scss" scoped>
#page-buy-coins {
  .tips {
    margin-top: 14px;
    font-size: 14px;
    line-height: 20px;
    color: var(--up-text-third);
    text-align: left;
  }

  .card-list {
    margin-top: 27px;
  }
}
</style>
