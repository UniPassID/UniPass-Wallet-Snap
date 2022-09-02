import Axios from 'axios'
import { initResponse } from '@/service/backend-error'
import { ApiResponse } from '@/service/backend'

const axios = Axios.create({
  baseURL: process.env.VUE_APP_Relayer,
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

export interface AssetTransactionInput {
  nonce: number
  address: string
  params: any[]
}

export interface ITxData extends ApiResponse {
  data: {
    transactionHash: string
    status: number
  }
}

// Request
const relayerApi = {
  asset(data: AssetTransactionInput): Promise<ITxData> {
    return axios({ method: 'post', url: '/api/v1/transaction/asset', data })
  },
}

export default relayerApi
