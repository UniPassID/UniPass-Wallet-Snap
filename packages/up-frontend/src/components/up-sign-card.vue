<template>
  <div class="up-sign-card" :class="{ show: props.show }">
    <template v-if="props.type === 'send-token'">
      <div class="title" @click="$emit('update:show', !props.show)">
        <span>{{ $t('SendToken') }}</span>
        <up-icon name="select" />
      </div>
      <template v-if="props.show">
        <div class="main">
          <up-token :name="data.symbol" :chain="data.chain" :icon="props.icon" />
          <div class="amount">
            <div class="token">{{ data.amount }} {{ data.symbol }}</div>
            <up-dollar :symbol="data.symbol" :price="data.price" :amount="data.amount" />
          </div>
        </div>
        <div class="contract-box">
          <div class="address-box">
            <div>{{ $t('SendTo') }}</div>
            <div class="address">
              <el-popover placement="top-end" :width="240" trigger="hover" :content="data.address">
                <template #reference>
                  <span>{{ unipass.formatAddress(data.address) }}</span>
                </template>
              </el-popover>
              <up-icon name="copy" @click="unipass.copy(data.address)" />
            </div>
          </div>
        </div>
      </template>
    </template>
    <template v-else-if="props.type === 'contract-call'">
      <div class="title" @click="$emit('update:show', !props.show)">
        <span>{{ $t('ContractCall') }}</span>
        <up-icon name="select" />
      </div>
      <template v-if="props.show">
        <div class="contract-box">
          <div class="address-box">
            <div>{{ $t('ContractAddress') }}</div>
            <div class="address">
              <el-popover placement="top-end" :width="240" trigger="hover" :content="data.to">
                <template #reference>
                  <span>{{ unipass.formatAddress(data.to) }}</span>
                </template>
              </el-popover>
              <up-icon name="copy" @click="unipass.copy(data.to)" />
            </div>
          </div>
          <!-- <div class="one">
            <div>Protocol</div>
            <div>Unknown Protocol</div>
          </div> -->
          <div class="one">
            <div>Action</div>
            <div>{{ props.actionName ?? 'unknown' }}</div>
          </div>
        </div>
      </template>
    </template>
    <template v-else-if="props.type === 'send-nft'">
      <div class="title" @click="$emit('update:show', !props.show)">
        <span>{{ $t('SendNFT') }}</span>
        <up-icon name="select" />
      </div>
      <template v-if="props.show">
        <div class="main">
          <up-nft name="Doodle #109" src="/img/nft.jpg" />
          <div class="amount">
            <div class="nft">× 1</div>
          </div>
        </div>
        <div class="contract-box">
          <div class="address-box">
            <div>{{ $t('SendTo') }}</div>
            <div class="address">
              <el-popover placement="top-end" :width="240" trigger="hover" :content="data.address">
                <template #reference>
                  <span>{{ unipass.formatAddress(data.address) }}</span>
                </template>
              </el-popover>
              <up-icon name="copy" @click="unipass.copy(data.address)" />
            </div>
          </div>
        </div>
      </template>
    </template>
    <div
      class="raw-data"
      :class="{ show: showTransaction }"
      @click="showTransaction = !showTransaction"
    >
      <span>{{ $t('RawData') }}</span>
      <up-icon name="jump" />
    </div>
    <el-input
      v-show="showTransaction"
      class="raw-data-textarea"
      type="textarea"
      :rows="8"
      resize="none"
      :value="JSON.stringify(props.rawData, null, 2)"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
import { TransactionType, useUniPass } from '@/utils/useUniPass'
import { UPTransactionMessage } from '@unipasswallet/popup-types'
import { TransactionProps } from '@unipasswallet/provider'
interface Props {
  show: boolean
  type: TransactionType
  data: any
  icon?: string
  transaction?: TransactionProps
  actionName?: string
  rawData?: UPTransactionMessage
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  type: 'send-token',
  data: {},
  actionName: 'unknown',
})

const showTransaction = ref(false)

interface Emits {
  (event: 'update:show'): void
}

const $emit = defineEmits<Emits>()
const unipass = useUniPass()
</script>

