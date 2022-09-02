<template>
  <div class="page-register-guardians">
    <up-header :back="() => $emit('back')" />
    <br />
    <h2>{{ $t('RegisterGuardianTitle') }}</h2>
    <h4>{{ $t('RegisterGuardianSubtitle') }}</h4>
    <br />
    <el-form @submit.prevent ref="formElement" label-position="top" :model="form.guardians">
      <div v-for="(guardian, i) in form.guardians" :key="i" class="guardian-box">
        <div class="guardian">
          <div class="top">
            <div class="title">{{ $t('Guardian') }} {{ i + 1 }}</div>
            <up-icon class="del" name="del" @click="deleteGuardian(i)"></up-icon>
          </div>
          <br />
          <el-form-item
            :prop="`${i}.recoveryEmail`"
            :rules="[
              { validator: unipass.checkEmailFormat, trigger: 'blur' },
              { validator: checkGuardianRepeatability, trigger: 'blur' },
            ]"
          >
            <template #label>
              <span>{{ $t('EmailEnter') }}</span>
              <a type="primary" @click="userStore.showSupportEmail = true">
                {{ $t('SupportedMails') }}
              </a>
            </template>
            <el-input
              @input="(v) => (form.guardians[i].recoveryEmail = unipass.formatEmail(v))"
              @blur="unipass.formatEmail(form.guardians[i].recoveryEmail, true)"
              :disabled="guardian.type !== 'send' || guardian.loading"
              v-model="form.guardians[i].recoveryEmail"
              clearable
              @keyup.enter="fetchGuardianEmail(i)"
            />
          </el-form-item>
          <up-button
            v-if="guardian.type === 'send'"
            type="primary"
            :loading="guardian.loading"
            @click="fetchGuardianEmail(i)"
            class="btn"
          >
            <span>{{ $t('SendInvitationLink') }}</span>
          </up-button>
          <div v-else-if="guardian.type === 'success'" class="btn success">
            {{ $t('InvitedSuccess') }}
          </div>
          <div v-else-if="guardian.type === 'pending'" class="btn pending">
            <span>{{ $t('WaitingForApproval') }}</span>
            <up-button
              type="primary"
              @click="fetchGuardianEmail(i)"
              :loading="guardian.countDown > 0"
            >
              <template v-if="guardian.countDown > 0"> {{ guardian.countDown }}s </template>
              <template v-else>{{ $t('Resend') }}</template>
            </up-button>
          </div>
        </div>
        <div class="line"></div>
      </div>
      <br />
      <up-button class="guardian-add" v-if="form.guardians.length < 4" @click="addGuardian">
        {{ $t('AddGuardian') }}
      </up-button>
    </el-form>
    <br />
    <up-button
      type="primary"
      :loading="form.loading"
      :disabled="
        form.guardians.length === 0 ||
        !(form.guardians.findIndex((guardian) => !guardian.verified) === -1)
      "
      @click="submitGuardians"
    >
      {{ $t('Submit') }}
    </up-button>
  </div>
</template>

<script lang="ts" setup>
import { useRegisterGuardian } from '@/composable/useRegisterGuardian'
import { useUniPass } from '@/utils/useUniPass'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const unipass = useUniPass()

interface Emits {
  (event: 'back'): void
}

const $emit = defineEmits<Emits>()

const {
  form,
  formElement,
  // guardian
  addGuardian,
  deleteGuardian,
  fetchGuardianEmail,
  submitGuardians,
  // check
  checkGuardianRepeatability,
} = useRegisterGuardian()
</script>

<style lang="scss">
.page-register-guardians {
  text-align: left;
  .guardian-box {
    .guardian {
      padding: 24px 0;
      .top {
        display: flex;
        justify-content: space-between;
        width: 100%;
        .icon-del {
          cursor: pointer;
        }
      }
      .btn {
        width: 100%;
        height: 52px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #ffffff;
      }
      .btn.success {
        background: rgba(19, 162, 88, 0.68);
      }
      .btn.pending {
        justify-content: space-between;
        background: rgba(136, 100, 255, 0.2);
        padding-left: 20px;
        padding-right: 6px;

        span {
          width: 180px;
          font-size: 14px;
        }

        .el-button {
          width: 88px;
          height: 36px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          line-height: 14px;
        }
      }
    }

    .line {
      width: calc(100% + 48px);
      margin: 0 -24px;
      height: 10px;
      background: var(--el-fill-color);
    }
  }
  .guardian-add {
    margin: 0 auto;
    margin-top: 12px;
    display: block;
  }
}
</style>
