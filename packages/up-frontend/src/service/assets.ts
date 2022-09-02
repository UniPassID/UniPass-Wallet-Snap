import { BigNumber, Contract, providers, utils } from 'ethers'

let provider: providers.JsonRpcProvider
let erc20ETH: Contract
let erc20USDC: Contract
let erc20USDT: Contract

export const EthContractAddress = process.env.VUE_APP_ETH || ''
export const USDCContractAddress = process.env.VUE_APP_USDC || ''
export const USDTContractAddress = process.env.VUE_APP_USDT || ''
const erc20Abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
]

const fee = {
  maticFee: process.env.VUE_APP_TOKEN_FEE as string,
  ethFee: process.env.VUE_APP_ETH_FEE as string,
  usdcFee: process.env.VUE_APP_USDC_FEE as string,
  usdtFee: process.env.VUE_APP_USDT_FEE as string,
}

const initProvider = () => {
  if (!provider) {
    provider = new providers.JsonRpcProvider(process.env.VUE_APP_RPC)
    erc20ETH = new Contract(EthContractAddress, erc20Abi, provider)
    erc20USDC = new Contract(USDCContractAddress, erc20Abi, provider)
    erc20USDT = new Contract(USDTContractAddress, erc20Abi, provider)
  }
}
initProvider()

const assets = {
  async getAddressAssest(address: string) {
    const balance = await provider.getBalance(address)
    const maticAssets = utils.formatEther(balance)

    const eth1 = erc20ETH.balanceOf(address)
    const eth2 = erc20ETH.symbol()
    const eth3 = erc20ETH.decimals()
    const [ethBalance, ethSymbol, ethDecimals] = await Promise.all([eth1, eth2, eth3])
    const ethAssets = utils.formatUnits(ethBalance, ethDecimals)

    const usdc1 = erc20USDC.balanceOf(address)
    const usdc2 = erc20USDC.symbol()
    const usdc3 = erc20USDC.decimals()
    const [usdcBalance, usdcSymbol, usdcDecimals] = await Promise.all([usdc1, usdc2, usdc3])
    const usdcAssets = utils.formatUnits(usdcBalance, usdcDecimals)

    const usdt1 = erc20USDT.balanceOf(address)
    const usdt2 = erc20USDT.symbol()
    const usdt3 = erc20USDT.decimals()
    const [usdtBalance, usdtSymbol, usdtDecimals] = await Promise.all([usdt1, usdt2, usdt3])
    const usdtAssets = utils.formatUnits(usdtBalance, usdtDecimals)

    const assets = [
      {
        symbol: 'MATIC',
        decimals: 18,
        balance: maticAssets,
        gasFee: fee.maticFee,
        contractAddress: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: ethSymbol as string,
        decimals: ethDecimals as number,
        balance: ethAssets,
        gasFee: fee.ethFee,
        contractAddress: EthContractAddress,
      },
      {
        symbol: usdcSymbol as string,
        decimals: usdcDecimals as number,
        balance: usdcAssets,
        gasFee: fee.usdcFee,
        contractAddress: USDCContractAddress,
      },
      {
        symbol: usdtSymbol as string,
        decimals: usdtDecimals as number,
        balance: usdtAssets,
        gasFee: fee.usdtFee,
        contractAddress: USDTContractAddress,
      },
    ]
    return assets
  },

  getTransferData(toAddress: string, value: BigNumber, erc20ContractAddress: string): string {
    let ercToken: Contract
    switch (erc20ContractAddress) {
      case EthContractAddress:
        ercToken = erc20ETH
        break
      case USDCContractAddress:
        ercToken = erc20USDC
        break
      case USDTContractAddress:
        ercToken = erc20USDT
        break
      default:
        ercToken = new Contract(erc20ContractAddress, erc20Abi, provider)
    }
    const data = ercToken.interface.encodeFunctionData('transfer', [toAddress, value])
    console.log({ address: ercToken.address })
    return data
  },
}

export default assets
