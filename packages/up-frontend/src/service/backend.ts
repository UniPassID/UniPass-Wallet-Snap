// https://d.api.unipass.id/wallet/documentation/
import Axios from 'axios'
import { initResponse } from '@/service/backend-error'

const axios = Axios.create({
  baseURL: process.env.VUE_APP_Backend,
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

// interface
export interface ApiResponse {
  ok: boolean
  statusCode: number
  // message?: string | any[]
  // error?: string
}
export type OtpAction = 'bindPhone' | 'signUp' | 'signIn' | 'sendRecoveryEmail'

// Send Otp Code
export interface SendOtpCodeInput {
  email: string
  action: OtpAction
}

// Verify Otp Code
export interface VerifyOtpCodeInput {
  email: string
  action: OtpAction
  code: string
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

// register Account
export interface SignUpAccountInput {
  email: string
  upAuthToken: string
  keyset: {
    email: string
    cloudKeyAddress: string
    threshold: number
    originEmails: string[]
  }
  cloudKey: {
    cloudKeyAddress: string
    timestamp: number
    sig: string
    kdfPassword?: string
    keyStore?: string
  }
}
export interface SignUpAccountOutput extends ApiResponse {
  data: {
    address: string
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
    upAuthToken: string
    showCaptcha: boolean
  }
}
// login get keystore
export interface LoginAccountInput {
  email: string
  // PasswordTokenOutput upAuthToken
  upAuthToken: string
  authenticators: {
    // register email
    email: string
    action: 'signIn'
    code: string
  }
}
export interface LoginAccountOutput extends ApiResponse {
  data: {
    address: string
    keystore: string
  }
}
// login get keyset
export interface QueryAccountKeysetInput {
  email: string
  upAuthToken: string
  sessionKeyPermit?:
    | {
        timestamp: number
        timestampNow: number
        permit: string
        sessionKeyAddress: string
        sig: string
      }
    | Record<string, never>
  masterkeySig?: {
    timestamp: number
    sig: string
    masterKeyAddress: string
  }
}
export interface QueryAccountKeysetOutput extends ApiResponse {
  data: {
    address: string
    threshold: number
    originEmails: string[]
    keysetHash: string
    accountAddress: string
    upAuthToken?: string
  }
}
// recovery
export interface UploadRecoveryCloudKeyInput {
  email: string
  upAuthToken: string
  cloudKey: {
    kdfPassword: string
    cloudKeyAddress: string
    timestamp: number
    sig: string
    keyStore: string
  }
}
export interface UploadRecoveryCloudKeyOutput extends ApiResponse {
  data: {
    upAuthToken: string
  }
}
export interface SendRecoveryEmailInput {
  email: string
  upAuthToken: string
  verificationEmail: string
  newCloudKeyAddress: string
}
export interface QueryRecoveryOutput extends ApiResponse {
  data: {
    email: string
    status: number
  }[]
}
export interface SendGuardianLinkInput {
  email: string
  registerEmail: string
}
export interface SuffixesOutput extends ApiResponse {
  data: {
    suffixes: string[]
  }
}
// Request
const api = {
  getSuffixes(): Promise<SuffixesOutput> {
    return axios({ method: 'get', url: '/api/v1/config' })
  },
  sendOtpCode(data: SendOtpCodeInput): Promise<ApiResponse> {
    return axios({ method: 'post', url: '/api/v1/otp/send', data })
  },
  verifyOtpCode(data: VerifyOtpCodeInput): Promise<VerifyOtpCodeOutput> {
    return axios({ method: 'post', url: '/api/v1/otp/verify', data })
  },
  // register
  getGuardianToken(registerEmail: string): Promise<GetGuardianTokenOutput> {
    return axios({
      method: 'post',
      url: '/api/v1/account/signup/guardian.status',
      data: { registerEmail },
    })
  },
  signUpAccount(data: SignUpAccountInput): Promise<SignUpAccountOutput> {
    return axios({ method: 'post', url: '/api/v1/account/signup', data })
  },
  // login
  getPasswordToken(data: GetPasswordTokenInput): Promise<PasswordTokenOutput> {
    return axios({ method: 'post', url: '/api/v1/account/password.token', data })
  },
  loginAccount(data: LoginAccountInput): Promise<LoginAccountOutput> {
    return axios({ method: 'post', url: '/api/v1/account/signIn', data })
  },
  queryAccountKeyset(data: QueryAccountKeysetInput): Promise<QueryAccountKeysetOutput> {
    return axios({ method: 'post', url: '/api/v1/account/keyset', data })
  },
  queryAccountAddress(email: string): Promise<SignUpAccountOutput> {
    return axios({ method: 'get', url: '/api/v1/account/address', params: { email } })
  },
  uploadRecoveryCloudKey(data: UploadRecoveryCloudKeyInput): Promise<UploadRecoveryCloudKeyOutput> {
    return axios({ method: 'post', url: '/api/v1/account/recovery/upload.key', data })
  },
  sendRecoveryEmail(data: SendRecoveryEmailInput): Promise<ApiResponse> {
    return axios({ method: 'post', url: '/api/v1/account/recovery/guardian.send.email', data })
  },
  sendRecoveryStatus(email: string): Promise<QueryRecoveryOutput> {
    return axios({
      method: 'post',
      url: '/api/v1/account/recovery/guardian.email.status',
      data: { email },
    })
  },
  sendGuardianLink(data: SendGuardianLinkInput): Promise<ApiResponse> {
    return axios({ method: 'post', url: '/api/v1/account/signup/guardian.link', data })
  },
}

export default api
