import { ElMessageBox } from 'element-plus'
import i18n from '@/plugins/i18n'
import { OAuthCallBack } from '@/utils/oauth/check_up_sign_token'

const { t: $t } = i18n.global

export const handleWrongAccount = (email: string, cb: OAuthCallBack) => {
  ElMessageBox.confirm($t('GoogleTip', { data: email }), $t('GoogleTitle'), {
    dangerouslyUseHTMLString: true,
    confirmButtonText: $t('TryAgain'),
    cancelButtonText: $t('Cancel'),
  })
    .then(cb)
    .catch(() => {})
}
