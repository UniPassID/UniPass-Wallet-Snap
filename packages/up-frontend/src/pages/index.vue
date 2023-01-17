<template>
  <div id="page-index" class="header-bg-img">
    <div class="main-container">
      <div class="header">
        <div class="user">
          <div class="left">
            <img src="@/assets/img/index/avatar.svg" />
          </div>
          <div class="right">
            <div class="email">{{ userStore.accountInfo.email }}</div>
            <div class="address" @click="unipass.copy(userStore.accountInfo.address)">
              <span>{{ unipass.formatAddress(userStore.accountInfo.address) }}</span>
              <up-icon name="copy" />
            </div>
          </div>
        </div>
        <router-link class="setting" to="/setting">
          <up-icon name="setting" />
        </router-link>
      </div>
      <router-link
        v-if="walletConnectStore.sessions.length > 0 || walletConnectStore.legacySessions"
        to="/wallet-connect"
        class="wallet-connect"
      >
        <div class="box">
          <div class="left">
            <img src="@/assets/img/connect/wallet-connect.svg" />
            <span>WalletConnect</span>
          </div>
          <!-- {{
            walletConnectStore.legacySessions
              ? walletConnectStore.sessions.length + 1
              : walletConnectStore.sessions.length
          }} -->
          <div class="right up-chain" :class="chainName">{{ chainName }}</div>
        </div>
      </router-link>
      <div class="lump-sum-box">
        <div class="title">{{ $t('TotalAmount') }}</div>
        <div class="lump-sum">
          <div class="worth">
            <span>${{ showLumpSum ? netWorth : '*****' }}</span>
            <up-icon
              @click="showLumpSum = !showLumpSum"
              :name="showLumpSum ? 'eyes-open' : 'eyes-close'"
            />
          </div>
        </div>
        <!-- <div class="gain">
          <up-icon name="rise" />
          <span>+5.64 (1%)</span>
        </div> -->
      </div>
      <div class="shortcut">
        <div class="btn-box">
          <div class="btn" @click="openScanModal">
            <up-icon :name="`scan-${isDark ? 'dark' : 'light'}`" />
          </div>
          <div>{{ $t('Scan') }}</div>
        </div>
        <div class="btn-box active" @click="showReceive = true">
          <div class="btn">
            <up-icon name="receive-dark" />
          </div>
          <div>{{ $t('Receive') }}</div>
        </div>
        <div class="btn-box">
          <div class="btn" @click="toBuyCoins">
            <up-icon :name="`buy-${isDark ? 'dark' : 'light'}`" />
          </div>
          <div>{{ $t('Buy') }}</div>
        </div>
      </div>

      <div class="recovering" v-if="chainAccountStore.isPending">
        <div class="progress">
          <el-progress
            :text-inside="true"
            :format="(percentage: number) => `${percentage}% ${$t('Recovering')}...`"
            :stroke-width="24"
            :percentage="Number(chainAccountStore.percentage)"
          >
          </el-progress>
        </div>
        <el-button
          :loading="recovering.loading"
          round
          type="danger"
          size="small"
          @click="beforeCancelRecovery"
        >
          {{ $t('Cancel') }}
        </el-button>
      </div>
      <div class="coin-box">
        <div class="coin-title">{{ $t('Token') }}</div>
        <template v-for="(coin, i) in userStore.coins" :key="i">
          <div
            v-show="
              Number(coin.balance) > 0 ||
              coin.symbol === 'USDC' ||
              coin.contractAddress === ADDRESS_ZERO
            "
            class="coin"
            @click="coinActive = coinActive === i ? -1 : i"
          >
            <div class="top">
              <up-token :name="coin.symbol" :chain="coin.chain" :icon="coin.icon" type="index" />
              <div class="balance">
                <div>{{ unipass.formatBalance(coin.balance) }}</div>
                <up-dollar :symbol="coin.symbol" :price="coin.price" :amount="coin.balance" />
              </div>
            </div>
            <div class="bottom" v-if="coinActive === i">
              <up-button type="primary" @click="sendCoin(i)">{{ $t('Transfer') }}</up-button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <el-drawer
      v-model="showReceive"
      :with-header="false"
      custom-class="drawer-receive"
      direction="btt"
      size="572px"
    >
      <template #default>
        <div class="title">
          <span>{{ $t('Receive') }}</span>
          <up-icon name="close" @click="showReceive = false" />
        </div>
        <div class="qrcode">
          <img v-if="inited" :src="addressQRCode" class="qr-code" />
        </div>
        <div class="address">{{ userStore.accountInfo.address }}</div>
        <up-button class="copy" type="primary" @click="unipass.copy(userStore.accountInfo.address)">
          {{ $t('CopyAddress') }}
        </up-button>
      </template>
    </el-drawer>

    <up-confirm
      :title="$t('CancelRecovery')"
      v-model="auth.show"
      destroy-on-close
      @closed="auth.password = ''"
    >
      <div class="el-dialog__subtitle">
        {{ $t('InputYourPassword') }}
      </div>

      <el-form @submit.prevent ref="authElement" :model="auth">
        <up-form-item :label="auth.password && $t('Password')" prop="password">
          <up-input
            @input="(v: string) => (auth.password = unipass.formatPassword(v))"
            v-model="auth.password"
            :placeholder="$t('EnterPassword')"
            :disabled="recovering.loading"
            @keydown.enter="auth.password && cancelRecovery()"
            show-password
            clearable
          />
        </up-form-item>
      </el-form>
      <template #footer>
        <up-button
          type="primary"
          :disabled="!auth.password"
          :loading="recovering.loading"
          @click="cancelRecovery"
        >
          {{ $t('Confirm') }}
        </up-button>
      </template>
    </up-confirm>

    <up-confirm
      :title="$t('Scan')"
      v-model="scan.isScanning"
      destroy-on-close
      @closed="closeScanModal"
    >
      <div class="scan-modal-content">
        <div class="scan-video">
          <div class="scan-video-container">
            <div class="video-container">
              <video ref="cameraElement" playsinline :attr-scanning="scan.isScanning" />
            </div>
            <div class="border-container">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
        <div class="paste-btn">
          <up-button type="info" @click="pasteCode">
            {{ $t('Paste WalletConnect code') }}
          </up-button>
        </div>
      </div>
    </up-confirm>
  </div>
