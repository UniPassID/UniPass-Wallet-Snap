<template>
  <div id="page-recovery-guardian" class="header-bg-img">
    <up-header :back="back" />
    <page-recovery-guardian-verify
      v-if="recoveryStore.the2FA.show"
      @back="recoveryStore.the2FA.show = false"
      @token="getToken"
    />
    <div class="main-container" v-else>
      <h2>{{ $t('RecoveryGuardianTitle') }}</h2>
      <div class="send-box">
        <img class="send" src="@/assets/img/recovery/send.png" />
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <img class="receive" src="@/assets/img/recovery/receive.png" />
      </div>
      <template v-if="form.guardians.length > 1">
        <div class="progress-box">
          <div class="tip-box">
            <!-- {{ progress }}<span>/100</span> -->
            <div class="tip">{{ $t('CurrentProgress') }}</div>
            <div
              v-show="progress < 100"
              class="progress wait-48h"
              :class="{ active: progress >= 60 }"
            >
              <div class="box">{{ $t('Recovery48Hours') }}</div>
            </div>
            <div class="progress right-now" :class="{ active: progress >= 100 }">
              <div class="box">{{ $t('RestoreNow') }}</div>
            </div>
          </div>
          <div class="line">
            <div class="now" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
        <h4>
          {{ $t('recoveryGuardianTip') }}
        </h4>
      </template>
      <h4 v-else>{{ $t('RecoveryGuardianSubtitle') }}</h4>
      <div class="recovery-emails">
        <!-- <button @click="toOAuthSign">{{ registerEmail }}</button> -->
        <div class="email-box" v-for="(guardian, i) in form.guardians" :key="i">
          <div class="top">
            <div class="info">
              <div class="title">
                <span>
                  {{ registerEmail === guardian.email ? $t('OwnEmail') : $t('Guardian') + i }}
                </span>
                <!-- <div class="score">{{ guardian.weight }}</div> -->
              </div>
              <div class="email">{{ guardian.email }}</div>
            </div>
            <el-button
              v-if="guardian.type === 'openId'"
              type="primary"
              :loading="guardian.countDown > 0 || guardian.disbaled"
              @click="recoveryStore.oauth_provider === 0 ? googleAuthVerify() : auth0Verify()"
              class="btn"
            >
              <span>{{
                recoveryStore.oauth_provider === 0 ? $t('Verify') : $t('FetchEmailCode')
              }}</span>
            </el-button>
            <el-button
              v-else-if="guardian.type === 'send'"
              type="primary"
              :loading="guardian.countDown > 0 || guardian.disbaled"
              @click="sendEmail(i)"
              class="btn"
            >
              <span>{{ $t('Send') }}</span>
            </el-button>
            <div v-else-if="guardian.type === 'pending'" class="btn pending">
              <el-button
                type="primary"
                @click="sendEmail(i)"
                :loading="guardian.countDown > 0 || guardian.disbaled"
              >
                <template v-if="guardian.countDown > 0">{{ guardian.countDown }}s</template>
                <template v-else>{{ $t('Resend') }}</template>
              </el-button>
            </div>
            <div v-else-if="guardian.type === 'success'" class="btn success">
              <up-icon name="correct" />
              <span>{{ $t('Finish') }}</span>
            </div>
          </div>
          <div class="bottom" v-if="guardian.type === 'pending'">
            <div>{{ $t('WaitingRecoveryEmail') }}</div>
            <div class="right">{{ $t('Verifying') }}</div>
          </div>
        </div>
        <div
          class="email-box"
          v-if="form.guardians.length === 1 && recoveryStore.the2FA.verify !== ''"
        >
          <div class="top">
            <div class="info">
              <div class="title">
                <span>{{ $t('SafetyVerification') }}</span>
                <!-- <div class="score">40</div> -->
              </div>
              <div class="email">{{ $t('To2faVerification') }}</div>
            </div>
            <el-button
              v-if="recoveryStore.the2FA.verify === 'need'"
              type="primary"
              @click="recoveryStore.the2FA.show = true"
              class="btn"
            >
              <span>{{ $t('Verify') }}</span>
            </el-button>
            <div class="btn success" v-if="recoveryStore.the2FA.verify === 'success'">
              <up-icon name="correct" />
              <span>{{ $t('Finish') }}</span>
            </div>
          </div>
        </div>
        <div class="submit">
          <up-button
            type="primary"
            @click="startRecovery"
            :loading="form.loading"
            :disabled="
              form.guardians.length === 1 && recoveryStore.the2FA.verify !== ''
                ? progress < 100
                : progress < 60
            "
          >
            {{ $t('Submit') }}
          </up-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRecoveryGuardian } from '@/composable/useRecovery'
