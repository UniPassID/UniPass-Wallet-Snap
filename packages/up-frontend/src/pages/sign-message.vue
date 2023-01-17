<template>
  <div class="page-sign header-bg-img">
    <up-header-connect hide-chain />
    <up-sign class="message">
      <template #main>
        <div class="up-sign-card from-box">
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
        <div class="up-sign-card message-box">
          <div class="subtitle">{{ $t('YouAreSigning') }}</div>
          <el-input
            v-if="signStore.signMassage.type === 'V1'"
            type="textarea"
            :rows="8"
            resize="none"
            v-model="signStore.signMassage.msg"
            readonly
          />
          <div class="json-view-eip712" v-if="signStore.signMassage.type === 'V4'">
            <json-viewer
              :value="signStore.signMassage.typedData?.message ?? ''"
              :expand-depth="5"
              theme="my-awesome-json-theme"
            ></json-viewer>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="btns">
          <up-button type="info" @click="reject" :disabled="signStore.signMassage.loading">
            {{ $t('Cancel') }}
          </up-button>
          <up-button type="primary" @click="approve" :loading="signStore.signMassage.loading">
            {{ $t('Sign') }}
          </up-button>
        </div>
      </template>
    </up-sign>
  </div>
</template>

<script setup lang="ts">
import { useSDK } from '@/composable/useSDK'
import { useSign } from '@/composable/useSign'
import { getChainName } from '@/service/chains-config'
import { SignMessageType } from '@/store/sign'
import { useUserStore } from '@/store/user'
import { checkUpSignTokenForSignMessage } from '@/utils/oauth/check_up_sign_token'
import { upGA } from '@/utils/useUniPass'
import { useWalletConnectStore } from '@/store/wallet-connect'
import router from '@/plugins/router'

const userStore = useUserStore()
const referrerHost = computed(() => {
  try {
    const host = new URL(signStore.signMassage.referrer).host
    return host || signStore.signMassage.referrer
  } catch (error) {
    return signStore.signMassage.referrer
  }
})
const chainName = computed(() => {
  return getChainName(userStore.chain || undefined)
})
const walletConnectStore = useWalletConnectStore()
const { signMessage, signTypedData, signStore } = useSign()

const init = async () => {
  const sdkHandle = useSDK()

  // Make sure unreal callback function is before the async function
  await sdkHandle.initUserStoreFromSDK()

  await walletConnectStore.init()
}

onBeforeMount(init)

onMounted(() => {
  upGA('signmessage_start', {
    dapp: walletConnectStore.getDappName(),
    chain: getChainName(userStore.chain),
  })
})

const approve = async () => {
  upGA('signmessage_click_sign', {
    dapp: walletConnectStore.getDappName(),
    chain: getChainName(userStore.chain),
  })

  const needOAuth = await checkUpSignTokenForSignMessage(JSON.stringify(signStore.$state))
  if (needOAuth) return

  signStore.signMassage.loading = true

  let sig: string | undefined = ''
  if (signStore.signMassage.type === SignMessageType.v1) {
    sig = await signMessage(signStore.signMassage.msg, !!signStore.walletConnectId)
  } else {
    sig = await signTypedData(signStore.signMassage.typedData)
  }
  if (!sig) return

  upGA('signmessage_success', {
    dapp: walletConnectStore.getDappName(),
    chain: getChainName(userStore.chain),
  })

  if (signStore.walletConnectId != null) {
    await walletConnectStore.walletConnectApprove(
      signStore.walletConnectTopic,
      signStore.walletConnectId,
      // work around for Wallet Connect V1 bug(replace tails '00' to '1b')
      signStore.walletConnectTopic.endsWith('V1') ? sig + '1b' : sig,
    )
    signStore.signMassage.loading = false
    signStore.walletConnectTopic = ''
    signStore.walletConnectId = undefined
    router.replace('/')
    return
  }
}

const reject = async () => {
  if (signStore.walletConnectId != null) {
    await walletConnectStore.walletConnectReject(
      signStore.walletConnectTopic,
      signStore.walletConnectId,
    )
    signStore.signMassage.loading = false
    signStore.walletConnectTopic = ''
    signStore.walletConnectId = undefined
    router.replace('/')
    return
  }
}
</script>

<style lang="scss">
.json-view-eip712 {
  height: 240px;
  margin-top: 20px;
  box-shadow: none;
  background: var(--up-card-bg);
  border-radius: 12px;
  padding: 20px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  overflow: auto;

  .my-awesome-json-theme {
    background: transparent;
    white-space: nowrap;
    color: var(--el-input-text-color, var(--el-text-color-regular));
    font-size: 14px;
    font-family: Consolas, Menlo, Courier, monospace;

    .jv-code {
      .jv-toggle {
        &:before {
          padding: 0px 2px;
          border-radius: 2px;
        }
        &:hover {
          &:before {
            background: red;
          }
        }
      }
    }
  }
}
</style>
