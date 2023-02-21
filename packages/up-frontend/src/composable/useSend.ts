import { useUserStore } from '@/store/user'
import { FormInstance } from 'element-plus'
import { useSignStore } from '@/store/sign'
import { ChainType } from '@unipasswallet/provider'
import { isAddress } from 'ethers/lib/utils'
import { convertDomainToAddress } from '@/service/domain-convert'
import { ADDRESS_ZERO } from '@/service/constants'
import { encodeTransactionData } from '@/service/tx-data-analyzer'

type IconType = 'success' | 'warning' | 'info' | 'error' | ''

export const useSend = () => {
  const { t: $t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const signStore = useSignStore()

  const form = reactive({
    toAddress: '',
    toAmount: '',
    toDomain: '',
    coins: userStore.coins,
    convertLoading: false,
  })
  const formElement = ref<FormInstance>()

  watch(form, () => {
    if (!form.toAddress) {
      form.toDomain = ''
    }
  })

  const maxAmount = () => {
    form.toAmount = signStore.coin?.balance ?? ''
    if (!formElement.value) return
    formElement.value.validateField('toAmount')
  }

  const submit = () => {
    if (!formElement.value) return
    formElement.value.validate(async (ok: boolean) => {
      if (ok) {
        const tx = encodeTransactionData({
          amount: form.toAmount,
          address: form.toAddress,
          symbol: signStore.symbol,
          chain: signStore.chain,
        })
        if (!tx) return
        await signStore.initTransactionData({ chain: signStore.chain }, tx)
        signStore.feeSymbol = ''
        router.push('/send/sign')
      }
    })
  }

  const checkAmount = (_rule: any, v: string, callback: (err?: Error) => void) => {
    const amount = Number(v)
    if (isNaN(amount)) {
      return callback(new Error($t('InvalidInput')))
    }
    if (v.split('.')[1]?.length > (signStore.coin?.decimals ?? 18)) {
      return callback(new Error(`Up to ${signStore.coin?.decimals ?? 18} decimal places`))
    }
    if (amount <= 0) {
      return callback(new Error($t('InvalidInput')))
    }
    if (amount > Number(signStore?.coin?.balance ?? '0')) {
      return callback(new Error($t('InsufficientFunds')))
    }
    callback()
  }

  const checkAddress = async (_rule: any, address: string, callback: (err?: Error) => void) => {
    const chainType = signStore.chain

    // ens
    if (address.endsWith('.eth') && (chainType === 'eth' || chainType === 'polygon')) {
      await convertDomain(callback)
      return
    }

    // space id
    if (address.endsWith('.bnb') && chainType === 'bsc') {
      await convertDomain(callback)
      return
    }

    // nns
    if (address.endsWith('.nft')) {
      await convertDomain(callback)
      return
    }

    if (!isAddress(address)) {
      form.toDomain = ''
      return callback(new Error($t('InvalidAddress')))
    }
    callback()
  }

  const convertDomain = async (callback: (err?: Error) => void) => {
    form.convertLoading = true
    const address = await convertDomainToAddress(form.toAddress)
    form.convertLoading = false
    if (address === ADDRESS_ZERO) {
      callback(new Error('Invalid domain'))
      return
    }
    form.toDomain = form.toAddress
    form.toAddress = address
  }

  return {
    checkAmount,
    checkAddress,
    formElement,
    form,
    maxAmount,
    submit,
  }
}

export const useSendLoading = () => {
  const route = useRoute()
  const hash = (route.query.hash as string) || ''
  const chain = (route.query.chain as ChainType) || ''
  const icon = ref<IconType>('success')

  const explorer = computed(() => {
    if (chain === 'polygon') {
      return process.env.VUE_APP_Polygon_Explorer
    } else if (chain === 'bsc') {
      return process.env.VUE_APP_BSC_Explorer
    } else if (chain === 'rangers') {
      return process.env.VUE_APP_Rangers_Explorer
    } else if (chain === 'eth') {
      return process.env.VUE_APP_ETH_Explorer
    } else if (chain === 'scroll') {
      return process.env.VUE_APP_SCROLL_Explorer
    } else if (chain === 'arbitrum') {
      return process.env.VUE_APP_ARBITRUM_Explorer
    }
  })

  return {
    icon,
    explorer,
    hash,
  }
}
