<template>
  <div class="up-sign main-container">
    <slot name="main">
      <div v-if="referrerHost" class="up-sign-card from-box">
        <el-image :src="userStore.appIcon" style="width: 20px; height: 20px">
          <template #error>
            <div class="image-slot">
              <img src="@/assets/img/connect/from.svg" />
            </div>
          </template>
        </el-image>
        <div class="host">{{ referrerHost }}</div>
        <div class="chain-box">
          <div class="chain up-chain" :class="chainName">On {{ chainName }}</div>
        </div>
      </div>
      <template v-else>
        <div class="t1">{{ $t('SignTransaction') }}</div>
        <div class="chain-box">
          <div class="chain up-chain" :class="chainName">On {{ chainName }}</div>
          <!-- <div class="dot"></div>
          <span>{{ $t('NoRisk') }}</span> -->
        </div>
      </template>
      <up-sign-card
        v-for="(card, i) in signStore.cards"
        v-show="!props.syncMode"
        v-model:show="card.show"
        :type="card.type"
        :data="card.data"
        :actionName="card.actionName"
        :icon="signStore.coin?.icon"
        :rawData="card.rawData"
        :transaction="transaction"
        :key="i"
      />
      <div class="up-sign-card" v-if="props.syncMode">
        <div class="top">
          <div class="title">Sync or Deploy Wallet</div>
        </div>
        <div class="contract-box">
          <div class="address-box">
            <div>Contract</div>
            <div class="address">
              <el-popover
                placement="top-end"
                :width="240"
                trigger="hover"
                :content="userStore.accountInfo.address"
              >
                <template #reference>
                  <span>{{ unipass.formatAddress(userStore.accountInfo.address) }}</span>
                </template>
              </el-popover>
              <up-icon name="copy" @click="unipass.copy(userStore.accountInfo.address)" />
            </div>
          </div>
        </div>
      </div>
      <div class="up-sign-card" v-if="signStore.chain !== 'rangers'">
        <div class="top">
          <div class="title">{{ $t('GasFee') }}</div>
          <div class="paid-by" v-if="isFreeFee">
            <div>{{ $t('PaidBy') }} <span>UniPass</span></div>
          </div>
          <!-- <up-icon class="question" :name="isDark ? 'question-dark' : 'question-light'" /> -->
          <!-- <div class="jump">
            <div>{{ $t('NormalSpeed') }}</div>
            <up-icon name="jump" />
          </div> -->
        </div>
        <el-radio-group
          v-if="!isFreeFee"
          class="gas-fee"
          v-loading="signStore.gasFeeLoading"
          v-model="signStore.feeSymbol"
          @change="feeChange"
        >
          <el-radio
            v-for="{ coin, fee } in feeItems"
            :key="coin.symbol"
            :label="coin.symbol"
            :disabled="Number(fee.amount) > Number(coin.balance) || signStore.loading"
          >
            <up-token
              :name="coin.symbol"
              :chain="coin.chain"
              :balance="coin.balance"
              :icon="coin.icon"
            />
            <div class="fee-box">
              <div class="fee">{{ unipass.formatBalance(fee.amount, 8) }} {{ coin.symbol }}</div>
              <div
                class="up-dollar"
                v-if="Number(fee.amount) > Number(coin.balance) || signStore.loading"
              >
                {{ $t('Insufficient') }}
              </div>
              <up-dollar v-else :symbol="coin.symbol" :price="coin.price" :amount="fee.amount" />
            </div>
            <div class="check">
              <div class="dot"></div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
    </slot>
    <slot name="footer">
      <div class="btns">
        <up-button type="info" @click="cancel" :disabled="signStore.loading">
          {{ $t('Cancel') }}
        </up-button>
        <up-button type="primary" @click="sign" :loading="signStore.loading" :disabled="!canSign">
          {{ $t('Sign') }}
        </up-button>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useSign } from '@/composable/useSign'
import { getChainName } from '@/service/chains-config'
import { useUserStore } from '@/store/user'
const { t: $t } = useI18n()
const userStore = useUserStore()

const { unipass, signStore, sign, feeChange, transaction, feeItems } = useSign()

const canSign = computed(() => {
  if (signStore.gasFeeLoading) return false

  if (signStore.feeOptions.length > 0 && !signStore.feeSymbol) return false

  return true
})

const isFreeFee = computed(() => {
  if (signStore.feeOptions.length === 0 && !signStore.gasFeeLoading) return true

  return false
})

const chainName = computed(() => {
  return getChainName(signStore.coin?.chain)
})

interface Props {
  cancel?: () => void
  syncMode?: boolean
}

const props = withDefaults(defineProps<Props>(), { cancel: undefined, syncMode: false })

const cancel = () => {
  if (props.cancel) {
    props.cancel()
  }
}

const referrerHost = computed(() => {
  try {
    const host = new URL(signStore.signMassage.referrer).host
    return host || signStore.signMassage.referrer
  } catch (error) {
    return signStore.signMassage.referrer
  }
})
</script>

<style lang="scss">
.up-sign {
  .t1 {
    margin-top: 40px;
    font-size: 28px;
    line-height: 28px;

    font-family: Futura, PingFang SC, Source Sans, Microsoft Yahei, sans-serif;
    font-weight: bold;
  }
  .t2 {
    margin-top: 20px;
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
  }
  .label {
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 400;
    color: var(--up-text-third);
    line-height: 14px;
  }
  .user {
    margin-bottom: 28px;
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
        cursor: pointer;
        margin-top: 8px;
        font-size: 14px;
        line-height: 14px;
        font-weight: 400;
        color: var(--up-text-third);
      }
    }
  }
  .from {
    margin-bottom: 28px;
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
  .chain-box {
    margin-top: 18px;
    display: flex;
    align-items: center;
    .chain {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 21px;
      padding: 0 7px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 400;
      color: #ffffff;
      line-height: 14px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4aac4c;
      margin-left: 12px;
      margin-right: 6px;
    }
  }
  .from-box {
    display: flex;
    align-items: center;

    .el-image {
      margin-right: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      .image-slot img {
        width: 100%;
        height: 100%;
      }
    }
    .host {
      font-weight: 500;
      font-size: 20px;
      line-height: 28px;
      margin-right: 8px;
      word-break: break-all;
    }
    .chain-box {
      margin-top: 0;
      margin-left: auto;
      flex-shrink: 0;
    }
  }
  .message-box {
    margin-top: 20px;
    max-height: 400px;
    .subtitle {
      background: var(--up-card-bg);
      font-weight: 700;
      font-size: 20px;
      line-height: 28px;
      padding-bottom: 20px;
      border-bottom: 1px dashed var(--up-line);
      margin-bottom: 20px;
    }
    .el-textarea .el-textarea__inner {
      padding: 0;
      font-weight: 450;
      font-size: 14px;
      line-height: 20px;
      border-radius: 0;
    }
  }
}
</style>
