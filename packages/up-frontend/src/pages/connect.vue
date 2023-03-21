<template>
  <div id="page-connect" class="page-sign header-bg-img">
    <div class="main-container">
      <up-header-connect />
      <div class="up-connect main-container">
        <div class="user-from">
          <img src="@/assets/img/index/avatar.svg" />
          <div class="to-box">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="app-icon">
            <el-image :src="userStore.appIcon" style="width: 74px; height: 74px">
              <template #error>
                <div class="image-slot">
                  <img src="@/assets/img/connect/from.svg" />
                </div>
              </template>
            </el-image>
          </div>
        </div>
        <div class="info-box">
          <div class="t1">{{ $t('ConnectTitle') }}</div>
          <div class="t2">{{ userStore.referrer }}</div>
          <div class="t3">{{ $t('ConnectSubtitle') }}</div>
          <div class="line"></div>
          <div class="t4">
            <up-icon name="view" />
            <span>{{ userStore.returnEmail ? $t('ConnectTip1_E') : $t('ConnectTip1') }}</span>
          </div>
          <div class="t4">
            <up-icon name="empty" />
            <span>{{ $t('ConnectTip2') }}</span>
          </div>
          <div class="t4">
            <up-icon name="safe" />
            <span>{{ $t('ConnectTip3') }}</span>
          </div>
        </div>
        <div class="btns">
          <up-button type="info" @click="reject">{{ $t('Cancel') }}</up-button>
          <up-button type="primary" @click="approve" :loading="userStore.connectLoading">{{
            $t('Connect')
          }}</up-button>
        </div>
        <div class="tip" v-if="route.query.type !== 'wallet-connect'">
          {{ $t('ConnectTip4') }}<br />
          <div class="tips">{{ userStore.referrer }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { upGA } from '@/utils/useUniPass'
import { useSDK } from '@/composable/useSDK'
import { useSign } from '@/composable/useSign'
import { SiweMessage } from 'siwe'
import { useWalletConnectStore } from '@/store/wallet-connect'
import { getChainIdByChainType, getChainName } from '@/service/chains-config'
import { isPopupEnv } from '@/service/check-environment'
import { registerPopupHandler, unregisterPopupHandler } from '@unipasswallet/popup-utils'
import { AppSettings, UPAccount, UPMessage, UPResponse } from '@unipasswallet/popup-types'
import { checkUpSignTokenExpiredForConnectPage } from '@/utils/oauth/check_authorization'
import { utils } from 'ethers'
import dayjs from 'dayjs'
import { postMessage } from '@unipasswallet/popup-utils'

const userStore = useUserStore()
const walletConnectStore = useWalletConnectStore()
const { parseSDKFromUrl } = useSDK()
const { signMessage } = useSign()

const route = useRoute()
const router = useRouter()

const initStateForSDK = async (appSetting?: AppSettings) => {
  try {
    userStore.initAppSetting(appSetting)
    await parseSDKFromUrl()
  } catch (err) {
    console.log('err', err)
  }
}

const getHostName = (url: string) => {
  try {
    return new URL(url).host || url
  } catch {
    return url
  }
}

onBeforeMount(async () => {
  registerPopupHandler(async (event: MessageEvent) => {
    if (typeof event.data !== 'object') return
    if (event.data.type !== 'UP_LOGIN') return
    const { appSetting, payload = '' } = event.data as UPMessage
    try {
      const { email, authorize = false } = JSON.parse(payload)
      await initStateForSDK(appSetting)
      // referrer
      if (sessionStorage.referrer) {
        userStore.referrer = sessionStorage.referrer
      } else {
        userStore.referrer = window.document.referrer
        sessionStorage.referrer = window.document.referrer
      }
      if (authorize) {
        userStore.connectAndAuth.message = createSiweMessage(email)
      }
      userStore.returnEmail = email
    } catch {
      //
    }
  })
})

const createSiweMessage = (returnEmail = false) => {
  const origin = userStore.referrer
  const address = userStore.accountInfo.address
  const email = returnEmail ? userStore.accountInfo.email : ''
  const chainId = getChainIdByChainType(userStore.chain ?? 'polygon')
  const siweMessage = new SiweMessage({
    domain: getHostName(origin),
    address: utils.getAddress(address),
    statement: email ? `email: ${email}` : undefined,
    uri: origin,
    version: '1',
    chainId,
    expirationTime: dayjs().add(10, 'minute').toISOString(),
  })
  return siweMessage.prepareMessage()
}

onBeforeUnmount(() => {
  unregisterPopupHandler()
})

const approve = async () => {
  const dapp =
    route.query.type === 'wallet-connect' ? walletConnectStore.currentDappName : 'UniPassWallet'
  upGA('connect_success', {
    dapp,
    chain: getChainName(userStore.chain),
  })

  const user = userStore.accountInfo
  const newborn = Boolean(sessionStorage.newborn)
  sessionStorage.newborn = ''

  let upAccount
  if (userStore.returnEmail) {
    upAccount = new UPAccount(utils.getAddress(user.address), user.email, newborn)
  } else {
    upAccount = new UPAccount(utils.getAddress(user.address), undefined, newborn)
  }

  // popup must be first
  if (isPopupEnv()) {
    if (userStore.connectAndAuth.message) {
      userStore.connectLoading = true
      const needOAuth = await checkUpSignTokenExpiredForConnectPage()
      if (needOAuth) return
      const signature = await signMessage(userStore.connectAndAuth.message, true)
      const data = {
        ...upAccount,
        message: userStore.connectAndAuth.message,
        signature,
      }
      userStore.connectAndAuth.message = ''
      userStore.connectAndAuth.showMessage = false
      userStore.connectLoading = false

      postMessage(new UPMessage('UP_RESPONSE', JSON.stringify({ type: 'APPROVE', data })))
    } else {
      postMessage(
        new UPMessage('UP_RESPONSE', JSON.stringify(new UPResponse('APPROVE', upAccount))),
      )
    }
    return
  }

  if (route.query.type === 'wallet-connect') {
    await walletConnectStore.approve(user.address)
    router.replace('/')
    return
  }
}

const reject = () => {
  if (route.query.type === 'wallet-connect') {
    router.replace('/')
    return
  }
}
</script>

<style lang="scss">
#page-connect {
  .up-connect {
    .user-from {
      margin: 28px 0;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 74px;
        height: 74px;
      }

      .to-box {
        margin: 0 32px;
        width: 36px;
        height: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .dot {
          width: 4px;
          height: 4px;
          background: var(--up-line);
          border-radius: 50%;
        }
      }

      .app-icon {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        overflow: hidden;
      }
    }

    .info-box {
      text-align: center;
      padding: 28px 24px 24px;
      background: var(--up-card-bg);
      border-radius: 12px;
      backdrop-filter: blur(8px);

      .t1 {
        font-size: 20px;
        font-weight: 600;
        line-height: 20px;
      }

      .t2 {
        margin-top: 16px;
        font-size: 20px;
        font-weight: 600;
        line-height: 28px;
        color: var(--up-text-secondary);
      }

      .t3 {
        margin-top: 16px;
        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        color: var(--up-text-third);
      }

      .t4 {
        text-align: left;
        font-size: 14px;
        font-weight: 400;
        color: var(--up-text-third);
        line-height: 20px;
        display: flex;
        align-items: flex-start;

        & + .t4 {
          margin-top: 20px;
        }

        .iconpark {
          font-size: 20px;
          margin-right: 10px;
        }
      }
    }

    .tip {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      font-weight: 400;
      color: var(--up-text-third);
      line-height: 20px;
    }
    .tips {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      font-weight: 600;
      color: var(--up-text-third);
      line-height: 20px;
    }

    .line {
      margin: 24px 0;
    }
  }
}
</style>