</template>

<script setup lang="ts">
import { useIndex } from '@/composable/useIndex'
import { upError, upInfo, useUniPass } from '@/utils/useUniPass'
import { ADDRESS_ZERO } from '@/service/constants'
import { useChainAccountStore } from '@/store/chain-account'
import { checkUpSignTokenForCancelRecovery } from '@/utils/oauth/check_up_sign_token'
import jsQR from 'jsqr'
import { useWalletConnectStore } from '@/store/wallet-connect'
import { getChainName, getChainNameByChainId } from '@/service/chains-config'

const { t: $t } = useI18n()
const router = useRouter()
const unipass = useUniPass()
const chainAccountStore = useChainAccountStore()
const isDark = useDark()
const walletConnectStore = useWalletConnectStore()

const showLumpSum = ref(true)
const coinActive = ref(-1)

const {
  inited,
  cancelRecovery,
  recovering,
  userStore,
  // info
  addressQRCode,
  showReceive,
  // methods
  sendCoin,
  netWorth,
  // cancel recovery
  auth,
} = useIndex()

onBeforeMount(() => {
  walletConnectStore.init()
  sessionStorage.removeItem('path')
})

const chainName = computed(() =>
  getChainName(getChainNameByChainId(walletConnectStore.currentChainId)),
)

const beforeCancelRecovery = async () => {
  const needOAuth = await checkUpSignTokenForCancelRecovery()
  if (!needOAuth) auth.show = true
}

const toBuyCoins = () => {
  const net = process.env.VUE_APP_Net
  if (net !== 'mainnet' && net !== 'preview' && net !== 'testnet') {
    router.push('/buy-coins')
  } else {
    upInfo('coming soon')
  }
}

const cameraElement = ref<HTMLVideoElement>()
const scan = reactive({
  isScanning: false,
  frameId: 0,
  // camera
  cameraAll: 0,
  cameraCount: 0,
  showQuick: false,
  showMigration: false,
})

