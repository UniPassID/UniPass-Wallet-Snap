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

  const decodedData = await txDecoder(transactionParams, unipassWalletProps.env)
  let decodedFee
  let contentText

  if (transactionParams.fee) {
    decodedFee = await feeDecoder(transactionParams.fee, transactionParams.chain, unipassWalletProps.env)
  }

  if (decodedData.type === 'contract-call') {
    contentText = 
      `From: ${accountInfo?.address}\n\n` + 
      `Interacted With (To): ${transactionParams.tx.target}\n\n` + 
      `Chain: ${transactionParams.chain}\n\n` +
      `Gasfee:\n\n` + 
        (decodedFee ? (`__cointype: ${decodedFee.symbol}\n\n` + `__amount: ${decodedFee.value}\n\n`) : '0\n\n') +
      `Function: ${decodedData.function}\n\n` +
        getFunctionText(decodedData.name, decodedData.args[0], decodedData.amount) + 
      `Hex Data:\n\n` +
      `${transactionParams.tx.data}`
  } else {
    contentText = 
      `From: ${accountInfo?.address}\n\n` + 
      `To: ${transactionParams.tx.target}\n\n` + 
      `Amount ${decodedData.amount}\n\n` +
      `Chain: ${transactionParams.chain}\n\n` +
      `Gasfee:\n\n` + 
        (decodedFee ? (`__cointype: ${decodedFee.symbol}\n\n` + `__amount: ${decodedFee.value}\n\n`) : `0\n\n`) +
      `Hex Data:\n\n` +
      `0x`
  }

  const result = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'Confirmation',
      content: panel([
        heading('Send Transaction?'),
        text('Please verify the transaction to be send'),
        divider(),
        text(contentText)
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
