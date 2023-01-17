export type OnRampPlatform = 'alchemyPay' | 'whaleFin' | 'fatPay'

export default interface BuyCoinsCardItem {
  providerLogo: string
  providerLogoDark: string
  platform: OnRampPlatform
  paymentMethodList: string[]
  gasFee: string
}
