import { useUserStore } from '@/store/user'
import QRCode from 'qrcode'
import dayjs from 'dayjs'
import { useRecoveryStore } from '@/store/recovery'
import { useUniPass } from '@/utils/useUniPass'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { useChainAccountStore } from '@/store/chain-account'
import router from '@/plugins/router'

export const useIndex = () => {
  const unipass = useUniPass()
  const showReceive = ref(false)
  const userStore = useUserStore()
  const recoveryStore = useRecoveryStore()
  const chainAccountStore = useChainAccountStore()
  const addressQRCode = ref('')
  const recovering = reactive({
    loading: false,
  })

  const netWorth = computed(() => {
    const totalWorth = userStore.coins
      .map((x) => {
        if (x.balance === '-') {
          return BigNumber.from(0)
        }
        const value = parseUnits(x.balance, 18)
          .div(10 ** 12)
          .mul(parseUnits(x.price && x.price !== -1 ? x.price.toString() : '0', 18).div(10 ** 12))
        return value
      })
      .reduce((a, b) => a.add(b))
    return Number(formatUnits(totalWorth, 12)).toFixed(2)
  })

  const sendCoin = (i: number) => {
    const coin = userStore.coins[i]
    router.push({
      path: '/send',
      query: {
        symbol: coin.symbol,
        chain: coin.chain,
      },
    })
  }

  const auth = reactive({
    show: false,
    password: '',
  })

  let polling: NodeJS.Timer | undefined
  const cancelRecovery = async () => {
    recovering.loading = true

    try {
      const ok = await recoveryStore.sendCancelRecovery()
      if (ok) {
        const date = dayjs().add(2, 'minute')
        polling = setInterval(async () => {
          await chainAccountStore.fetchAccountInfo(
            userStore.accountInfo.address,
            true,
            userStore.accountInfo.keyset.hash,
          )
          if (!chainAccountStore.isPending) {
            clearInterval(polling)
            unipass.success('Cancel recovery success')
            recovering.loading = false
            auth.show = false
          }
          // timeout
          if (date.isBefore(dayjs())) {
            clearInterval(polling)
            console.error('Cancel recovery timeout')
            recovering.loading = false
            auth.show = false
            // todo timeout
          }
        }, 4000)
      }
    } catch (error: any) {
      recovering.loading = false
      unipass.error(error?.message || 'unknown error')
    }
  }

  const initQRCode = (block: string) => {
    // https://www.npmjs.com/package/qrcode#example-1
    QRCode.toDataURL(block, {
      type: 'image/png',
      width: 160,
      margin: 0,
      // errorCorrectionLevel: 'L',
      color: {
        dark: '#000000',
        light: '#FFFFFF00',
      },
    }).then((data) => {
      addressQRCode.value = data
    })
  }

  const inited = computed(() => {
    const user = userStore.accountInfo
    if (!user.address) {
      return false
    }
    initQRCode(user.address)
    userStore.fetchBalances()
    return true
  })

  return {
    netWorth,
    recovering,
    cancelRecovery,
    addressQRCode,
    showReceive,
    sendCoin,
    userStore,
    auth,
    inited,
  }
}