import router from '@/plugins/router'
import { AuthType } from '@/service/backend'

const {
  sendEmail,
  form,
  registerEmail,
  startRecovery,
  progress,
  googleAuthVerify,
  auth0Verify,
  recoveryStore,
} = useRecoveryGuardian()

const getToken = (token: string, type: AuthType) => {
  recoveryStore.the2FA.type = type
  recoveryStore.the2FA.token = token
  recoveryStore.the2FA.show = false
  recoveryStore.the2FA.verify = 'success'
}

const back = () => router.replace('/login')
</script>

<style lang="scss">
#page-recovery-guardian {
  .main-container {
    h2 {
      margin-top: 40px;
    }
    .send-box {
      margin: 40px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      .send,
      .receive {
        width: 60px;
        height: 60px;
      }
      .dots {
        display: flex;
        margin: 0 37px;

        .dot {
          border-radius: 50%;
          width: 4px;
          height: 4px;
          background: var(--up-line);
        }
        .dot + .dot {
          margin-left: 12px;
        }
      }
    }

    .progress-box {
      padding-top: 8px;
      position: relative;
      text-align: left;

      .tip-box {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        .tip {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          margin-right: 4px;
          max-width: 33.3%;
          span {
            color: var(--up-text-third);
          }
        }
        .progress {
          text-align: center;
          padding: 4px 12px;
          border-radius: 12px;
          background: var(--up-bg-solid);
          font-size: 12px;
          font-weight: 400;
          line-height: 20px;
          & + .progress {
            margin-left: 12px;
          }

          &.wait-48h {
            left: 42%;
            max-width: 33.3%;
          }
          &.right-now {
            right: 0;
            max-width: 33.3%;
          }
          .box {
            position: relative;
            &::before {
              position: absolute;
              bottom: -15px;
              left: calc(50% - 6px);
              content: '';
              width: 0px;
              height: 6px;
              border: 6px solid;
              border-color: var(--up-bg-solid) transparent transparent transparent;
            }
          }
          &.active {
            background: var(--up-primary);
            .box {
              color: #fff;
              &::before {
                border-color: var(--up-primary) transparent transparent transparent;
              }
            }
          }
        }
      }
      .line {
        margin-top: 10px;
        width: 100%;
        height: 8px;
        background: var(--up-bg-checked);
        border-radius: 4px;
        overflow: hidden;
        .now {
          min-width: 6px;
          height: 100%;
          background: var(--up-primary);
          border-radius: 4px;
        }
      }
    }
    .recovery-emails {
      margin-top: 40px;
      .email-box {
        backdrop-filter: blur(8px);
        border-radius: 12px;
        overflow: hidden;
        background: var(--up-bg);
        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          padding-bottom: 20px;
          text-align: left;
          .info {
            font-size: 14px;
            font-weight: 400;
            .title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;

              display: flex;
              align-items: center;

              .score {
                user-select: none;
                margin-left: 8px;
                padding: 0 13px;
                background: rgba(173, 148, 255, 0.16);
                border-radius: 10px;
                border: 1px solid var(--up-secondary);
                font-size: 12px;
                font-weight: 400;
                color: var(--up-secondary);
                line-height: 20px;
              }
            }
            .email {
              color: var(--up-text-secondary);
            }
          }
          .btn {
            min-width: 68px;
            text-align: center;
            display: flex;
            align-items: center;
            .iconpark {
              font-size: 16px;
              margin-right: 4px;
            }
          }
          .btn.success {
            font-weight: 600;
            color: var(--up-green);
          }
        }
        .bottom {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--up-bg);

          font-size: 14px;
          font-weight: 400;
          color: var(--up-text-third);
          text-align: left;
          .right {
            font-weight: 600;
            white-space: nowrap;
            margin-left: 30px;
          }
        }
      }
      .email-box + .email-box {
        margin-top: 20px;
      }
    }
    .submit {
      margin-top: 40px;
    }
  }
}
</style>
