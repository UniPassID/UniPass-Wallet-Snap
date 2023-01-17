<template>
  <div id="page-send" class="page-sign">
    <up-header :title="$t('Send')" />
    <el-form @submit.prevent ref="formElement" :model="form" class="send-form">
      <div class="label">{{ $t('SendTitle') }}</div>
      <div class="token">
        <up-token
          type="index"
          :name="signStore.coin?.symbol"
          :chain="signStore.coin?.chain"
          :icon="signStore.coin?.icon"
          :subtitle="`${$t('Balance')} ${signStore.coin?.balance} ${signStore.coin?.symbol}`"
        />
        <up-form-item
          class="amount"
          prop="toAmount"
          :rules="[
            { required: true, message: $t('EnterAmount'), trigger: 'blur' },
            { validator: checkAmount, trigger: 'blur' },
          ]"
        >
          <up-input
            v-model.trim="form.toAmount"
            placeholder="0"
            @keydown.enter="submit"
            @input="(v: string) => (form.toAmount = unipass.formatAmount(v))"
            @blur="() => (form.toAmount = unipass.formatAmount(form.toAmount, true))"
          >
            <template #suffix>
              <up-dollar
                :symbol="signStore.coin?.symbol"
                :price="signStore.coin?.price"
                :amount="form.toAmount"
              />
              <div class="line"></div>
              <el-button link @click="maxAmount">{{ $t('Maximum') }}</el-button>
            </template>
          </up-input>
        </up-form-item>
      </div>
      <div class="label">{{ $t('SendTo') }}</div>
      <up-form-item
        :label="form.toAddress && $t('EthAddress')"
        :rules="[
          { required: true, message: $t('EnterEthAddress'), trigger: 'change' },
          { validator: checkAddress, trigger: 'change' },
        ]"
        prop="toAddress"
        class="to-address"
      >
        <up-input
          :placeholder="$t('EthAddress')"
          v-model.trim="form.toAddress"
          :spellcheck="false"
          @keydown.enter="submit"
          :disabled="form.convertLoading"
          clearable
        >
          <template #suffix>
            <up-icon v-show="form.convertLoading" name="loading" class="is-loading" />
          </template>
        </up-input>
      </up-form-item>
      <div class="to-domain-success" v-if="form.toDomain">
        <up-icon name="correct" /> Resolved name:
        <strong>{{ form.toDomain }}</strong>
      </div>
      <up-button type="primary" class="submit" @click="submit" :disabled="form.convertLoading">
        {{ $t('NextStep') }}
      </up-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useSend } from '@/composable/useSend'
import { useSignStore } from '@/store/sign'
import { useUniPass } from '@/utils/useUniPass'
import { ChainType } from '@unipasswallet/provider'

const unipass = useUniPass()
const signStore = useSignStore()
const route = useRoute()

signStore.init(route.query.chain as ChainType, route.query.symbol as string)

const { form, formElement, maxAmount, submit, checkAmount, checkAddress } = useSend()
</script>

<style lang="scss">
#page-send {
  .send-form {
    .label {
      text-align: left;
      margin-top: 32px;
      font-size: 20px;
      font-weight: 600;
      line-height: 20px;
    }
    .token {
      margin-top: 20px;
      padding: 20px;
      background: var(--up-bg);
      border-radius: 12px;
      .amount {
        margin-top: 20px;
        .up-input {
          font-size: 20px;
          font-weight: 600;
          color: var(--up-text-third);
          .dollar {
            font-size: 14px;
            font-weight: 400;
            color: var(--up-text-third);
          }
          .line {
            margin: 16px;
            width: 1px;
            height: 18px;
            border: 1px solid var(--up-line);
          }
          .el-button {
            font-size: 16px;
            font-weight: 400;
          }
        }
      }
    }
    .to-address {
      margin-top: 20px;
      .el-input__suffix {
        .icon-loading {
          font-size: 15px;
          margin-right: 8px;
        }
      }
    }
    .to-domain-success {
      margin-top: 12px;
      text-align: left;
      color: #4aac4c;
      font-weight: 450;
      font-size: 14px;
      line-height: 20px;
    }
    .submit {
      margin-top: 40px;
    }
  }
}
</style>
