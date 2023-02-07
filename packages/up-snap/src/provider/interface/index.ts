import { Transaction } from '@unipasswallet/transactions';
import { AuthChainNode } from './unipassWalletProvider';

// --- tss input output ----
export interface StartKeyGenInput {
  email: string;
  upAuthToken: string;
  action: string;
}

export interface LocalKeyData {
  localKeyAddress: string;
  userId: string;
  keystore: string;
  upAuthToken: string;
}

export interface StartKeygenData {
  keygenInput: KeyGenInput;
  context2: string;
}

export interface KeyGenInput {
  email: string;
  upAuthToken: string;
  sessionId: string;
  tssMsg: any;
  action: string;
}

export interface KeygenData {
  userId: string;
  sessionId: string;
  msg: any;
}

export interface GetKeygenData {
  signContext2: any;
  finishKeygenInput: FinishKeygenInput;
}

export interface FinishKeygenInput {
  email: string;
  upAuthToken: string;
  sessionId: string;
  userId: string;
  localKeyAddress: string;
  action: string;
}

export interface ApiResponse {
  statusCode: number;
}

interface MasterKey {
  kdfPassword: string;
  masterKeyAddress: string;
  keyStore: string;
}

interface SessionKeyPermit {
  timestamp: number;
  timestampNow: number;
  permit: string;
  sessionKeyAddress: string;
  sig: string;
  weight: number;
}

export interface GuardianData {
  email: string;
  isSelfGuardian: boolean;
}

// 2FA
// 0:Email | 1:Phone | 2:GoogleAuthenticator | 3:WebAuth
export enum AuthType {
  Email,
  Phone,
  GoogleAuthenticator,
  WebAuth,
}

