<template>
  <div class="up-dollar">{{ formatDollar }}</div>
</template>

<script lang="ts" setup>
import { parseUnits, formatUnits } from 'ethers/lib/utils'

interface Props {
  amount: string | number
  price: number
}

const props = withDefaults(defineProps<Props>(), { amount: '', price: -1 })

const formatDollar = computed(() => {
  if (props.price === -1) {
    return '~'
  }
  try {
    const amount = parseUnits(props.amount.toString(), 18)
    const price = parseUnits(props.price.toString(), 18)
    return '~$' + Number(formatUnits(amount.div(10 ** 12).mul(price.div(10 ** 12)), 12)).toFixed(2)
  } catch (error) {
    console.log('formatDollar error amount=', props.amount)
    return '~$0.00'
  }
})
</script>
