<template>
  <div id="page-setting-guardian" class="header-bg-img">
    <up-header :title="$t('SetGuardians')" :back="back" />
    <div class="main-container">
      <div class="guardian-title">
        <div class="subtitle">{{ $t('SettingGuardianSubtitle') }}</div>
        <div
          v-if="form.guardians.filter((e) => e.added).length > 0"
          class="delete-btn"
          @click="deleteGuardian"
        >
          {{ form.isDelete ? $t('Cancel') : $t('Delete') }}
        </div>
      </div>
      <el-checkbox-group v-model="deleteChecked">
        <div class="guardian-one">
          <div class="top">
            <div class="name">{{ $t('RegisterAccount') }}</div>
            <!-- <div class="score">60</div> -->
          </div>
          <div class="email">{{ userStore.accountInfo.email }}</div>
        </div>
        <el-checkbox
          v-for="(guardian, i) in form.guardians"
          :key="guardian.recoveryEmail"
          :label="guardian.recoveryEmail"
        >
          <div class="guardian-one">
            <div class="top">
              <div class="name">{{ $t('Guardian') }} {{ i + 1 }}</div>
              <template v-if="!guardian.added">
                <div v-if="guardian.type === 'success'" class="success">
                  <up-icon name="correct" />
                  <span>{{ $t('Finish') }}</span>
                </div>
                <div v-else class="waiting">
                  <up-icon name="loading" class="is-loading" />
                  <span>{{ $t('Waiting') }}</span>
                </div>
                <up-icon name="close" class="close" @click="closeGuardian(i)"></up-icon>
              </template>
              <!-- <div v-else class="score">40</div> -->
            </div>
            <el-form v-if="!guardian.added" class="email-box">
              <up-form-item :label="$t('Email')">
                <up-input :value="guardian.recoveryEmail" readonly>
                  <template #suffix v-if="guardian.type !== 'success'">
                    <el-button
                      class="send-code"
                      :loading="guardian.loading"
                      :disabled="guardian.count > 0 || guardian.loading"
                      link
                      @click="sendLink(i)"
                    >
                      <!-- TODO reSendInvitationLink 有问题 -->
                      <template v-if="guardian.count > 0">{{ guardian.count }}s</template>
                      <template v-else>{{ $t('SendInvitationLink') }}</template>
                    </el-button>
                  </template>
                </up-input>
              </up-form-item>
            </el-form>
            <div v-else class="email">{{ guardian.recoveryEmail }}</div>
            <div v-if="guardian.added && form.isDelete" class="delete-box">
              <div class="check">
                <img class="dot" src="@/assets/img/check.svg" />
              </div>
            </div>
          </div>
        </el-checkbox>
      </el-checkbox-group>

      <div class="bottom-box" v-if="form.isDelete">
        <up-button type="primary" :disabled="deleteChecked.length <= 0" @click="submit('delete')">
          {{ $t('Delete') }} {{ deleteChecked.length ? `(${deleteChecked.length})` : '' }}
        </up-button>
      </div>
      <div class="bottom-box edit" v-else>
        <up-button type="info" @click="addGuardian">{{ $t('Add') }}</up-button>
        <up-button type="primary" v-show="!submitDisabled" @click="submit('add')">
          {{ $t('Submit') }}
        </up-button>
      </div>
    </div>

    <up-confirm
      :title="$t('AddGuardian')"
      v-model="form.show"
      destroy-on-close
      @closed="addGuardianClose"
    >
      <el-form @submit.prevent ref="formElement" :model="form">
        <up-form-item
          :label="form.email && $t('Email')"
          prop="email"
          :rules="[{ validator: unipass.checkDkimEmailFormat, trigger: 'blur' }]"
        >
          <up-input
            @input="(v: string) => (form.email = unipass.formatEmail(v))"
            clearable
            v-model="form.email"
            :placeholder="$t('EmailEmpty')"
            :disabled="form.loading"
            @keydown.enter="form.email && sendLink(-1)"
          />
        </up-form-item>
      </el-form>

      <template #footer>
        <up-button
          type="primary"
          :disabled="!form.email"
          :loading="form.loading"
          @click="sendLink(-1)"
        >
          {{ $t('SendInvitationLink') }}
        </up-button>
      </template>
    </up-confirm>
    <up-confirm
      :title="$t('SecurityVerification')"
      v-model="auth.show"
      destroy-on-close
      @closed="auth.password = ''"
    >
      <div class="el-dialog__subtitle">
        {{ auth.type === 'delete' ? $t('EnterPasswordConfirmDel') : $t('EnterPasswordConfirmAdd') }}
      </div>

      <el-form @submit.prevent ref="authElement" :model="auth">
        <up-form-item :label="auth.password && $t('Password')" prop="password">
          <up-input
            @input="(v: string) => (auth.password = unipass.formatPassword(v))"
            v-model="auth.password"
            :placeholder="$t('EnterPassword')"
            :disabled="auth.loading"
            @keydown.enter="auth.password && authentication()"
            show-password
            clearable
          />
        </up-form-item>
      </el-form>
      <template #footer>
        <up-button
          type="primary"
          :disabled="!auth.password"
          :loading="auth.loading"
          @click="authentication"
        >
          {{ $t('Confirm') }}
        </up-button>
      </template>
    </up-confirm>
  </div>
