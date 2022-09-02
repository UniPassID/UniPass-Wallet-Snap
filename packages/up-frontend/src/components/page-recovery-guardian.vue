<template>
  <div class="page-recovery-guardian">
    <up-header :back="() => $emit('back')" />
    <br />
    <h2>{{ $t('RecoveryGuardianTitle') }}</h2>
    <h4>{{ $t('RecoveryGuardianSubtitle') }}</h4>
    <br />
    <div class="recovery-emails">
      <div class="email" v-for="(guardian, i) in form.guardians" :key="i">
        <div class="info">
          <div class="title">
            {{ registerEmail === guardian.email ? $t('OwnEmail') : $t('guardianEmail') }}
          </div>
          <div>{{ guardian.email }}</div>
        </div>
        <up-button
          v-if="guardian.type === 'send'"
          type="primary"
          :loading="guardian.countDown > 0 || guardian.disbaled"
          @click="sendEmail(i)"
          class="btn"
        >
          <span>{{ $t('sendRecoveryEmail') }}</span>
        </up-button>
        <div v-else-if="guardian.type === 'pending'" class="btn pending">
          <span>{{ $t('SendAgain') }}</span>
          <up-button
            type="primary"
            @click="sendEmail(i)"
            :loading="guardian.countDown > 0 || guardian.disbaled"
          >
            <template v-if="guardian.countDown > 0">{{ guardian.countDown }}s</template>
            <template v-else>{{ $t('Resend') }}</template>
          </up-button>
        </div>
        <div v-else-if="guardian.type === 'success'" class="btn success">
          {{ $t('ForwardSuccess') }}
        </div>
      </div>
    </div>
    <br />
    <template v-if="form.guardians.filter((guardian) => guardian.status >= 1).length >= 2">
      <el-button loading size="large" link></el-button>
      <div>{{ $t('Recovering') }}</div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useRecoveryGuardian } from '@/composable/useRecovery'

const { sendEmail, form, registerEmail } = useRecoveryGuardian()
</script>

<style lang="scss">
.page-recovery-guardian {
  .recovery-emails {
    .email {
      border: 1px solid #eee;
      border-radius: 14px;
      padding: 20px 10px;
      .info {
        text-align: left;
        .title {
          color: var(--el-color-primary);
        }
      }
      .btn {
        margin-top: 14px;
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
        padding-left: 12px;
        padding-right: 6px;
        text-align: left;

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
    .email + .email {
      margin-top: 22px;
    }
  }
}
</style>
