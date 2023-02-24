import { useSignStore } from '@/store/sign'
import { useUserStore } from './user'
import i18n from '@/plugins/i18n'
import {
  getChainNameByChainId,
  getDefaultChainId,
  getSupportedChainIds,
} from '@/service/chains-config'
import { getSdkError, parseUri } from '@walletconnect/utils'
import SignClient from '@walletconnect/sign-client'
import LegacySignClient from '@walletconnect/client'
import { IWalletConnectSession, IClientMeta } from '@walletconnect/legacy-types'
import { SignClientTypes, SessionTypes, PairingTypes } from '@walletconnect/types'
import router from '@/plugins/router'
import { upError, upTip, upSuccess } from '@/utils/useUniPass'
import {
  handleWalletConnectPersonalSign,
  handleWalletConnectPersonalSignV1,
  handleWalletConnectSendTransaction,
  handleWalletConnectSendTransactionV1,
  handleWalletConnectSignTypedData,
  handleWalletConnectSignTypedDataV1,
  isSupportedEip155Chain,
} from '@/service/wallet-connect-utils'
import { formatJsonRpcResult, formatJsonRpcError } from '@json-rpc-tools/utils'
import DB from './index_db'

const { t: $t } = i18n.global

const walletConnectConfig = {
  projectId: '384712c485fcfe8ad66170202fb32741',
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'Smart wallet Snap',
    description: 'Smart wallet Snap for WalletConnect',
    url: 'https://wallet.unipass.id',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
}

export const EIP155_SIGNING_METHODS = {
  PERSONAL_SIGN: 'personal_sign',
  ETH_SIGN: 'eth_sign',
  ETH_SIGN_TRANSACTION: 'eth_signTransaction',
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
  ETH_SEND_RAW_TRANSACTION: 'eth_sendRawTransaction',
  ETH_SEND_TRANSACTION: 'eth_sendTransaction',
  WALLET_SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
}

interface LegacySessions {
  connected: boolean
  accounts: string[]
  chainId: number
  bridge: string
  key: string
  clientId: string
  clientMeta: IClientMeta | null
  peerId: string
  peerMeta: IClientMeta | null
  handshakeId: number
  handshakeTopic: string
}

interface LegacyPayload {
  id: number
  method: string
  params: any[]
}

export interface WalletConnectState {
  signClient?: SignClient
  legacySignClient?: LegacySignClient
  proposal?: SignClientTypes.EventArguments['session_proposal']
  pairings: PairingTypes.Struct[]
  sessions: SessionTypes.Struct[]
  legacySessions?: LegacySessions
  legacyProposal?: LegacyPayload
  approveType: 'V1' | 'V2'
  currentDappName: string
  currentChainId: number
}

