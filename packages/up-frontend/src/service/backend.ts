import { upError } from './../utils/useUniPass'
import router from '@/plugins/router'
import { getOAuthUserInfo } from '@/store/storages'
// https://d.api.unipass.id/wallet/documentation/
import Axios, { AxiosRequestConfig } from 'axios'
import { initResponse } from '@/service/backend-error'
import { CallType } from '@unipasswallet/transactions'
import { BytesLike } from 'ethers'
import { sdkConfig } from '@/service/chains-config'
import { Transaction } from '@unipasswallet/transactions'
import { upGA } from '@/utils/useUniPass'
import { getUpSignToken } from '@/utils/oauth/check_up_sign_token'
import i18n from '@/plugins/i18n'
import { OAuthProvider } from '@/utils/oauth/parse_hash'

const { t: $t } = i18n.global

const axios = Axios.create({
  baseURL: sdkConfig.urlConfig.backend,
  // timeout: 25000,
  // headers: {},
})

declare module 'axios' {
  interface AxiosResponse {
    ok: boolean
    statusCode: number
    // message?: string | any[]
    // error?: string
  }
}

// interceptors https://axios-http.com/zh/docs/interceptors
axios.interceptors.request.use(
  function (config) {
    try {
      const oauthUserInfo = getOAuthUserInfo()
      if (oauthUserInfo?.authorization) {
        config.headers = {
          ...config?.headers,
          Authorization: `Bearer ${oauthUserInfo?.authorization}`,
        }
      }
    } catch (e) {
      //
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)
axios.interceptors.response.use(
  function (response) {
    return initResponse(response)
  },
  function (error) {
    return initResponse(error.response)
  },
)

// sync
export interface GetSyncStatusInput {
  email: string
  authChainNode: string
}

// 0=synced,1:server synced, 2:not received sync email, 3:not synced
export enum SyncStatusEnum {
  Synced,
  ServerSynced,
  NotReceived,
  NotSynced,
}

export interface GetSyncStatusOutput extends ApiResponse {
  data: {
    syncStatus: SyncStatusEnum
  }
}

// interface
export interface ApiResponse {
  ok: boolean
  statusCode: number
  // message?: string | any[]
  // error?: string
}
export type OtpAction =
  | 'bindPhone'
  | 'signUp'
  | 'signIn'
  | 'sendGuardian'
  | 'sendRecoveryEmail'
  | 'startRecoveryEmail'
  | 'passwordLogin'
  | 'auth2Fa'
  | 'tssGenerate'
  | 'tssSign'

// Send Otp Code
export interface SendOtpCodeInput {
  email: string
  action: OtpAction
  bindPhone?: {
    phone: string
    areaCode: string
  }
  authType: AuthType
}

// Verify Otp Code
export interface VerifyOtpCodeInput {
  email: string
  action: OtpAction
  code: string
  authType: AuthType
}

export interface AuthToken {
  accessToken: string
  provider: number
}

export interface AuthTokenOutput extends ApiResponse {
  data: {
    authorization: string
    isRegistered: boolean
    provider: OAuthProvider
    unipassInfo?: {
      keyset: string
      address: string
      keystore: string
    }
    upSignToken: string
  }
}

export interface VerifyOtpCodeOutput extends ApiResponse {
  data: {
    upAuthToken: string
  }
}

// register Get Guardian Token
export interface GetGuardianTokenOutput extends ApiResponse {
  data: [
    {
      verified: boolean
      email: string
    },
  ]
}

export interface GuardianData {
  email: string
  emailHash: string
  pepper: string
  isSelfGuardian: boolean
  rawOrHash: 'Raw' | 'Hash'
}

// register Account
export interface SignUpAccountInput {
  keysetJson: string
  masterKey: {
    masterKeyAddress: string
    keyType: number
    keySig: {
      timestamp: number
      sig: string
    }
  }
  pepper: string
  source: string
}
export interface SignUpAccountOutput extends ApiResponse {
  data: {
    address: string
    keysetHash: string
    authorization: string
    upSignToken: string
  }
}

// login
export interface GetPasswordTokenInput {
  // register email
  email: string
  kdfPassword: string
  // google captchaToken
  captchaToken: string
}
// login check password
export interface PasswordTokenOutput extends ApiResponse {
  data: {
    address: string
    pending: boolean
    upAuthToken: string
    showCaptcha: boolean
  }
}
// login get keystore
export interface LoginInput {
  email: string
  upAuthToken: string
  auth2FaToken: Auth2FaCodeToken[]
}
export interface LoginOutput extends ApiResponse {
  data: {
    address: string
    keystore: string
    localKeyAddress: string
    upAuthToken: string
  }
}
export interface SessionKeyPermit {
  timestamp: number
  timestampNow: number
  permit: string
  sessionKeyAddress: string
  sig: string
  weight: number
}
// login get keyset
export interface QueryAccountKeysetInput {
  email: string
  upAuthToken: string
  sessionKeyPermit: SessionKeyPermit | Record<string, never>
}
export interface QueryAccountKeysetOutput extends ApiResponse {
  data: {
    masterKeyAddress: string
    accountAddress: string
    keyset: string
  }
}
// recovery

export interface UploadRecoveryCloudKeyInput {
  masterKey: {
    masterKeyAddress: string
    keyType: number
    keySig: {
      sig: string
      timestamp: number
    }
  }
}

export interface SendRecoveryEmailInput {
  email: string
  verificationEmailHash: string
  newMasterKeyAddress: string
}

export interface StartRecoveryInput {
  email: string
  verificationEmailHashs: string[]
  auth2FaToken:
    | [
        {
          type: AuthType
          upAuthToken: string
        },
      ]
    | undefined
}
export interface QueryRecoveryOutput extends ApiResponse {
  data: {
    emailHash: string
    status: number
    transactionHash: string
  }[]
}
export interface SendGuardianLinkInput {
  email: string
  registerEmail: string
}
export interface SuffixesOutput extends ApiResponse {
  data: {
    suffixes: string[]
    policyKeysetJson: string
  }
}
export interface CancelRecoveryInput {
  email: string
  metaNonce: number
  signature: string
  transaction: {
    callType: CallType
    gasLimit: string
    target: BytesLike
    value: string
    data: BytesLike
  }
}
export interface OnRampUrlOutput extends ApiResponse {
  data: {
    url: string
  }
}
export interface TransactionHashOutput extends ApiResponse {
  data: {
    transactionHash: string
  }
}
export interface queryAccountKeystoreInput {
  email: string
  kdfPassword: string
  captchaToken: string
  sessionKeyPermit: SessionKeyPermit
}
export interface queryAccountKeystoreOutput extends ApiResponse {
  data: {
    address: string
    keystore: string
    showCaptcha: string
    localKeyAddress: string
    upAuthToken: string
  }
}
export interface checkProviderOutput extends ApiResponse {
  data: {
    provider: OAuthProvider
  }
}
//--- tss input output ----
export interface StartKeyGenInput {
  email: string
  action: string
}
export interface KeygenData {
  userId: string
  sessionId: string
  msg: any
}
export interface TssOutput extends ApiResponse {
  data: {
    tssRes: KeygenData
  }
}
export interface KeyGenInput {
  email: string
  sessionId: string
  tssMsg: any
  action: string
}
export interface FinishKeygenInput {
  email: string
  sessionId: string
  userId: string
  localKeyAddress: string
  action: string
}
export interface StartSignInput {
  localKeyAddress: string
  tssMsg: any
  value: string
}
export interface SignInput {
  sessionId: string
  tssMsg: any
  value: string
}

export enum SignType {
  PersonalSign = 0,
  EIP712Sign,
  Transaction,
}

export interface AuditInput {
  type: SignType
  content: Transaction | string
  msg: string
}

export enum AuditStatus {
  Approved = 0,
  Rejected,
  Confirming,
}

export interface AuditOutput extends ApiResponse {
  data: {
    approveStatus: AuditStatus
  }
}

export interface SignTokenInput {
  idToken: string
  duration: number
}

export interface SignTokenOutput extends ApiResponse {
  data: {
    authorization: string
    upSignToken: string
  }
}

// 2FA
// 0:Email | 1:Phone | 2:GoogleAuthenticator | 3:WebAuth
export type AuthType = 0 | 1 | 2 | 3

// export interface GetGoogleAuthenticatorQRCodeInput {}
export interface GetGoogleAuthenticatorQRCodeOutput extends ApiResponse {
  data: {
    qrPath: string
    secret: string
  }
}
export interface AddAuthenticatorInput {
  type: AuthType
  value: string
  code: string
}
export interface AddAuthenticatorOutput extends ApiResponse {
  data: {
    status: number // 0:close 1:open
    bind: boolean
  }
}
export interface AuthenticatorStatusInput {
  type: number
  status: number
}
export interface AuthenticatorStatusOutput extends ApiResponse {
  data: {
    status: number // 2fa status 0:close,1:open
  }
}
export interface DeleteAuthenticatorInput {
  email: string
  sessionKeyPermit: SessionKeyPermit
  type: AuthType
}
export interface DeleteAuthenticatorOutput extends ApiResponse {
  data: {
    bind: SessionKeyPermit
  }
}
export interface AuthenticatorListInput {
  email: string
  showAllStatus?: boolean
}

export interface RecoveryOAuthSigInput {
  verificationEmailHash: string
  newMasterKeyAddress: string
  idToken: string
}

export interface SyncOAuthSigInput {
  idToken: string
  duration: number
}

export interface AuthenticatorListOutput extends ApiResponse {
  data: {
    type: AuthType
    value: string
    status: number
  }[]
}
export interface Auth2FaCodeToken {
  type: AuthType
  upAuthToken: string
}

// update guardian
export interface CheckKeysetInput {
  keysetJson: string
  isAddGuradian: boolean
}
export interface UpdateGuardianInput {
  masterKeySig: string
}

//sync
export interface SendAuthEmailInput {
  email: string
  upAuthToken: string
  authChainNode: string
}
export interface GetTransactionInput {
  email: string
  sessionKeyPermit: SessionKeyPermit
  authChainNode: string
}
export interface GetTransactionOutput extends ApiResponse {
  data: {
    isNeedDeploy: boolean
    transactions: Transaction[]
  }
}

// dollar
export interface GetPriceConversionOutput extends ApiResponse {
  data: {
    [key: number]: {
      id: number
      symbol: string
      quote: {
        USD: {
          price: number
        }
      }
    }
  }
}

// get account tokens
export interface GetAccountTokensInput {
  address: string
  chainIds: number[]
}

// iToken
export interface APIERC20TokenInfo {
  contract_address: string
  name: string
  symbol: string
  decimals: string
  balance: string
}

export interface APIChainInfo {
  chainId: number
  balance: string
  data: APIERC20TokenInfo[]
}
export interface GetAccountTokensOutput extends ApiResponse {
  data: APIChainInfo[]
}

const request = (requestConfig: AxiosRequestConfig, polling = false) => {
  if (polling === false) {
    const { data } = requestConfig
    const email = data ? data.registerEmail || data.email || '' : ''
    upGA('backend_request', { url: requestConfig.url || '', email })
  }
  return axios(requestConfig)
}
// Request
const api = {
  getConfig(): Promise<SuffixesOutput> {
    return request({ method: 'get', url: '/api/v1/config' })
  },
  sendOtpCode(data: SendOtpCodeInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/otp/send', data })
  },
  verifyOtpCode(data: VerifyOtpCodeInput): Promise<VerifyOtpCodeOutput> {
    return request({ method: 'post', url: '/api/v1/otp/verify', data })
  },

  authToken(data: AuthToken): Promise<AuthTokenOutput> {
    return request({ method: 'post', url: '/api/v1/token/auth', data })
  },

  // register
  signUpAccount(data: SignUpAccountInput): Promise<SignUpAccountOutput> {
    return request({ method: 'post', url: '/api/v1/account/signup', data })
  },

  // login
  getPasswordToken(data: GetPasswordTokenInput): Promise<PasswordTokenOutput> {
    return request({ method: 'post', url: '/api/v1/account/password.token', data })
  },
  login(data: LoginInput): Promise<LoginOutput> {
    return request({ method: 'post', url: '/api/v1/account/signIn', data })
  },
  queryAccountKeyset(data: QueryAccountKeysetInput): Promise<QueryAccountKeysetOutput> {
    return request({ method: 'post', url: '/api/v1/account/keyset', data })
  },
  queryAccountKeystore(data: queryAccountKeystoreInput): Promise<queryAccountKeystoreOutput> {
    return request({ method: 'post', url: '/api/v1/account/keystore', data })
  },
  checkProvider(email: string): Promise<checkProviderOutput> {
    return request({ method: 'get', url: '/api/v1/email/provider.check', params: { email } })
  },

  // recovery
  uploadRecoveryMasterKey(data: UploadRecoveryCloudKeyInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/recovery/upload.key', data })
  },
  sendRecoveryEmail(data: SendRecoveryEmailInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/recovery/guardian.send.email', data })
  },

  startRecovery(data: StartRecoveryInput): Promise<QueryRecoveryOutput> {
    return request({
      method: 'post',
      url: '/api/v1/account/recovery/start',
      data,
    })
  },
  sendRecoveryStatus(email: string): Promise<QueryRecoveryOutput> {
    return request(
      { method: 'post', url: '/api/v1/account/recovery/guardian.email.status', data: { email } },
      true,
    )
  },
  cancelRecovery(data: CancelRecoveryInput): Promise<TransactionHashOutput> {
    return request({ method: 'post', url: '/api/v1/account/recovery/cancel', data })
  },
  // tss
  startKeygen(data: StartKeyGenInput): Promise<TssOutput> {
    return request({ method: 'post', url: '/api/v1/tss/keygen/start', data })
  },
  getKeygen(data: KeyGenInput): Promise<TssOutput> {
    return request({ method: 'post', url: '/api/v1/tss/keygen', data })
  },
  finishKeygen(data: FinishKeygenInput): Promise<TssOutput> {
    return request({ method: 'post', url: '/api/v1/tss/keygen/finish', data })
  },
  startSign(data: StartSignInput): Promise<TssOutput> {
    return request({ method: 'post', url: '/api/v1/tss/sign/start', data })
  },
  sign(data: SignInput): Promise<TssOutput> {
    return request({ method: 'post', url: '/api/v1/tss/sign', data })
  },
  async audit(data: AuditInput): Promise<AuditOutput> {
    const up_sign_token = getUpSignToken() || ''
    const res = await request({
      method: 'post',
      url: '/api/v1/tss/audit',
      data,
      headers: { 'up-sign-token': up_sign_token },
    })
    if (res.statusCode !== 200) {
      router.replace('/')
      upError($t('AuditError'))
    }
    return res
  },
  signToken(data: SignTokenInput): Promise<SignTokenOutput> {
    return request({ method: 'post', url: '/api/v1/tss/sign.token', data })
  },

  // 2FA
  getGoogleAuthenticatorQRCode(): Promise<GetGoogleAuthenticatorQRCodeOutput> {
    return request({ method: 'post', url: '/api/v1/2fa/ga/qrcode' })
  },
  addAuthenticator(data: AddAuthenticatorInput): Promise<AddAuthenticatorOutput> {
    return request({ method: 'post', url: '/api/v1/2fa/add', data })
  },
  authenticatorStatus(data: AuthenticatorStatusInput): Promise<AuthenticatorStatusOutput> {
    return request({ method: 'post', url: '/api/v1/2fa/open.status', data })
  },
  // deleteAuthenticator(data: DeleteAuthenticatorInput): Promise<DeleteAuthenticatorOutput> {
  //   return request({ method: 'post', url: '/api/v1/2fa/del', data })
  // },
  authenticatorList(data: AuthenticatorListInput): Promise<AuthenticatorListOutput> {
    return request({ method: 'post', url: '/api/v1/2fa/list', data })
  },
  sendRecoveryOAuthSig(data: RecoveryOAuthSigInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/recovery/auth.oauth', data })
  },
  sendSyncOAuthSig(data: SyncOAuthSigInput): Promise<ApiResponse> {
    return request({
      method: 'post',
      url: '/api/v1/sync/auth.oauth',
      data,
    })
  },
  // guardian
  sendGuardianLink(data: SendGuardianLinkInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/guardian.link', data })
  },
  getGuardianToken(registerEmail: string): Promise<GetGuardianTokenOutput> {
    return request(
      { method: 'post', url: '/api/v1/account/guardian.status', data: { registerEmail } },
      true,
    )
  },
  checkKeyset(data: CheckKeysetInput): Promise<VerifyOtpCodeOutput> {
    return request({
      method: 'post',
      url: '/api/v1/account/keyset.check',
      data,
    })
  },
  updateGuardian(data: UpdateGuardianInput): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/guardian.update', data })
  },
  syncUpdate(): Promise<ApiResponse> {
    return request({ method: 'post', url: '/api/v1/account/sync.update' })
  },
  // sync
  getSyncStatus(data: GetSyncStatusInput): Promise<GetSyncStatusOutput> {
    return request({ method: 'post', url: '/api/v1/sync/status', data }, true)
  },
  // sendAuthEmail(data: SendAuthEmailInput): Promise<ApiResponse> {
  //   return request({ method: 'post', url: '/api/v1/sync/send/auth.email', data })
  // },
  // getSyncTransaction(data: GetTransactionInput): Promise<GetTransactionOutput> {
  //   return request({ method: 'post', url: '/api/v1/sync/transaction', data })
  // },

  // dollar
  getPriceConversion(id: string): Promise<GetPriceConversionOutput> {
    return request({ method: 'post', url: '/api/v1/price-conversion', data: { id } }, true)
  },

  // get account tokens
  getAccountTokens(data: GetAccountTokensInput): Promise<GetAccountTokensOutput> {
    return request({ method: 'post', url: '/api/v1/chainbase/account.tokens', data })
  },
}

export default api