</template>

<script lang="ts" setup>
import { useGuardian } from '@/composable/useGuardian'
import { checkUpSignTokenForSetGuardian } from '@/utils/oauth/check_up_sign_token'

const deleteGuardian = async () => {
  const needOAuth = await checkUpSignTokenForSetGuardian()
  if (!needOAuth) {
    form.isDelete = !form.isDelete
    deleteChecked.value = []
  }
}

const addGuardian = async () => {
  const needOAuth = await checkUpSignTokenForSetGuardian()
  if (!needOAuth) {
    form.show = true
  }
}

const addGuardianClose = () => {
  form.email = ''
  form.showEmailTip = false
}

const {
  back,
  sendLink,
  authentication,
  deleteChecked,
  submitDisabled,
  submit,
  formElement,
  authElement,
  unipass,
  form,
  auth,
  userStore,
  closeGuardian,
} = useGuardian()
</script>

<style lang="scss">
#page-setting-guardian {
  position: relative;

  .delete-btn {
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    color: var(--up-text-secondary);
    line-height: 20px;
  }

  .guardian-title {
    margin-top: 23px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subtitle {
    font-size: 14px;
    font-weight: 400;
    color: var(--up-text-third);
    line-height: 20px;
    text-align: left;
    hyphens: auto;
  }
  .guardian-one {
    margin-top: 20px;
    background: var(--up-bg);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    padding: 16px 20px;
    padding-bottom: 20px;
    text-align: left;
    position: relative;

    .top {
      display: flex;
      .name {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
        color: var(--up-text-primary);
      }
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
      .waiting,
      .success {
        margin-left: 12px;
        color: var(--up-text-third);
        display: flex;
        align-items: center;
        span {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          margin-left: 4px;
        }
      }
      .icon-close {
        cursor: pointer;
        font-size: 16px;
        color: var(--up-text-primary);
        opacity: 0.6;
        padding: 4px;
        margin-left: auto;
      }
      .success {
        color: var(--up-green);
      }
    }
    .email {
      margin-top: 8px;
      font-size: 14px;
      font-weight: 400;
      color: var(--up-text-third);
      line-height: 20px;
    }
    .email-box {
      margin-top: 24px;
      margin-bottom: 4px;
    }
    .delete-box {
      position: absolute;
      top: 0;
      right: 20px;
      bottom: 0;
      height: 100%;
      display: flex;
      align-items: center;
      .check {
        margin-left: auto;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        border: 1px solid var(--up-line);
        display: flex;
        justify-content: center;
        align-items: center;
        .dot {
          display: none;
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .bottom-box {
    margin-top: 40px;
    display: flex;
  }

  .el-checkbox-group {
    padding-top: 8px;
    .el-checkbox {
      margin-right: 0;
      display: block;
      height: auto;
      width: 100%;
      &.is-checked {
        .delete-box {
          .check {
            border-color: #8864ff;
            background: #8864ff;
            .dot {
              display: block;
            }
          }
        }
      }
      .el-checkbox__label {
        padding: 0;
        width: 100%;
      }
      .el-checkbox__input {
        display: none;
      }
    }
  }
}
</style>