export const useWalletConnectStore = defineStore({
  id: 'WalletConnectStore',
  state: (): WalletConnectState => {
    return {
      signClient: undefined,
      legacySignClient: undefined,
      proposal: undefined,
      pairings: [],
      sessions: [],
      legacySessions: undefined,
      legacyProposal: undefined,
      approveType: 'V2',
      currentDappName: '',
      currentChainId: 80001,
    }
  },
  actions: {
    async init() {
      this.createLegacySignClient()
      if (!this.signClient) {
        const signClient = await SignClient.init(walletConnectConfig)
        this.walletConnectEventHandle(signClient)
        this.signClient = signClient
        this.sessions = this.signClient.session?.values || []
      }
      // this.pairings = this.signClient.pairing?.values || []
    },
    walletConnectEventHandle(signClient: SignClient) {
      signClient.on('session_proposal', this.onSessionProposal)
      signClient.on('session_request', this.onSessionRequest)
      // TODOs
      signClient.on('session_ping', (data) => console.log('ping', data))
      signClient.on('session_event', (data) => console.log('event', data))
      signClient.on('session_update', (data) => console.log('update', data))
      signClient.on('session_delete', this.onSessionDelete)
    },
    onSessionProposal(proposal: SignClientTypes.EventArguments['session_proposal']) {
      console.log(`proposal:`)
      console.log(proposal)
      const userStore = useUserStore()
      let supported = false
      const { requiredNamespaces, proposer } = proposal.params
      Object.keys(requiredNamespaces).forEach((key) => {
        requiredNamespaces[key].chains.forEach((chain) => {
          if (isSupportedEip155Chain(chain)) {
            supported = true
          }
        })
      })
      if (!supported) {
        upTip($t('WCWrongChain'), 10000, true)
        router.replace('/')
        return
      }
      this.proposal = proposal
      this.approveType = 'V2'
      const icon = proposer.metadata?.icons[0] ?? ''
      this.currentDappName = proposer.metadata?.url ?? ''
      userStore.appIcon = icon
      router.push({
        path: '/connect',
        query: {
          type: 'wallet-connect',
        },
      })
    },
    async onSessionRequest(requestEvent: SignClientTypes.EventArguments['session_request']) {
      console.log('session_request', requestEvent)
      const { topic, params } = requestEvent
      const { request } = params

      const dapp = this.sessions.find((session) => session.topic === topic)
      this.currentDappName = dapp ? dapp.peer.metadata.url : ''

      console.log(`request.method: ${request.method}`)

      switch (request.method) {
        case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
          handleWalletConnectPersonalSign(requestEvent)
          break

        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
          handleWalletConnectSignTypedData(requestEvent)
          break

        case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
          handleWalletConnectSendTransaction(requestEvent)
          break
        default:
          upError(`${request.method} not supported`)
      }
    },
    onSessionDelete(data: SignClientTypes.EventArguments['session_delete']) {
      console.log(data)
      if (!data.topic) return
      this.pairings = this.pairings.filter((pairing) => pairing.topic !== data.topic)
      this.sessions = this.sessions.filter((session) => session.topic !== data.topic)
    },
    async pair(uri: string) {
      console.log(`uri:${uri}`)
      const { version } = parseUri(uri)
      console.log(`current wallet connect uri version: ${version}`)
      router.replace('/wallet-connect-loading')
      if (version === 1) {
        this.createLegacySignClient({ uri })
      } else {
        if (this.signClient) {
          try {
            const data = await this.signClient.pair({ uri })
            console.log(data)
            const current = this.pairings.find((pairing) => pairing.topic === data.topic)
            if (current) {
              upError('Link connected')
              router.replace('/')
            }
          } catch (e) {
            upError($t('WCWrongLink'))
            router.replace('/')
            console.log(e)
          }
        } else {
          upError($t('WCConnectionError'))
        }
      }
    },
    async approve(address: string) {
      if (this.legacyProposal && this.legacySignClient && this.approveType === 'V1') {
        const { params } = this.legacyProposal
        const { chainId, peerMeta } = params[0]

        const url = peerMeta?.url?.toLowerCase() ?? ''
        let _chainId = chainId || getDefaultChainId()
        if (
          url.indexOf('opensea') > -1 ||
          url.indexOf('collab') > -1 ||
          url.indexOf('guild') > -1 ||
          url.indexOf('link3') > -1 ||
          url.indexOf('galxe') > -1
        ) {
          _chainId = getDefaultChainId()
        }

        console.log(`approve chainId: ${_chainId}`)

        this.legacySignClient.approveSession({
          accounts: [address],
          chainId: _chainId,
        })
        this.currentChainId = _chainId
        this.legacySessions = this.legacySignClient.session
        window.localStorage.setItem('walletconnect', JSON.stringify(this.legacySignClient.session))
      }
      if (this.proposal && this.signClient && this.approveType === 'V2') {
        const { id, params } = this.proposal
        const { requiredNamespaces, relays } = params

        const namespaces: SessionTypes.Namespaces = {}

        Object.keys(requiredNamespaces).forEach((key) => {
          const accounts: string[] = []
          requiredNamespaces[key].chains.forEach((chain) => {
            if (isSupportedEip155Chain(chain)) {
              accounts.push(`${chain}:${address}`)
            }
          })
          namespaces[key] = {
            accounts,
            methods: requiredNamespaces[key].methods,
            events: requiredNamespaces[key].events,
          }
        })

        console.log(`namespaces:`)
        console.log(namespaces)

        const { acknowledged } = await this.signClient.approve({
          id,
          relayProtocol: relays[0].protocol,
          namespaces,
        })
        await acknowledged()
        this.pairings = this.signClient.pairing?.values || []
        this.sessions = this.signClient.session?.values || []
        this.proposal = undefined
      }
    },
    async disconnect(topic: string) {
      if (this.signClient) {
        await this.signClient.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') })
        this.pairings = this.signClient.pairing?.values || []
        this.sessions = this.signClient.session?.values || []
      }
      this.checkSessionCount()
    },
    disconnectV1() {
      if (this.legacySignClient) {
        this.legacySignClient?.killSession()
        this.checkSessionCount()
      }
    },
    async walletConnectApprove(topic: string, id: number, sigOrHash: string) {
      const response = formatJsonRpcResult(id, sigOrHash)
      if (topic.endsWith('V1')) {
        console.log(response.result)
        console.log(this.legacySignClient)
        this.legacySignClient?.approveRequest({
          id,
          result: response.result,
        })
        return
      }
      await this.signClient?.respond({
        topic,
        response,
      })
    },
    async walletConnectReject(topic: string, id: number) {
      const response = formatJsonRpcError(id, getSdkError('USER_REJECTED_METHODS').message)
      if (topic.endsWith('V1')) {
        this.legacySignClient?.rejectRequest({
          id,
          error: response.error,
        })
        return
      }
      await this.signClient?.respond({
        topic,
        response,
      })
    },
    // for wallet connect V1
    async createLegacySignClient({ uri }: { uri?: string } = {}) {
      if (uri) {
        await this.deleteCachedLegacySession()
        this.legacySignClient = new LegacySignClient({ uri })
      } else if (!this.legacySignClient && this.getCachedLegacySession()) {
        const session = this.getCachedLegacySession()
        this.legacySessions = session
        this.currentChainId = session?.chainId || 137
        this.legacySignClient = new LegacySignClient({ session })
      } else {
        return
      }
      const userStore = useUserStore()
      this.legacySignClient.on('session_request', (error, payload) => {
        console.log('legacySignClient session_request')
        console.log(payload)
        if (error) {
          throw new Error(`legacySignClient > session_request failed: ${error}`)
        }
        const { params } = payload
        const { chainId, peerMeta } = params[0]
        const icon = peerMeta.icons[0] ?? ''
        this.currentDappName = peerMeta?.url ?? ''
        userStore.appIcon = icon
        userStore.chain = getChainNameByChainId(chainId)
        // if (chainId && !getSupportedChainIds().includes(chainId)) {
        //   upTip($t('WCWrongChain'), 10000, true)
        //   router.replace('/')
        //   return
        // }
        this.approveType = 'V1'
        this.legacyProposal = payload
        router.push({
          path: '/connect',
          query: {
            type: 'wallet-connect',
          },
        })
      })

      this.legacySignClient.on('connect', () => {
        console.log('legacySignClient > connect')
      })

      this.legacySignClient.on('error', (error) => {
        throw new Error(`legacySignClient > on error: ${error}`)
      })

      this.legacySignClient.on('call_request', (error, payload) => {
        if (error) {
          throw new Error(`legacySignClient > call_request failed: ${error}`)
        }
        this.onLegacyCallRequest(payload)
      })

      this.legacySignClient.on('disconnect', async () => {
        this.deleteCachedLegacySession()
        this.legacySessions = undefined
      })
    },
    async onLegacyCallRequest(payload: LegacyPayload) {
      console.log(`onLegacyCallRequest: ${payload.method}`)
      const chainId = this.legacySessions?.chainId ?? getDefaultChainId()
      const hostUrl = this.legacySessions?.peerMeta?.url ?? ''
      const icon = this.legacySessions?.peerMeta?.icons[0] ?? ''
      this.currentDappName = this.legacySessions?.peerMeta?.url ?? ''

      switch (payload.method) {
        case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
          console.log(payload)
          handleWalletConnectPersonalSignV1({ ...payload, chainId, hostUrl, icon })
          break

        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
          console.log(payload)

          handleWalletConnectSignTypedDataV1({ ...payload, chainId, hostUrl, icon })
          break

        case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
          handleWalletConnectSendTransactionV1({ ...payload, chainId, hostUrl, icon })
          console.log(payload)

          break
        case EIP155_SIGNING_METHODS.WALLET_SWITCH_ETHEREUM_CHAIN:
          console.log(EIP155_SIGNING_METHODS.WALLET_SWITCH_ETHEREUM_CHAIN)

          console.log(payload)
          this.switchEthChain(payload)
          break
        default:
          console.log(payload)

          upError(`${payload.method} not supported`)
      }
    },
    async switchEthChain(payload: any) {
      const { params } = payload
      const [{ chainId }] = params
      if (!getSupportedChainIds().some((id) => id === parseInt(chainId, 16))) {
        upTip($t('WCWrongChain'), 10000, true)
        return
      }
      const accountInfo = await DB.getAccountInfo()
      if (!accountInfo) return
      console.log({
        accounts: [accountInfo.address],
        chainId: parseInt(chainId, 16),
      })

      this.legacySignClient?.updateSession({
        accounts: [accountInfo.address],
        chainId: parseInt(chainId, 16),
      })
      const url = this.legacySignClient?.peerMeta?.url?.toLowerCase() ?? ''
      if (url.indexOf('opensea') > -1) {
        upSuccess($t('WCSwitchChain'), 9000)
      }
      this.currentChainId = parseInt(chainId, 16)
      this.legacySessions = this.legacySignClient?.session
        ? { ...this.legacySignClient?.session, chainId: parseInt(chainId, 16) }
        : this.legacySessions
    },
    getCachedLegacySession(): IWalletConnectSession | undefined {
      if (typeof window === 'undefined') return

      const local = window.localStorage ? window.localStorage.getItem('walletconnect') : null

      let session = null
      if (local) {
        session = JSON.parse(local)
      }
      return session
    },
    async deleteCachedLegacySession(): Promise<void> {
      try {
        if (typeof window === 'undefined') return
        window.localStorage.removeItem('walletconnect')
        await this.legacySignClient?.killSession()
      } catch (e) {
        console.log(e)
      }
    },
    async onChainChanged(value: string) {
      const chainId = Number(value)
      console.log(chainId)

      const accountInfo = await DB.getAccountInfo()
      if (!accountInfo) return
      console.log({
        accounts: [accountInfo.address],
        chainId: chainId,
      })

      if (this.legacySessions) {
        this.legacySignClient?.updateSession({
          accounts: [accountInfo.address],
          chainId,
        })

        this.currentChainId = chainId
        this.legacySessions = this.legacySignClient?.session
          ? { ...this.legacySignClient?.session, chainId }
          : this.legacySessions
      }
    },
    getDappName() {
      const signStore = useSignStore()

      const dapp =
        signStore.fromWalletConnectSign || signStore.walletConnectId != null
          ? this.currentDappName
          : 'UniPassWallet'
      console.log(`current dapp name: ${dapp}`)

      return dapp
    },
    checkSessionCount() {
      if (this.pairings.length <= 0) {
        router.replace('/')
      }
    },
  },
})
