import { upError } from './../utils/useUniPass'
import { BigNumber, utils } from 'ethers'
import { SignClientTypes } from '@walletconnect/types'
import router from '@/plugins/router'
import { SignMessageType, useSignStore } from '@/store/sign'
import { getAuthNodeChain, getChainNameByChainId, getSupportedChainIds } from './chains-config'
import { useUserStore } from '@/store/user'
import api, { SyncStatusEnum } from './backend'
import { ChainType } from '@unipasswallet/provider'
import { ElMessageBox } from 'element-plus'
import i18n from '@/plugins/i18n'

// eg: eip155:137
export const isSupportedEip155Chain = (chain: string) => {
  const chainId = chain.split(':')[1]

  return !!getSupportedChainIds().some((id) => `${id}` === chainId)
}

const isAccountSyncedOnChain = async (chain: ChainType) => {
  if (chain === 'polygon') return true
  const { t: $t } = i18n.global
  const userStore = useUserStore()
  const signStore = useSignStore()
  try {
    const {
      data: { syncStatus },
    } = await api.getSyncStatus({
      email: userStore.accountInfo.email,
      authChainNode: getAuthNodeChain(chain),
    })
    if (syncStatus !== SyncStatusEnum.Synced) {
      const tip = syncStatus === SyncStatusEnum.NotSynced ? $t('SyncTip') : $t('DeployTip')
      ElMessageBox.alert(tip, $t('Notification'), {
        confirmButtonText: $t('Confirm'),
        center: true,
      })
        .then(() => {
          signStore.fromWalletConnectSign = true
          signStore.initTransactionData(
            { chain },
            {
              from: userStore.accountInfo.address,
              to: userStore.accountInfo.address,
              value: '0x',
              data: '0x',
            },
          )
          router.push('/async-account')
        })
        .catch()
      return false
    }
    return true
  } catch (err) {
    upError('failed to fetch account status')
    return false
  }
}

export async function handleWalletConnectPersonalSign(
  requestEvent: SignClientTypes.EventArguments['session_request'],
) {
  const { params, id, topic } = requestEvent
  const { chainId, request } = params
  const signStore = useSignStore()
  const userStore = useUserStore()
  signStore.signMassage.type = SignMessageType.v1
  signStore.signMassage.msg = getSignParamsMessage(request.params)
  signStore.signMassage.referrer = 'PersonalSign'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  userStore.initAppSetting({ chain: getChainNameByChainId(chainId.split(':')[1]) })
  signStore.walletConnectId = id
  signStore.walletConnectTopic = topic

  const isAccountSynced = await isAccountSyncedOnChain(userStore.chain as ChainType)
  if (!isAccountSynced) return

  router.push('/sign-message')
}

export async function handleWalletConnectPersonalSignV1(data: {
  id: number
  params: string[]
  chainId: number
  hostUrl: string
  icon: string
}) {
  const signStore = useSignStore()
  const userStore = useUserStore()
  signStore.signMassage.type = SignMessageType.v1
  signStore.signMassage.msg = getSignParamsMessage(data.params)
  signStore.signMassage.referrer = data.hostUrl
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  userStore.initAppSetting({ chain: getChainNameByChainId(data.chainId), appIcon: data.icon })
  signStore.walletConnectId = data.id
  signStore.walletConnectTopic = 'handleWalletConnectPersonalSignV1'
  const isAccountSynced = await isAccountSyncedOnChain(userStore.chain as ChainType)
  if (!isAccountSynced) return
  router.push('/sign-message')
}

export function handleWalletConnectSignTypedData(
  requestEvent: SignClientTypes.EventArguments['session_request'],
) {
  const { params, id, topic } = requestEvent
  const { chainId, request } = params

  const signStore = useSignStore()
  const userStore = useUserStore()
  signStore.signMassage.type = SignMessageType.v4
  signStore.signMassage.typedData = getSignTypedDataParamsData(request.params)
  signStore.signMassage.referrer = 'SignTypedData'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  userStore.initAppSetting({ chain: getChainNameByChainId(chainId.split(':')[1]) })
  signStore.walletConnectId = id
  signStore.walletConnectTopic = topic

  router.push('/sign-message')
}

export async function handleWalletConnectSignTypedDataV1(data: {
  id: number
  params: string[]
  chainId: number
  hostUrl: string
  icon: string
}) {
  const signStore = useSignStore()
  const userStore = useUserStore()
  signStore.signMassage.type = SignMessageType.v4
  signStore.signMassage.typedData = getSignTypedDataParamsData(data.params)
  signStore.signMassage.referrer = data.hostUrl
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  userStore.initAppSetting({ chain: getChainNameByChainId(data.chainId), appIcon: data.icon })
  signStore.walletConnectId = data.id
  signStore.walletConnectTopic = 'handleWalletConnectSignTypedDataV1'
  const isAccountSynced = await isAccountSyncedOnChain(userStore.chain as ChainType)
  if (!isAccountSynced) return
  router.push('/sign-message')
}

export async function handleWalletConnectSendTransaction(
  requestEvent: SignClientTypes.EventArguments['session_request'],
) {
  const { params, id, topic } = requestEvent
  const { chainId, request } = params
  if (request.params && request.params[0]) {
    const { from, to, value, data } = request.params[0]
    const signStore = useSignStore()
    signStore.walletConnectId = id
    signStore.walletConnectTopic = topic
    signStore.initTransactionData(
      { chain: getChainNameByChainId(chainId.split(':')[1]) },
      {
        from,
        to,
        value,
        data,
      },
    )
    //   await updateGasFee()
    console.log(`topic: ${topic}`)
    console.log(`id: ${id}`)

    router.push('/send-transaction')
  }
}

export async function handleWalletConnectSendTransactionV1(payload: {
  id: number
  params: any[]
  chainId: number
  hostUrl: string
  icon: string
}) {
  if (payload.params[0]) {
    const chainId = payload.chainId
    const { from, to, value, data } = payload.params[0]
    const signStore = useSignStore()
    const userStore = useUserStore()
    userStore.initAppSetting({ appIcon: payload.icon })
    signStore.signMassage.referrer = payload.hostUrl
    signStore.walletConnectId = payload.id
    signStore.walletConnectTopic = 'handleWalletConnectSendTransactionV1'
    await signStore.initTransactionData(
      { chain: getChainNameByChainId(chainId) },
      {
        from,
        to,
        value,
        data,
      },
    )

    router.push('/send-transaction')
  }
}

/**
 * Gets message from various signing request methods by filtering out
 * a value that is not an address (thus is a message).
 * If it is a hex string, it gets converted to utf8 string
 */
export function getSignParamsMessage(params: string[]) {
  const message = params.filter((p) => !utils.isAddress(p))[0]

  return convertHexToUtf8(message)
}

/**
 * Gets data from various signTypedData request methods by filtering out
 * a value that is not an address (thus is data).
 * If data is a string convert it to object
 */
export function getSignTypedDataParamsData(params: string[]) {
  const data = params.filter((p) => !utils.isAddress(p))[0]

  if (typeof data === 'string') {
    return JSON.parse(data)
  }

  return data
}

/**
 * Converts hex to utf8 string if it is valid bytes
 */
export function convertHexToUtf8(value: string) {
  if (utils.isHexString(value)) {
    return utils.toUtf8String(value)
  }

  return value
}
