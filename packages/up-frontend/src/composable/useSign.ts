import { getChainName } from './../service/chains-config'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getOAuthUserInfo } from '@/store/storages'
import { upError, upGA, useUniPass } from '@/utils/useUniPass'
import { useSignStore } from '@/store/sign'
import { etherToWei } from '@/service/format-bignumber'
import { BigNumber, BytesLike, utils } from 'ethers'
import {
  isFlutterEnv,
  isPopupEnv,
  isUnityEnv,
  isUnRealEnv,
  isRedirectEnv,
} from '@/service/check-environment'
import { UPMessage, UPResponse } from '@unipasswallet/popup-types'
import { signTypedDataMessageHash } from '@unipasswallet/popup-utils'
import { ADDRESS_ZERO } from '@/service/constants'
import { postMessage } from '@unipasswallet/popup-utils'
import { SignType, Keyset } from '@unipasswallet/keys'
import { formatUnits, hashMessage, parseUnits } from 'ethers/lib/utils'
import { addSignCapabilityToKeyset } from '@/utils/rbac'
import { BigNumberParser } from '@/utils/BigNumberParser'
import { sdkConfig } from '@/service/chains-config'
import DB from '@/store/index_db'
import api, { SyncStatusEnum } from '@/service/backend'
import { getAuthNodeChain } from '@/service/chains-config'
import { checkStatusForSendTransaction, checkUpSignToken } from '@/utils/oauth/check_up_sign_token'
import { useWalletConnectStore } from '@/store/wallet-connect'
import { getMasterKeyAddress, signMsgWithMM, sendTransactionWithMM } from '@/service/snap-rpc'
import { solidityPack } from 'ethers/lib/utils'
import { WalletsCreator, ChainType } from '@unipasswallet/provider'
import { Wallet } from '@unipasswallet/wallet'

// import { Interface, toUtf8Bytes } from 'ethers/lib/utils'

const { hexlify } = utils

