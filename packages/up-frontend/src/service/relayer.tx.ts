import blockchain from '@/service/blockchain'
import { constants, utils, Wallet } from 'ethers'
import assets from '@/service/assets'
import { AssetTransactionInput } from '@/service/relayer'
import { signer, RecoveryEmails, transactionBuilder, Transaction } from 'unipass-wallet'
import { TxExcutor } from 'unipass-wallet/src/txExecutor'

const { MasterKeySigGenerator, SignType } = signer
const { CallTxBuilder } = transactionBuilder

export interface SendTransferData {
  feeToken: string
  feeAmount: string
  feeDecimals: number
  feeReceiver: string
  tokenDecimals: number
  accountAddress: string
  threshold: number
  recoveryEmails: string[]
  masterKey: Wallet
  toAddress: string
  toAmount: string
  contractAddress: string
}

async function getReqData(sendTransferData: SendTransferData, tx: Transaction) {
  const {
    masterKey,
    feeToken,
    feeAmount,
    feeDecimals,
    feeReceiver,
    accountAddress,
    threshold,
    recoveryEmails,
  } = sendTransferData
  const nonce = await blockchain.getNonce(accountAddress)
  const { chainId } = await blockchain.getNetwork()
  const recoveryEmail = new RecoveryEmails(threshold, recoveryEmails)

  const masterKeySigGenerator = new MasterKeySigGenerator(masterKey, recoveryEmail)

  const txExecutor = await new TxExcutor(
    chainId,
    nonce,
    [tx],
    feeToken,
    utils.parseUnits(feeAmount, feeDecimals),
    feeReceiver,
  ).generateSigByMasterKey(masterKeySigGenerator, SignType.EthSign)
  const signature = txExecutor.signature

  const req = {
    address: accountAddress,
    nonce,
    params: [
      [tx],
      nonce,
      feeToken,
      feeReceiver,
      utils.parseUnits(feeAmount, feeDecimals),
      signature,
    ],
  }
  return req
}

export const getSendERC20Tx = async (
  toAddress: string,
  toAmount: string,
  contractAddress: string,
  tokenDecimals: number,
): Promise<Transaction> => {
  const data = assets.getTransferData(
    toAddress,
    utils.parseUnits(toAmount, tokenDecimals),
    contractAddress as string,
  )
  const tx = new CallTxBuilder(
    constants.Zero,
    contractAddress as string,
    constants.Zero,
    data,
  ).build()
  return tx
}
export const getSendNativeToken20Tx = async (to: string, amount: string): Promise<Transaction> => {
  const optimalGasLimit = constants.Zero
  const value = utils.parseEther(amount)
  const tx = new CallTxBuilder(optimalGasLimit, to, value, '0x').build()
  return tx
}

export const initRelayerAssetsReqData = async (
  sendTransferData: SendTransferData,
): Promise<AssetTransactionInput> => {
  const { toAddress, toAmount, contractAddress, tokenDecimals } = sendTransferData
  let tx: Transaction
  if (contractAddress === '0x0000000000000000000000000000000000000000') {
    tx = await getSendNativeToken20Tx(toAddress, toAmount)
  } else {
    tx = await getSendERC20Tx(toAddress, toAmount, contractAddress, tokenDecimals)
  }
  const req = getReqData(sendTransferData, tx)
  return req
}
