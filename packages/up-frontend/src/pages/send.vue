<template>
  <div id="page-send">
    <up-header title="Token Transfer"></up-header>
    <el-form @submit.prevent ref="formElement" label-position="top" :model="form">
      <el-form-item
        label="To"
        prop="toAmount"
        :rules="[{ validator: checkAmount, trigger: 'blur' }]"
      >
        <el-input
          v-model="form.toAddress"
          class="to"
          type="textarea"
          :autosize="{ minRows: 2 }"
          resize="none"
          placeholder="Address"
          :spellcheck="false"
        />
        <up-balance
          class="balance"
          :name="form.coin.symbol"
          :subtitle="`Balance ${form.coin.balance} ${form.coin.symbol}`"
        />
        <el-input class="amount" v-model="form.toAmount" placeholder="0" />
      </el-form-item>
      <el-form-item label="Fee" prop="fee">
        <div class="coins">
          <el-radio
            v-for="(coin, i) in form.coins"
            :key="i"
            v-model="form.feeSymbol"
            :label="coin.symbol"
            @change="bindFeeChange"
            class="coin"
            :disabled="Number(coin.gasFee) > Number(coin.balance)"
          >
            <div class="balance-box">
              <up-balance :name="coin.symbol" subtitle="none" />
              <div class="right">
                <span>{{ coin.gasFee }}</span>
                <div class="dot-box">
                  <div v-show="form.feeSymbol === coin.symbol" class="dot"></div>
                </div>
              </div>
            </div>
          </el-radio>
        </div>
      </el-form-item>
      <el-button
        :disabled="disabled"
        :loading="loading || loadingAuthorize"
        type="primary"
        @click="confirmSendTransaction"
      >
        Send
      </el-button>
    </el-form>
    <el-drawer
      v-model="drawer.show"
      custom-class="drawer-token"
      direction="btt"
      :size="drawer.size"
      @close="loading = false"
    >
      <template #header>
        <div class="title">Send Token</div>
      </template>
      <template #default>
        <div class="one send-token">
          <div class="label">Send Token</div>
          <div class="value bold">{{ form.toAmount }} {{ form.coin.symbol }}</div>
        </div>
        <div class="one to">
          <div class="label">To</div>
          <div class="value">{{ unipass.formatAddress(form.toAddress) }}</div>
        </div>
        <div class="view-data-box">
          <div class="view-data" @click="bindViewData">
            <span>View Data</span>
            <i class="iconfont icon-go"></i>
          </div>
          <el-input
            v-if="drawer.viewData"
            :value="form.rawData"
            type="textarea"
            :autosize="{ minRows: 12 }"
            resize="none"
            :spellcheck="false"
          />
        </div>
        <div class="one fee" v-if="form.fee">
          <div class="label">Fee</div>
          <div class="value">{{ form.fee.gasFee }} {{ form.fee.symbol }}</div>
        </div>
      </template>
      <template #footer>
        <el-button class="reject" :disabled="loadingAuthorize" @click="drawer.show = false">
          Refuse
        </el-button>
        <el-button
          class="resolve"
          type="primary"
          :loading="loadingAuthorize"
          @click="sendTransaction"
        >
          Authorize
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useUniPass } from '@/utils/useUniPass'
import { useSend } from '@/composable/useSend'

const {
  disabled,
  loading,
  loadingAuthorize,
  confirmSendTransaction,
  sendTransaction,
  bindViewData,
  checkAmount,
  form,
  formElement,
  bindFeeChange,
  drawer,
} = useSend()
const unipass = useUniPass()
</script>

<style lang="scss">
#page-send {
  .balance {
    margin-top: 28px;
  }
  .amount {
    margin-top: 12px;
    .el-input__inner {
      height: 120px;
      font-size: 50px;
      font-weight: 600;
      line-height: 40px;
    }
  }
  .coins {
    width: 100%;
    .coin {
      margin-right: 0;

      .el-radio__input {
        display: none;
      }

      .el-radio__label {
        width: 100%;
        padding: 0;
      }
      .balance-box {
        padding: 12px;
        width: 100%;
        border-radius: 8px;
        border: 1px solid var(--el-border-color);
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .right {
          display: flex;
          align-items: center;
          .dot-box {
            margin-left: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 16px;
            height: 16px;
            background: #ffffff;
            border: 1px solid #c1c1c1;
            border-radius: 50%;
            .dot {
              border-radius: 50%;
              width: 8px;
              height: 8px;
              background: #0364ff;
            }
          }
        }
      }
    }
    .coin + .coin {
      margin-top: 10px;
    }
    .coin.is-disabled {
      opacity: 0.6;
    }
    .coin.is-checked {
      .up-balance .info .title {
        color: var(--primary);
      }
      .balance-box {
        background: rgba(3, 100, 255, 0.06);
        border-color: rgba(3, 100, 255, 0.4);
      }
    }
  }
  .el-button {
    margin-top: 16px;
    width: 100%;
    i {
      margin-right: 6px;
    }
  }
  .drawer-token {
    .el-drawer__header {
      .title {
        font-size: 20px;
        font-weight: 500;
        line-height: 20px;
      }
    }
    .el-drawer__body {
      display: flex;
      align-items: center;
      flex-direction: column;
      .one {
        width: 100%;
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 400;
        line-height: 16px;
        .value.bold {
          font-weight: 600;
        }
      }
      .one.to {
        margin-top: 28px;
      }
      .one.fee {
        margin-top: 19px;
      }
      .view-data-box {
        width: 100%;
        padding-bottom: 20px;
        border-bottom: 1px dashed var(--el-border-color);

        .view-data {
          width: 100%;
          cursor: pointer;
          margin-top: 16px;
          text-align: right;
          font-size: 12px;
          font-weight: 400;
          line-height: 12px;
          i {
            margin-left: 4px;
            font-size: 12px;
          }
        }
        .el-textarea {
          margin-top: 20px;
        }
      }
    }
    .el-drawer__footer {
      display: flex;
      justify-content: space-between;
      .el-button {
        width: 48%;
      }
    }
  }
}
</style>