const openScanModal = async () => {
  if (scan.isScanning) {
    return
  }
  scan.isScanning = true
  scan.cameraAll = 0
  scan.cameraCount = 0
  try {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })

    if (!stream) {
      unipass.error('no source found')
      return
    }

    const camera = cameraElement.value
    if (!camera) return

    const canvas = document.createElement('canvas')
    const requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame

    camera.srcObject = stream
    camera.play()

    const tick = () => {
      if (!scan.isScanning) {
        closeScanModal()
        return
      }
      if (camera.readyState === camera.HAVE_ENOUGH_DATA && canvas) {
        canvas.width = camera.videoWidth
        canvas.height = camera.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const rect = [0, 0, canvas.width, canvas.height]
          ctx.drawImage(camera, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, rect[2], rect[3], {
            inversionAttempts: 'dontInvert',
          })
          if (code && code.data) {
            console.log('QR Code', code.data)
            closeScanModal()
            walletConnectStore.pair(code.data)
          }
        }
      }
      scan.frameId = requestAnimationFrame(tick)
    }
    scan.frameId = requestAnimationFrame(tick)
  } catch (err) {
    unipass.error($t('NoCameraPermission'))
  }
}

const closeScanModal = () => {
  if (!scan.isScanning) {
    return
  }
  scan.isScanning = false
  const camera = cameraElement.value
  if (!camera) return
  camera.pause()
  if (scan.frameId) {
    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(scan.frameId)
    scan.frameId = 0
  }
  const mediaStream = camera.srcObject as any
  if (mediaStream) {
    mediaStream.getTracks().forEach((track: any) => track.stop())
  }
  camera.srcObject = null
}

onBeforeUnmount(closeScanModal)

const pasteCode = async () => {
  try {
    const clipText = await navigator.clipboard.readText()
    await walletConnectStore.pair(clipText)
  } catch (e) {
    upError($t('NoClipboardPermission'))
  } finally {
    closeScanModal()
  }
}

// const goToHowToUse = () => {
//   window.open('https://walletconnect.com/products')
// }
</script>

