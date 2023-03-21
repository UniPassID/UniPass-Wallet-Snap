import { SendTransactionRequest } from '../interface';
import { SignType } from '@unipasswallet/keys';
import { Wallet, BytesLike } from 'ethers';
import { hexlify, arrayify, isHexString, solidityPack } from 'ethers/lib/utils';
import { extractMasterPrivateKey } from './getMasterKeyAddress';
import UnipassWalletProvider from '../provider';
import { txDecoder, feeDecoder } from '../util/decoder';
import { getFunctionText } from '../util';
import { panel, text, heading, divider } from '@metamask/snaps-ui';
import { ManageStateOperation } from '@metamask/rpc-methods'

export async function sendTransaction(
  params: SendTransactionRequest,
) {
  const { transactionParams, unipassWalletProps, email } = params;
  const masterPrivateKey = await extractMasterPrivateKey(email);
  const ethersWallet = new Wallet(masterPrivateKey);

  const signFunc = async (digestHash: BytesLike, signType: SignType) => {
    const messageToBeSigned = hexlify(digestHash);
    const sig = await ethersWallet.signMessage(
      isHexString(messageToBeSigned)
        ? arrayify(messageToBeSigned)
        : messageToBeSigned
    );

    const masterKeySig = solidityPack(['bytes', 'uint8'], [sig, signType]);

    return masterKeySig;
  };

  const accountInfo = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get' as ManageStateOperation
    },
  });

  const decodedData = await txDecoder(transactionParams, unipassWalletProps.env, accountInfo?.address as string)
  let decodedFee
  let contentTxtArray = []

  if (transactionParams.fee) {
    decodedFee = await feeDecoder(transactionParams.fee, transactionParams.chain, unipassWalletProps.env)
  }

  if (Array.isArray(decodedData)) {
    contentTxtArray = decodedData.map(data => {
      let contentText = ''
      if (data.type === 'contract-call') {
        contentText = 
          `From: ${accountInfo?.address}\n\n` + 
          `Interacted With (To): ${data.to}\n\n` + 
          `Chain: ${transactionParams.chain}\n\n` +
          `Gasfee:\n\n` + 
            (decodedFee ? (`__cointype: ${decodedFee.symbol}\n\n` + `__amount: ${decodedFee.value}\n\n`) : '0\n\n') +
          `Function: ${data.function}\n\n` +
            getFunctionText(data.name, data.args[0], data.amount) + 
          `Hex Data:\n\n` +
          `${data.rawData}`
      } else {
        contentText = 
          `From: ${accountInfo?.address}\n\n` + 
          `To: ${data.to}\n\n` + 
          `Amount ${data.amount}\n\n` +
          `Chain: ${transactionParams.chain}\n\n` +
          `Gasfee:\n\n` + 
            (decodedFee ? (`__cointype: ${decodedFee.symbol}\n\n` + `__amount: ${decodedFee.value}\n\n`) : `0\n\n`) +
          `Hex Data:\n\n` +
          `0x`
      }
      return contentText
    })
  }

  const contentTxtComponents = []

  if (contentTxtArray.length) {
    contentTxtArray.forEach((txt) => {
      contentTxtComponents.push(text(txt))
      contentTxtComponents.push(divider())
    })
  }

  const result = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'Confirmation',
      content: panel([
        heading('Send Transaction?'),
        text('Please verify the transaction to be send'),
        divider(),
        ...contentTxtComponents,
      ])
    },
  });

  if (result) {
    transactionParams.signFunc = signFunc;
    const unipassWallet = UnipassWalletProvider.getInstance(unipassWalletProps);
    const res = await unipassWallet.transaction(transactionParams);
    return JSON.stringify({
      ...res,
      executeJSON: res.execute.toJson()
    });
  } else {
    throw new Error('user reject the transaction');
  }
}