export const useSign = () => {
  const unipass = useUniPass()
  const userStore = useUserStore()
  const walletConnectStore = useWalletConnectStore()
  const { t: $t } = useI18n()
  const isDark = useDark()
  const route = useRoute()
  const router = useRouter()

  const signStore = useSignStore()

  // do not change this func, it is for JS SDK
  const signFunc = async (digestHash: BytesLike, signType: SignType) => {
    const accountInfo = await DB.getAccountInfo()
    if (!accountInfo) {
      router.replace('/login')
      return ''
    }

    const masterKeyAddress = await getMasterKeyAddress(accountInfo.email)
    const sig = await signMsgWithMM(hexlify(digestHash), masterKeyAddress, accountInfo.email)

    const masterKeySig = solidityPack(['bytes', 'uint8'], [sig, signType])

    return masterKeySig
  }

  const sign = async () => {
    signStore.loading = true
    if (!transaction.value) {
      console.error('not found transaction')
      return
    }
    const chain = transaction.value.chain || 'polygon'

    try {
      upGA('sig_click_sign', {
        dapp: walletConnectStore.getDappName(),
        chain: getChainName(chain),
      })
      userStore.upLoading = true

      // 1. check account status
      const {
        data: { syncStatus },
      } = await api.getSyncStatus({
        email: userStore.accountInfo.email,
        authChainNode: getAuthNodeChain(chain),
      })

      if (syncStatus === SyncStatusEnum.NotReceived || syncStatus === SyncStatusEnum.NotSynced) {
        checkStatusForSendTransaction(
          'multiSync',
          JSON.stringify({ ...signStore.$state, loading: false }),
        )
        return
      }

      // 2. check up-sign-token
      const needOAuth = checkUpSignToken()
      if (needOAuth) {
        checkStatusForSendTransaction(
          'upSignToken',
          JSON.stringify({ ...signStore.$state, loading: false }),
        )
        return
      }

      const {
        email,
        keyset: { keysetJson },
        address,
      } = userStore.accountInfo
      const keyset = Keyset.fromJson(keysetJson)

      const gasLimit = feeItems.value.find((x) => x.coin.symbol === signStore.feeSymbol)?.fee
        .gasLimit

      const rpcRes = await sendTransactionWithMM(
        {
          env: sdkConfig.net,
          url_config: sdkConfig.urlConfig,
          oauthUserInfo: getOAuthUserInfo(),
        },
        {
          ...transaction.value,
          keyset,
          gasLimit: BigNumber.from(gasLimit ?? '0'),
        },
        email,
      )

      const { signedTransaction, feeToken } = JSON.parse(rpcRes)
      BigNumberParser(signedTransaction)
      const instance = WalletsCreator.getInstance(keyset, address, {
        env: sdkConfig.net,
        url_config: sdkConfig.urlConfig,
      })
      const wallet = instance[transaction.value.chain as ChainType] as Wallet
      const res = await wallet.sendSignedTransaction(signedTransaction, feeToken)
      const timeout = chain === 'eth' ? 120 : 60
      const receipt = await (res.wait as any)(1, timeout)
      const hash = receipt.transactionHash

      userStore.upLoading = false

      upGA('transaction_success', {
        chain: getChainName(chain),
        hash: `hash_${hashMessage(hash)}`,
        dapp: walletConnectStore.getDappName(),
      })

      if (signStore.fromWalletConnectSign) {
        signStore.fromWalletConnectSign = false
        sessionStorage.removeItem('path')
        router.replace('/sign-message')
        return
      }

      if (!isRedirectEnv()) {
        sessionStorage.removeItem('path')
      }

      // for wallet connect
      if (signStore.walletConnectId != null) {
        await walletConnectStore.walletConnectApprove(
          signStore.walletConnectTopic,
          signStore.walletConnectId,
          hash,
        )
        signStore.walletConnectTopic = ''
        signStore.walletConnectId = undefined
        router.replace('/')
        return
      }

      // popup must put first
      if (isPopupEnv()) {
        postMessage(new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('APPROVE', hash))))
        return
      }

      if (isFlutterEnv()) {
        window.flutter_inappwebview.callHandler(
          'onSendTransactionResponse',
          new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('APPROVE', hash))),
        )
        return
      }

      if (isUnityEnv()) {
        window.vuplex.postMessage(
          JSON.stringify({
            type: 'UP_RESPONSE_TRANSACTION',
            data: hash,
          }),
        )
        return
      }
      if (isUnRealEnv()) {
        window?.ue?.unipass?.onsendtransaction(hash)
        return
      }

      // for third part android sdk
      if (isRedirectEnv()) {
        const response = {
          type: 'UP_TRANSACTION',
          transactionHash: hash,
        }
        const base64Response = utils.base64.encode(utils.toUtf8Bytes(JSON.stringify(response)))
        // awake will fail after long time waiting, need to store redirectUrl and then redirect in /send/result
        sessionStorage.awakeAppUrl = `${decodeURI(
          route.query.redirectUrl as string,
        )}#${base64Response}`
        // awake native app
        location.href = `${decodeURI(route.query.redirectUrl as string)}#${base64Response}`
      }

      router.replace({
        path: '/send/result',
        query: {
          hash: hash,
          chain,
        },
      })
    } catch (error: any) {
      unipass.error(error?.message || 'unknown error')
    } finally {
      userStore.upLoading = false
      signStore.loading = false
    }
  }

  const feeItems = computed(() => {
    // TODO: sort fee options
    const items = []
    if (transaction.value?.chain === 'rangers') return []
    for (const x of signStore.feeOptions) {
      const contractAddress = x.token.contractAddress ?? ADDRESS_ZERO
      const coin = userStore.coins
        .filter((x) => x.chain === signStore.chain)
        .find((x) => x.contractAddress.toLowerCase() === contractAddress.toLowerCase())
      // format amount to decimals
      if (coin) {
        items.push({
          coin,
          fee: {
            ...x,
            amount: formatUnits(BigNumber.from(x.amount), x.token.decimals),
          },
        })
      }
    }
    return items
  })

  const feeChange = (selectedFeeSymbol: string | number | boolean) => {
    for (const card of signStore.cards) {
      // card token is selected fee token
      if (card.type === 'send-token' && card.data.symbol === selectedFeeSymbol) {
        const selectedFeeOption = feeItems.value.find((e) => e.coin?.symbol === selectedFeeSymbol)

        // send amount + fee amount > balance
        const coin = useUserStore().coins.find(
          (e) => e.chain === card.data.chain && e.symbol === card.data.symbol,
        )
        if (
          selectedFeeOption &&
          parseUnits(card.data.amount, coin?.decimals || 18)
            .add(parseUnits(selectedFeeOption.fee.amount, selectedFeeOption.coin?.decimals))
            .gt(
              parseUnits(selectedFeeOption?.coin?.balance || '0', selectedFeeOption.coin?.decimals),
            )
        ) {
          const updatedAmount = utils.formatUnits(
            parseUnits(
              selectedFeeOption?.coin?.balance || '0',
              selectedFeeOption.coin?.decimals,
            ).sub(etherToWei(selectedFeeOption.fee.amount, selectedFeeOption.coin?.decimals)),
            selectedFeeOption.coin?.decimals,
          )

          ElMessageBox.confirm($t('AmountOutOfRange'), $t('Notification'), {
            confirmButtonText: $t('Confirm'),
            cancelButtonText: $t('Cancel'),
            center: true,
            // showClose: false,
          })
            .then(() => {
              card.data.amount = updatedAmount
            })
            .catch(() => {
              signStore.feeSymbol = ''
            })
        }
      }
    }
  }

  const transaction = computed(() => {
    return signStore.getTransaction()
  })

  const updateGasFee = async () => {
    try {
      signStore.gasFeeLoading = true
      await signStore.updateGasFee()
    } catch (e) {
      console.error(e)
      unipass.error($t('GasFeeLoadingFailed'))
    } finally {
      signStore.gasFeeLoading = false
    }
  }

  const signMessage = async (message: string, isEIP191Prefix = false) => {
    const {
      keyset: { keysetJson },
    } = userStore.accountInfo

    try {
      const keyset = addSignCapabilityToKeyset(keysetJson, signFunc)
      const sig = await userStore.unipassWallet.signMessage(message, keyset, isEIP191Prefix)
      return sig
    } catch (e: any) {
      upError(e?.message ? $t(e.message) : 'unknown error')
    } finally {
      signStore.signMassage.loading = false
    }
  }

  const signTypedData = async (data: any) => {
    const {
      keyset: { keysetJson },
    } = userStore.accountInfo

    try {
      const keyset = await addSignCapabilityToKeyset(keysetJson, signFunc)
      const messageHash = signTypedDataMessageHash(data)
      // const messageHash = encodeTypedDataDigest(data)

      const sig = await userStore.unipassWallet.signTypedDataMessage(data, messageHash, keyset)
      return sig
    } catch (e: any) {
      upError(e?.message ? $t(e.message) : 'unknown error')
    } finally {
      signStore.signMassage.loading = false
    }
  }

  return {
    unipass,
    userStore,
    isDark,
    signStore,
    sign,
    feeChange,
    transaction,
    feeItems,
    updateGasFee,
    signMessage,
    signTypedData,
  }
}