<style lang="scss">
#page-index {
  .main-container {
    position: relative;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    margin-bottom: 20px;
    .user {
      text-align: left;
      display: flex;
      .left {
        border-radius: 50%;
        width: 40px;
        height: 40px;
        background: #000000;
        border: 1px solid #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
      }
      .right {
        .email {
          font-size: 16px;
          font-weight: 600;
          line-height: 16px;
        }
        .address {
          display: flex;
          align-items: center;

          cursor: pointer;
          margin-top: 8px;
          font-size: 14px;
          line-height: 14px;
          font-weight: 400;
          color: var(--up-text-third);
          .icon-copy {
            margin-left: 6px;
          }
        }
      }
    }
    .setting {
      cursor: pointer;
      width: 40px;
      height: 40px;
      background: var(--up-bg);
      box-shadow: inset 1px 1px 3px 0px var(--up-line);
      border-radius: 16px;
      backdrop-filter: blur(8px);
      color: var(--up-text-primary);

      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
    }
  }
  .wallet-connect {
    display: flex;
    justify-content: center;
    align-items: center;
    .box {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 220px;
      height: 44px;
      padding: 0 16px;

      background: var(--up-card-bg);
      color: var(--up-text-primary);
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.06);
      border-radius: 100px;

      .left {
        display: flex;
        font-weight: 450;
        font-size: 14px;
        line-height: 20px;
        img {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
      }
      .right {
        margin-left: 20px;
        font-weight: 600;
        font-size: 12px;
        line-height: 20px;

        border-radius: 100px;
        padding: 1px 7px;
        color: #fff;
      }
    }
  }
  .lump-sum-box {
    padding-top: 20px;
    .title {
      font-size: 16px;
      font-weight: 400;
      color: var(--up-text-secondary);
      line-height: 16px;
    }
    .lump-sum {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
      font-size: 36px;
      line-height: 36px;

      font-family: Futura, PingFang SC, Source Sans, Microsoft Yahei, sans-serif;
      font-weight: bold;

      .worth {
        position: relative;

        .iconpark {
          position: absolute;
          right: -44px;
          top: 0;
          bottom: 0;

          cursor: pointer;
          padding: 10px;
          font-size: 18px;
          color: var(--up-text-third);
        }
      }
    }
    .gain {
      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 16px;
      font-weight: 600;
      color: #acf080;
      line-height: 16px;

      .iconpark {
        font-size: 20px;
        margin-right: 6px;
      }
    }
  }
  .shortcut {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    .btn-box {
      cursor: pointer;
      font-size: 16px;
      font-weight: 400;
      color: var(--up-text-secondary);
      line-height: 16px;
      & + .btn-box {
        margin-left: 40px;
      }
      .btn {
        width: 68px;
        height: 68px;
        background: var(--up-bg);
        box-shadow: inset 1px 1px 3px 0px var(--up-line);
        border-radius: 30px;
        margin-bottom: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
        .iconpark {
          font-size: 30px;
        }
      }
      &.active {
        .btn {
          background: linear-gradient(320deg, #8864ff 0%, #9a7cff 100%);
          box-shadow: inset 1px 1px 4px 0px rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .recovering {
    margin-top: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .progress {
      width: 100%;
      .el-progress-bar__outer {
        background-color: #97989d;
      }
    }
    .el-button {
      margin-left: 14px;
    }
  }
  .coin-box {
    .coin-title {
      margin-top: 44px;
      margin-bottom: 24px;
      text-align: left;
      font-size: 20px;
      font-weight: 600;
      line-height: 20px;
    }
    .coin {
      cursor: pointer;
      padding: 20px;
      background: var(--up-bg);
      border-radius: 12px;
      backdrop-filter: blur(8px);
      & + .coin {
        margin-top: 20px;
      }
      .top {
        display: flex;
        align-items: center;

        .balance {
          margin-left: auto;
          font-size: 16px;
          font-weight: 600;
          line-height: 16px;
          text-align: right;
          .up-dollar {
            margin-top: 10px;
            font-size: 14px;
            font-weight: 400;
            color: var(--up-text-third);
            line-height: 14px;
          }
        }
      }
      .bottom {
        margin-top: 20px;
      }
    }
  }

  .drawer-receive {
    .el-drawer__body {
      padding: 40px 24px;
      position: relative;
      display: flex;
      align-items: center;
      flex-direction: column;
      .title {
        font-size: 24px;
        font-weight: bold;
        line-height: 24px;
        .icon-close {
          cursor: pointer;
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 24px;
        }
      }
      .qrcode {
        margin-top: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        background: #ffffff;
        border-radius: 20px;
        border: 5px solid #fafafc;
        padding: 20px;
      }
      .address {
        margin-top: 20px;

        background: var(--up-mask);
        border-radius: 12px;
        padding: 10px 20px;

        font-size: 16px;
        font-weight: 400;
        color: #ffffff;
        line-height: 26px;
      }
      a.view {
        margin-top: 16px;
        text-decoration: underline;
        font-size: 14px;
        font-weight: 400;
        color: #acf080;
        line-height: 14px;
      }

      .copy {
        margin-top: 40px;
      }
    }
  }

  .scan-modal-content {
    .scan-video {
      padding: 30px;

      .scan-video-container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 100%;
        border-radius: 20px;

        .video-container {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;

          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .border-container {
          position: absolute;
          width: calc(100% + 4px);
          height: calc(100% + 4px);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);

          div {
            position: absolute;
            border: 4px solid var(--up-text-primary);
            width: 40px;
            height: 40px;
          }

          & div:nth-child(1) {
            top: 0;
            left: 0;
            border-bottom: none;
            border-right: none;
            border-top-left-radius: 20px;
          }

          & div:nth-child(2) {
            top: 0;
            right: 0;
            border-bottom: none;
            border-left: none;
            border-top-right-radius: 20px;
          }

          & div:nth-child(3) {
            bottom: 0;
            left: 0;
            border-top: none;
            border-right: none;
            border-bottom-left-radius: 20px;
          }

          & div:nth-child(4) {
            bottom: 0;
            right: 0;
            border-top: none;
            border-left: none;
            border-bottom-right-radius: 20px;
          }
        }
      }
    }

    .use-tips {
      cursor: pointer;
      font-size: 14px;
      line-height: 20px;
      color: var(--up-text-third);
      text-align: center;
      margin-top: 12px;

      span {
        color: #a98eff;
      }
    }
  }
}

html.dark {
  #page-index {
    .wallet-connect {
      .box {
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.16);
      }
    }
  }
}
</style>
