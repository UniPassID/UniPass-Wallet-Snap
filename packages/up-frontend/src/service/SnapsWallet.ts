import { Wallet } from 'ethers'
import { Bytes, hexlify } from 'ethers/lib/utils'
import { signMsgWithMM } from '@/utils/cloud-key'

export class SnapsWallet extends Wallet {
  _accountAddress: string

  _masterKeyAddress: string

  constructor(accountAddress: string, masterKeyAddress: string) {
    super('0x79682c20bbcaf7fcf18eb0c69b133c872227ceb88971090e7f2242c80cd54d18')

    this._accountAddress = accountAddress
    this._masterKeyAddress = masterKeyAddress
  }

  signMessage(message: string | Bytes): Promise<string> {
    return signMsgWithMM(hexlify(message), this._masterKeyAddress)
  }
}
