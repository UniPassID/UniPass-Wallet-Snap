<template>
  <div id="page-wallet-connect" class="page">
    <up-header :title="$t('WalletConnect')" />

    <div class="select-chain" v-if="walletConnectStore.legacySessions">
      <div class="network">{{ $t('Network') }}</div>
      <el-select
        v-model="label"
        class="page-connect-chain"
        popper-class="page-connect-chain-select"
        @change="walletConnectStore.onChainChanged"
      >
        <template #prefix>
          <up-icon :name="label" />
          <div class="label">{{ label }}</div>
        </template>
        <el-option
          v-for="e in supportedChainListInfo"
          :key="e.label"
          :label="e.label"
          :value="e.value"
        >
          <up-icon :name="e.label" />
          <div class="label">{{ e.label }}</div>
        </el-option>
      </el-select>
    </div>
    <div class="page-main">
      <div class="connect-card-extra" v-if="walletConnectStore.legacySessions">
        <div class="card">
          <div class="logo">
            <el-image
              :src="walletConnectStore.legacySessions.peerMeta?.icons[0]"
              style="width: 24px; height: 24px"
            >
              <template #error>
                <div class="image-slot">
                  <img src="@/assets/img/wallet-connect/logo1.png" />
                </div>
              </template>
            </el-image>
          </div>
          <div class="name">
            {{ walletConnectStore.legacySessions.peerMeta?.name || 'Unknown' }} v1/legacy
          </div>
          <div class="btn" @click="walletConnectStore.disconnectV1()">
            <up-icon name="disconnect" />
            <span>Disconnect</span>
          </div>
        </div>
      </div>
      <div class="connect-card" v-for="pairing in walletConnectStore.sessions" :key="pairing.topic">
        <div class="card">
          <div class="logo">
            <el-image :src="pairing.self.metadata.icons[0]" style="width: 24px; height: 24px">
              <template #error>
                <div class="image-slot">
                  <img src="@/assets/img/wallet-connect/logo1.png" />
                </div>
              </template>
            </el-image>
          </div>
          <div class="name">{{ pairing.self.metadata.name || 'Unknown' }}</div>
          <div class="btn" @click="walletConnectStore.disconnect(pairing.topic)">
            <up-icon name="disconnect" />
            <span>Disconnect</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  supportedChainListInfo,
  getChainName,
  getChainNameByChainId,
} from '@/service/chains-config'
import { useWalletConnectStore } from '@/store/wallet-connect'
console.log(supportedChainListInfo)

const walletConnectStore = useWalletConnectStore()

console.log(`current chain id: ${walletConnectStore.currentChainId}`)
onBeforeMount(walletConnectStore.init)

const label = computed(() => getChainName(getChainNameByChainId(walletConnectStore.currentChainId)))
</script>

<style lang="scss">
#page-wallet-connect {
  .select-chain {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .network {
      margin-top: 21px;
      flex-shrink: 0;
      margin-right: 40px;
    }
  }

  .page-main {
    margin-top: 20px;
    text-align: left;
  }

  .connect-card-extra {
    margin-bottom: 20px;

    .card {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      background: var(--up-bg);
      border-radius: 12px;
      color: var(--up-text-primary);
      padding: 20px;

      .logo {
        margin-right: 12px;
        display: flex;
        align-items: center;

        font-size: 14px;
        font-weight: 400;
        line-height: 14px;
        img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        span {
          display: inline-block;
          margin-left: 10px;
        }
      }

      .name {
        font-weight: 500;
        font-size: 16px;
        line-height: 24px;
        width: 100%;
      }

      .btn {
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px 16px;
        background: linear-gradient(275.85deg, #8864ff 50.28%, #9f82ff 100%);
        color: white;
        box-shadow: inset 1px 1px 3px rgba(255, 255, 255, 0.30254);
        border-radius: 100px;
        font-size: 14px;
        line-height: 20px;
        margin-left: 8px;
        flex-shrink: 0;

        span {
          margin-left: 4px;
        }
      }
    }
  }

  .connect-card {
    & + & {
      margin-bottom: 20px;
    }

    .time {
      font-size: 12px;
      line-height: 20px;
      color: var(--up-text-secondary);
      margin-bottom: 8px;
    }

    .card {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      background: var(--up-bg);
      border-radius: 12px;
      color: var(--up-text-primary);
      padding: 20px;

      .logo {
        margin-right: 12px;
        display: flex;
        align-items: center;

        font-size: 14px;
        font-weight: 400;
        line-height: 14px;
        img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        span {
          display: inline-block;
          margin-left: 10px;
        }
      }

      .name {
        font-weight: 500;
        font-size: 16px;
        line-height: 24px;
        width: 100%;
      }

      .btn {
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px 16px;
        background: linear-gradient(275.85deg, #8864ff 50.28%, #9f82ff 100%);
        color: white;
        box-shadow: inset 1px 1px 3px rgba(255, 255, 255, 0.30254);
        border-radius: 100px;
        font-size: 14px;
        line-height: 20px;
        margin-left: 8px;
        flex-shrink: 0;

        span {
          margin-left: 4px;
        }
      }
    }
  }
}
</style>
