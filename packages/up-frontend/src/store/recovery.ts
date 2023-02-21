import jwt_decode from 'jwt-decode'
import { AccountInfo } from '@/store/oauth_login'
import { Keyset, KeyOpenIDWithEmail } from '@unipasswallet/keys'
import api, { AuditStatus, AuthType, SignType } from '@/service/backend'
import blockchain, { genUnipassWalletContext } from '@/service/blockchain'
import { addSignCapabilityToKeyset, updateKeyset } from '@/utils/rbac'
import { Wallet, RawMainExecuteCall, MainExecuteTransaction } from '@unipasswallet/wallet'
import { CancelLockKeysetHashTxBuilder } from '@unipasswallet/transaction-builders'
import { useUserStore } from './user'
import { RpcRelayer } from '@unipasswallet/relayer'
import { sdkConfig } from '@/service/chains-config'
import { getOAuthUserInfo } from './storages'
import { IdTokenParams, OAuthProvider } from '@/utils/oauth/parse_hash'
import { ElMessageBox } from 'element-plus'
import i18n from '@/plugins/i18n'
import DB from './index_db'
import { clearUpSignToken } from '@/utils/oauth/check_up_sign_token'
import { signMsgWithMM, getMasterKeyAddress } from '@/service/snap-rpc'
import { prepareSignMessage } from '@/utils/string-utils'

const { t: $t } = i18n.global

export const useRecoveryStore = defineStore({
  id: 'recovery',
  state: () => {
    return {
      email: '',
      token: '',
      password: '',
      confirmPassword: '',
      step: 1,
      oauthSignToken: '',
      oauth_provider: OAuthProvider.GOOGLE,
      loading: false,
      canSendStartRecoveryTx: false,
      isHaveTimeLock: false,
      verificationEmailHashs: [] as string[],
      the2FA: {
        token: '',
        type: 0 as AuthType,
        show: false,
        verify: '',
      },
    }
  },
  actions: {
    async restoreFromOAuthSign(oauthFromState: string, idToken: string) {
      const userStore = useUserStore()
      const state = JSON.parse(oauthFromState)
      this.$state = state
      const account_info = await DB.getAccountInfo()
      if (!account_info) return
      await userStore.update(account_info)
      const { sub: newSub } = jwt_decode<IdTokenParams>(idToken)
      if (newSub !== getOAuthUserInfo()?.sub) {
        this.oauthSignToken = idToken
        ElMessageBox.confirm($t('GoogleTip', { data: account_info.email }), $t('GoogleTitle'), {
          dangerouslyUseHTMLString: true,
          confirmButtonText: $t('TryAgain'),
          cancelButtonText: $t('Cancel'),
        })
          .then(() => {
            // todo try again
          })
          .catch(() => {})
        return
      }
      this.oauthSignToken = idToken
      const { keyset } = account_info
      const _keyset = Keyset.fromJson(keyset.keysetJson)
      const emailOptionsOrEmailHash = (_keyset.keys[1] as KeyOpenIDWithEmail)
        .emailOptionsOrEmailHash
      const registerEmailHash =
        typeof emailOptionsOrEmailHash === 'string'
          ? emailOptionsOrEmailHash
          : emailOptionsOrEmailHash.emailHash
      this.verificationEmailHashs.push(registerEmailHash)
      const res = await api.sendRecoveryOAuthSig({
        verificationEmailHash: registerEmailHash,
        newMasterKeyAddress: keyset.masterKeyAddress,
        idToken,
      })
      if (res.ok) {
        console.log('success')
        // TODO set register email status
      }
    },
    async uploadCloudKey() {
      const oauthUserInfo = getOAuthUserInfo()
      if (!oauthUserInfo || !oauthUserInfo.unipass_info) return
      const { id_token, expires_at, oauth_provider, unipass_info } = oauthUserInfo
      const { keyset, address } = unipass_info
      const decoded = jwt_decode<IdTokenParams>(id_token)

      const { email } = decoded

      this.email = email

      const masterKeyAddress = await getMasterKeyAddress(email)
      const newKeyset = updateKeyset(keyset, masterKeyAddress)
      const message = prepareSignMessage('recovery', masterKeyAddress)
      const sig = await signMsgWithMM(message, masterKeyAddress, email)

      const resToken = await api.uploadRecoveryMasterKey({
        masterKey: {
          masterKeyAddress,
          keyType: 1,
          keySig: {
            sig,
            message: message,
          },
        },
      })
      if (!resToken.ok) {
        return
      }

      const user: AccountInfo = {
        email: this.email,
        id_token,
        address,
        oauth_provider,
        expires_at,
        keyset: {
          hash: newKeyset.hash(),
          masterKeyAddress,
          keysetJson: newKeyset.obscure().toJson(),
        },
      }
      const userStore = useUserStore()
      await userStore.update(user)
      this.step = 2
    },
    async sendCancelRecovery() {
      const accountInfo = await DB.getAccountInfo()
      if (!accountInfo) return
      const { email, address, keyset: _keyset } = accountInfo
      const metaNonce = await blockchain.getMetaNonce(address)
      const txBuilder = new CancelLockKeysetHashTxBuilder(address, metaNonce, false, '0x')
      const digestHash = txBuilder.digestMessage()
      const content = txBuilder.build()

      const auditRes = await api.audit({
        type: SignType.PersonalSign,
        content,
        msg: digestHash,
      })

      if (auditRes.ok) {
        clearUpSignToken()
      }

      if (auditRes.ok && auditRes.data.approveStatus === AuditStatus.Approved) {
        const signature = await signMsgWithMM(digestHash, _keyset.masterKeyAddress, email)
        const keyset = await addSignCapabilityToKeyset(_keyset.keysetJson, () =>
          Promise.resolve(signature),
        )
        const relayer = new RpcRelayer(
          sdkConfig.urlConfig.relayer.polygon,
          genUnipassWalletContext(),
          blockchain.getProvider(),
        )
        const keyWallet = new Wallet({
          address,
          keyset,
          provider: blockchain.getProvider(),
          relayer: relayer,
        })
        const nonce = await keyWallet.getNonce()
        const { chainId } = await blockchain.getProvider().getNetwork()

        const tx = (await txBuilder.generateSignature(keyWallet, [0])).build()

        const rawExecuteCall = new RawMainExecuteCall(tx, nonce, [])
        const { execute } = await keyWallet.signRawMainExecuteCall(rawExecuteCall, chainId, nonce)
        const { callType, gasLimit, target, data } = new MainExecuteTransaction({
          executeCall: execute,
          target: keyWallet.address,
        }).toTransaction()
        const cancelResData = await api.cancelRecovery({
          email,
          metaNonce,
          signature: txBuilder.signature,
          transaction: {
            callType: callType,
            gasLimit: gasLimit.toHexString(),
            target: target,
            value: gasLimit.toHexString(),
            data: data,
          },
        })
        return cancelResData.ok
      }

      return false
    },
  },
})