// Permit
export enum SignerType {
  EIP712 = 1,
  EthSig = 2,
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
  | 'tssSign';

export interface SuffixesOutput extends ApiResponse {
  data: {
    suffixes: string[];
    policyAddress: string;
  };
}

export interface SendOtpCodeInput {
  email: string;
  action: OtpAction;
  bindPhone?: {
    phone: string;
    areaCode: string;
  };
  authType: AuthType;
}

export interface VerifyOtpCodeInput {
  email: string;
  action: OtpAction;
  code: string;
  authType: AuthType;
}

export interface VerifyOtpCodeOutput extends ApiResponse {
  data: {
    upAuthToken: string;
  };
}

export interface SignInput {
  email: string;
  sessionId: string;
  upAuthToken: string;
  tssMsg: any;
  value: string;
  action: string;
}

export interface SignUpAccountInput {
  email: string;
  pepper: string;
  upAuthToken: string;
  keysetJson: string;
  masterKey: MasterKey;
  sessionKeyPermit: SessionKeyPermit | Record<string, never>;
}

export interface SignUpAccountOutput extends ApiResponse {
  data: {
    address: string;
    keysetHash: string;
  };
}

export interface StartSignInput {
  email: string;
  upAuthToken: string;
  localKeyAddress: string;
  tssMsg: any;
  value: string;
  action: string;
}

export interface SignInput {
  email: string;
  sessionId: string;
  upAuthToken: string;
  tssMsg: any;
  value: string;
  action: string;
}

export interface GetPasswordTokenInput {
  // register email
  email: string;
  kdfPassword: string;
  // google captchaToken
  captchaToken: string;
}

export interface Auth2FaCodeToken {
  type: number;
  upAuthToken: string;
}

export interface LoginInput {
  email: string;
  upAuthToken: string;
  auth2FaToken: Auth2FaCodeToken[];
}
export interface LoginOutput extends ApiResponse {
  data: {
    address: string;
    keystore: string;
    localKeyAddress: string;
    upAuthToken: string;
  };
}

export interface QueryAccountKeysetInput {
  email: string;
  upAuthToken: string;
  sessionKeyPermit: SessionKeyPermit | Record<string, never>;
}
export interface QueryAccountKeysetOutput extends ApiResponse {
  data: {
    masterKeyAddress: string;
    accountAddress: string;
    keyset: string;
  };
}

export interface PasswordTokenOutput extends ApiResponse {
  data: {
    address: string;
    pending: boolean;
    upAuthToken: string;
    showCaptcha: boolean;
  };
}

export interface KeyGenInput {
  email: string;
  upAuthToken: string;
  sessionId: string;
  tssMsg: any;
  action: string;
}

export interface KeygenData {
  userId: string;
  sessionId: string;
  msg: any;
}

export interface StartKeyGenInput {
  email: string;
  upAuthToken: string;
  action: string;
}

export interface TssOutput extends ApiResponse {
  data: {
    upAuthToken: string;
    tssRes: KeygenData;
    msg: any;
  };
}

export interface FinishKeygenInput {
  email: string;
  upAuthToken: string;
  sessionId: string;
  userId: string;
  localKeyAddress: string;
  action: string;
}

export type StepType = 'register' | 'recovery';

export interface AccountStatusInput {
  email: string;
  authChainNode: AuthChainNode;
}

export enum SignType {
  PersonalSign = 0,
  EIP712Sign,
  Transaction,
}

export enum AuditStatus {
  Approved = 0,
  Rejected,
  Confirming,
}

// 0=synced,1:server synced, 2:not received sync email, 3:not synced
export enum SyncStatusEnum {
  Synced,
  ServerSynced,
  NotReceived,
  NotSynced,
}

export interface AccountStatusOutput {
  data: {
    upAuthToken: string;
    syncStatus: SyncStatusEnum;
  };
}

export interface SyncEmailInput {
  email: string;
  sessionKeyPermit: SessionKeyPermit;
  authChainNode: AuthChainNode;
}

export interface SyncEmailOutput {
  statusCode: string;
}

export interface SyncTransactionInput {
  email: string;
  authChainNode: AuthChainNode;
}

export interface FetchProps {
  backend: string;
  oauthUserInfo?: OAuthUserInfo;
}

export interface SyncTransactionOutput {
  data: {
    isNeedDeploy: boolean;
    transactions: Array<Transaction>;
    initKeysetHash: string;
  };
}

export enum OAuthProvider {
  GOOGLE,
  AUTH0,
}

export interface AccountInfo {
  email: string;
  id_token: string;
  user_key: {
    encrypted_key: string;
    aes_key: CryptoKey;
  };
  address: string;
  oauth_provider: OAuthProvider;
  expires_at: string;
  keyset: {
    hash: string;
    masterKeyAddress: string;
    keysetJson: string;
  };
  keystore: string;
}

export interface AccountInfo {
  email: string;
  id_token: string;
  user_key: {
    encrypted_key: string;
    aes_key: CryptoKey;
  };
  address: string;
  oauth_provider: OAuthProvider;
  expires_at: string;
  keyset: {
    hash: string;
    masterKeyAddress: string;
    keysetJson: string;
  };
  keystore: string;
}

export interface IdTokenParams {
  email: string;
  name: string;
  iss: string;
  exp: number;
}

export interface UnipassInfo {
  keyset: string;
  address: string;
  keystore: string;
}

export interface LocalUserInfo {
  outh_provider: OAuthProvider;
  up_jwt_token: {
    refreshToken: string;
    authorization: string;
  };
  id_token: string;
  expires_at: string;
  unipass_info?: UnipassInfo;
}

//  for eip 712 sign
export interface MessageTypeProperty {
  name: string;
  type: string;
}

export interface MessageTypes {
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
}

export interface TypedMessage<T extends MessageTypes> {
  types: T;
  primaryType: keyof T;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: ArrayBuffer;
  };
  message: Record<string, unknown>;
}

export interface OAuthUserInfo {
  sub: string;
  email: string;
  id_token: string;
  oauth_provider: OAuthProvider;
  authorization: string;
  expires_at: string;
  up_sign_token?: string;
  unipass_info?: UnipassInfo;
}
