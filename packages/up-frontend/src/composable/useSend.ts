import relayerApi, { AssetTransactionInput } from '@/service/relayer'
import { initRelayerAssetsReqData } from '@/service/relayer.tx'
import { BalanceInfo, useUserStore } from '@/store/user'
import { FormInstance } from 'element-plus'
import blockchain from '@/service/blockchain'
import dayjs from 'dayjs'
import { SnapsWallet } from '@/service/SnapsWallet'

type IconType = 'success' | 'warning' | 'info' | 'error' | ''

export const useSend = () => {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const loading = ref(false)
  const loadingAuthorize = ref(false)
  const form = reactive({
    fee: undefined as undefined | BalanceInfo,
    feeSymbol: '',
    toAddress: '',
    toAmount: '',
    coin: userStore.coins[0],
    coins: userStore.coins,
    req: undefined as undefined | AssetTransactionInput,
    rawData: '',
  })
  const formElement = ref<FormInstance>()
  const disabled = computed(() => {
    if (form.toAmount && form.toAddress && form.feeSymbol) {
      return false
    } else {
      return true
    }
  })

  const bindFeeChange = (val: string | number | boolean) => {
    const fee = userStore.coins.find((e) => e.symbol === val)
    form.fee = fee
  }

  const confirmSendTransaction = () => {
    if (!formElement.value) {
      return
    }
    loading.value = true
    formElement.value.validate(async (ok: boolean) => {
      if (!ok) {
        loading.value = false
        return
      }
      drawer.show = true
    })
  }

  const getTxRawData = async () => {
    const fee = userStore.coins.find((e) => e.symbol === form.feeSymbol)
    if (!fee) {
      return
    }
    if (userStore.user) {
      const { keyset, account } = userStore.user
      const { recoveryEmails } = keyset
      const req = await initRelayerAssetsReqData({
        feeToken: fee.contractAddress,
        feeAmount: fee.gasFee,
        feeDecimals: fee.decimals,
        feeReceiver: process.env.VUE_APP_FeeReceiver as string,
        tokenDecimals: form.coin.decimals,
        accountAddress: account,
        threshold: recoveryEmails.threshold,
        recoveryEmails: recoveryEmails.emails,
        masterKey: new SnapsWallet(account, keyset.cloudKeyAddress),
        toAddress: form.toAddress,
        toAmount: form.toAmount,
        contractAddress: form.coin.contractAddress,
      })
      form.rawData = JSON.stringify(req, null, 4)
      form.req = req
    }
  }

  const drawer = reactive({
    show: false,
    size: '398px',
    viewData: false,
  })
  const sendTransaction = async () => {
    await getTxRawData()

    if (form.req) {
      loadingAuthorize.value = true
      const res = await relayerApi.asset(form.req)
      loadingAuthorize.value = false
      if (res.ok) {
        const { transactionHash } = res.data
        router.replace({
          path: '/send/loading',
          query: {
            hash: transactionHash,
          },
        })
      }
    }
  }
  const bindViewData = () => {
    drawer.viewData = !drawer.viewData
    if (drawer.viewData) {
      drawer.size = '666px'
    } else {
      drawer.size = '398px'
    }
  }
  const checkAmount = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const amount = Number(v)
    if (Number.isNaN(amount)) {
      return callback(new Error('Invalid input'))
    }
    if (amount > Number(form.coin.balance)) {
      return callback(new Error('Invalid input'))
    }
    callback()
  }
  const init = () => {
    const coins = []
    const coinsDisabled = []
    for (const coin of userStore.coins) {
      if (coin.symbol === route.query.symbol) {
        form.coin = coin
        if (Number(coin.balance) > Number(coin.gasFee)) {
          form.feeSymbol = coin.symbol
          bindFeeChange(coin.symbol)
        }
      }
      if (Number(coin.balance) > Number(coin.gasFee)) {
        coins.push(coin)
        if (!form.feeSymbol) {
          form.feeSymbol = coin.symbol
          bindFeeChange(coin.symbol)
        }
      } else {
        coinsDisabled.push(coin)
      }
    }
    form.coins = coins.concat(coinsDisabled)
  }
  init()

  return {
    disabled,
    loading,
    loadingAuthorize,
    confirmSendTransaction,
    sendTransaction,
    bindViewData,
    checkAmount,
    formElement,
    form,
    bindFeeChange,
    drawer,
  }
}

export const useSendLoading = () => {
  const route = useRoute()
  const hash = (route.query.hash as string) || ''
  const icon = ref<IconType>('')
  const title = ref('')

  let polling: NodeJS.Timer | undefined
  onBeforeMount(async () => {
    const date = dayjs().add(2, 'minute')
    polling = setInterval(async () => {
      const res = await blockchain.getTransactionReceipt(hash)
      if (res) {
        clearInterval(polling)
        if (res.status === 1) {
          icon.value = 'success'
          title.value = 'Send Successfully'
        } else {
          icon.value = 'error'
          title.value = 'Send Failed'
        }
      }
      // timeout
      if (date.isBefore(dayjs())) {
        clearInterval(polling)
        icon.value = 'warning'
        title.value = 'Send Timeout'
      }
    }, 4000)
  })
  onUnmounted(() => {
    clearInterval(polling)
  })
  return {
    icon,
    title,
  }
}