<style lang="scss">
.up-sign-card {
  margin-top: 20px;
  background: var(--up-card-bg);
  border-radius: 12px;
  padding: 20px;

  &.show {
    .title {
      .icon-select {
        transform: rotateZ(0deg);
      }
    }
  }
  .title {
    cursor: pointer;
    user-select: none;

    display: flex;
    align-items: center;
    justify-content: space-between;

    font-weight: 700;
    font-size: 20px;
    line-height: 28px;

    .icon-select {
      transition: transform var(--el-transition-duration);
      transform: rotateZ(-90deg);
      color: var(--up-text);
    }
  }
  // gas-fee
  .top {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 400;
    line-height: 14px;
    color: var(--up-text-third);
    .title {
      color: var(--up-text-primary);
    }
    .question {
      cursor: pointer;
      padding: 0 6px;
      font-size: 16px;
    }
    .jump {
      cursor: pointer;
      margin-left: auto;
      display: flex;
      align-items: center;
      .icon-jump {
        margin-left: 4px;
      }
    }

    .paid-by {
      margin-left: auto;
      font-size: 14px;
      span {
        font-size: 16px;
        font-weight: 600;
        color: var(--up-text-primary);
      }
    }
  }
  .gas-fee {
    margin: 12px -10px 0;
    display: flex;
    flex-direction: column;
    .el-radio {
      display: flex;
      width: 100%;
      height: auto;
      padding: 16px 10px;

      border-radius: 12px;
      margin-right: 0;
      .el-radio__label {
        padding: 0;
        display: flex;
        align-items: center;
        width: 100%;

        .fee-box {
          margin-left: auto;
          text-align: right;
          padding: 0 12px;
          .fee {
            font-size: 16px;
            font-weight: 600;
            line-height: 16px;
            color: var(--up-text-primary);
            white-space: pre-line;
          }
          .up-dollar {
            margin-top: 6px;
            font-size: 12px;
            font-weight: 400;
            color: var(--up-text-third);
            line-height: 12px;
          }
        }
      }
      .check {
        border-radius: 50%;
        width: 16px;
        height: 16px;
        // border: 1px solid var(--up-line);
        // background: rgba(255, 255, 255, 0);
        border: 1px solid var(--up-text);

        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        .dot {
          border-radius: 50px;
          width: 8px;
          height: 8px;
        }
      }

      &.is-checked {
        .check {
          border-color: #8864ff;

          .dot {
            background: #8864ff;
          }
        }
      }

      &.is-disabled {
        cursor: no-drop;
        .check {
          background: rgba(234, 234, 234, 0.5);
          border: 1px solid #c1c1c1;
        }
        .el-radio__label {
          .up-token {
            opacity: 0.4;
          }
          .fee-box {
            .fee {
              color: var(--up-text);
              opacity: 0.4;
            }
            .up-dollar {
              color: var(--up-secondary);
            }
          }
        }
        &:hover {
          background: transparent;
        }
      }
      .el-radio__input {
        display: none;
      }
      &:hover {
        background: var(--up-bg);
      }
    }
  }

  .main {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .amount {
      text-align: right;
      .nft {
        font-weight: 500;
        font-size: 16px;
        line-height: 24px;
      }
      .token {
        font-weight: 700;
        font-size: 20px;
        line-height: 28px;
      }
      .up-dollar {
        color: var(--up-text-third);
        font-weight: 450;
        font-size: 14px;
        line-height: 20px;
      }
    }
  }
  .contract-box {
    margin-top: 20px;
    padding: 16px;
    background: var(--up-tag-bg);
    border-radius: 12px;
    .address-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      .address {
        margin-right: -10px;
        font-size: 14px;
        font-weight: 400;
        line-height: 14px;
        display: flex;
        align-items: center;

        .icon-copy {
          color: var(--up-text-third);
          cursor: pointer;
          padding: 10px;
        }
      }
    }
    .one {
      margin-top: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--up-text);
      font-weight: 450;
      font-size: 14px;
      line-height: 20px;
    }
  }
  .raw-data {
    cursor: pointer;
    user-select: none;
    margin-top: 20px;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    height: 14px;
    font-size: 14px;
    font-weight: 400;
    color: var(--up-text-third);
    line-height: 14px;

    .icon-jump {
      margin-left: 4px;
      transition: transform var(--el-transition-duration);
      transform: rotateZ(0deg);
    }

    &.show {
      .icon-jump {
        transform: rotateZ(90deg);
      }
    }
  }
  .raw-data-textarea {
    margin-top: 12px;
  }
}
html.dark {
  .up-sign-card .gas-fee .el-radio.is-disabled .check {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #838489;
  }
}
</style>
