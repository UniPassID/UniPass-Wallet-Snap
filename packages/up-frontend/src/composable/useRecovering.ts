import { useChainAccountStore } from '@/store/chain-account'
import dayjs from 'dayjs'
import dayjsDuration from 'dayjs/plugin/duration'
import { isAddress } from 'ethers/lib/utils'
dayjs.extend(dayjsDuration)

export const useRecovering = () => {
  const route = useRoute()
  const address = ref('')
  const countdown = ref('　')
  const isPending = ref(true)

  const chainAccountStore = useChainAccountStore()

  const initCountdown = (unlockTime: dayjs.Dayjs) => {
    const updateTimeFunc = () => {
      let time = unlockTime.valueOf() - Date.now()
      if (time <= 0) {
        time = 0
        clearInterval(n)
      }
      const duration = dayjs.duration(time)
      const hour = Math.floor(duration.asHours()).toString()
      const paddedHour = hour.length > 1 ? hour : `0${hour}`
      countdown.value = paddedHour + duration.format(':mm:ss')
    }
    updateTimeFunc()
    const n = setInterval(updateTimeFunc, 1000)
  }

  onBeforeMount(async () => {
    address.value = (route.query.address as string) || ''

    if (!isAddress(address.value)) return
    await chainAccountStore.fetchAccountInfo(address.value)
    isPending.value = chainAccountStore.isPending

    if (isPending.value) {
      initCountdown(dayjs(chainAccountStore.unlockTime * 1000))
    }
  })
  return {
    isPending,
    initCountdown,
    address,
    countdown,
  }
}
