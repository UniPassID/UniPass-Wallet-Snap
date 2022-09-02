<template>
  <div id="page-index">
    <up-header hide-back>
      <template #left>
        <img src="@/assets/img/index/unipass-logo.svg" class="unipass-logo" />
        <img src="@/assets/img/index/unipass.svg" class="unipass-text" />
      </template>
      <template #right>
        <up-icon name="exit" class="exit" @click="userExit" />
      </template>
    </up-header>
    <div class="card-box">
      <img src="@/assets/img/index/card.svg" class="card" />
      <div class="top-box">
        <div class="address">
          <span>{{ unipass.formatAddress(address) }}</span>
          <img src="@/assets/img/index/copy.svg" class="copy" @click="unipass.copy(address)" />
        </div>
        <div class="guardians">
          <el-tooltip
            v-for="(guardian, i) in guardians"
            effect="dark"
            placement="top"
            :content="guardian"
            :key="i"
          >
            <div class="guardian">
              <img src="@/assets/img/index/guardian.svg" />
            </div>
          </el-tooltip>
        </div>
      </div>
      <div class="btn-box">
        <div class="btn receive" @click="showReceive = true">
          <img src="@/assets/img/index/receive.svg" />
          <span>Receive</span>
        </div>
        <div class="btn scan" @click="scanStart">
          <img src="@/assets/img/index/scan.svg" />
          <span>Scan</span>
        </div>
      </div>
    </div>
    <div class="coin-box">
      <div class="coin-line"></div>
      <div class="coin-title">Coins</div>
      <div class="coin" v-for="(coin, i) in userStore.coins" :key="i" @click="sendCoin(i)">
        <up-balance :name="coin.symbol" />
        <div class="value">{{ coin.balance }}</div>
      </div>
    </div>
    <el-drawer v-model="showReceive" custom-class="drawer-receive" direction="btt" size="498px">
      <template #header>
        <div class="title">Receive</div>
      </template>
      <template #default>
        <div class="qrcode">
          <img v-if="addressQRCode" :src="addressQRCode" class="qr-code" />
        </div>
        <div class="address">{{ address }}</div>
        <a class="view" target="_blank" :href="`${explorer}/address/${address}`">
          View in explorer
        </a>
      </template>
      <template #footer>
        <up-button type="primary" @click="unipass.copy(address)">Copy Address</up-button>
      </template>
    </el-drawer>
    <div v-show="scan.isScanning" class="header-camera">
      <div class="tip">{{ scan.cameraCount }} / {{ scan.cameraAll }}</div>
      <video ref="cameraElement" playsinline :attr-scanning="scan.isScanning" />
      <img src="@/assets/img/index/close.svg" class="close" @click="scanStop" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIndex } from '@/composable/useIndex'
import { useUniPass } from '@/utils/useUniPass'
const explorer = process.env.VUE_APP_Explorer as string
const unipass = useUniPass()
const {
  userStore,
  // camera
  cameraElement,
  scan,
  scanStart,
  scanStop,
  // info
  guardians,
  addressQRCode,
  address,
  showReceive,
  // methods
  sendCoin,
  userExit,
} = useIndex()
</script>

<style lang="scss">
#page-index {
  .up-header {
    .left {
      cursor: pointer;
      .unipass-logo {
        width: 25px;
        height: 25px;
      }
      .unipass-text {
        margin-left: 8px;
        width: 70px;
        height: 12px;
      }
    }
    .right {
      .exit {
        margin-left: 8px;
        cursor: pointer;
        width: 24px;
        width: 24px;
      }
    }
  }
  .card-box {
    margin-top: 24px;
    z-index: 1;
    position: relative;
    padding: 24px 21px 30px;
    color: #ffffff;
    .card {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      border-radius: 20px;
      object-fit: cover;
    }
    .top-box {
      display: flex;
      justify-content: space-between;
      .address {
        display: flex;
        align-items: center;
        span {
          font-size: 16px;
          font-weight: 600;
          line-height: 16px;
          margin-right: 8px;
        }
        img.copy {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
      }
      .guardians {
        display: flex;
        align-items: center;
        .guardian {
          img {
            cursor: pointer;
            margin-left: 10px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }
    .btn-box {
      margin-top: 28px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      .btn {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        cursor: pointer;

        img {
          width: 56px;
          height: 56px;
        }
        span {
          margin-top: 12px;
          font-size: 14px;
          font-weight: 400;
          line-height: 14px;
        }
      }
    }
  }
  .coin-box {
    .coin-line {
      margin-top: 24px;
      width: 100%;
      height: 10px;
      background: #fafafc;
      border-radius: 5px;
    }
    .coin-title {
      margin-top: 24px;
      font-size: 18px;
      font-weight: 600;
      line-height: 18px;
      text-align: left;
      margin-bottom: 8px;
    }
    .coin {
      cursor: pointer;
      padding: 20px 24px;
      margin: 0 -24px;
      display: flex;
      align-items: center;

      .value {
        margin-left: auto;
        font-size: 18px;
        line-height: 18px;
      }
    }
    .coin:hover {
      background: #fafafc;
    }
  }
  .drawer-receive {
    .el-drawer__header {
      .title {
        font-size: 20px;
        font-weight: 600;
        line-height: 20px;
      }
    }
    .el-drawer__body {
      display: flex;
      align-items: center;
      flex-direction: column;
      .address {
        margin-top: 20px;
        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        width: 255px;
      }
      a.view {
        margin-top: 12px;
        font-size: 14px;
        font-weight: 400;
        color: #0364ff;
        text-decoration: underline;
      }
      .qrcode {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        background: #ffffff;
        border-radius: 20px;
        border: 5px solid #fafafc;
      }
    }
    .el-drawer__footer {
      .el-button {
        width: 100%;
      }
    }
  }
  .header-camera {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    z-index: 11;

    .tip {
      position: absolute;
      top: 20px;
      left: 28px;
      line-height: 32px;
      font-size: 14px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.4);
      z-index: 12;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .close {
      z-index: 12;
      cursor: pointer;
      position: absolute;
      top: 44px;
      right: 28px;
      width: 32px;
      height: 32px;
    }
  }
}
html.dark {
  #page-index .coin-box {
    .coin-line {
      background: #666;
    }
    .coin:hover {
      background: #666;
    }
  }
}
</style>
