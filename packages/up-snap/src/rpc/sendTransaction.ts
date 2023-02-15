import { SnapProvider } from '@metamask/snap-types';
import { SendTransactionRequest } from '../interface';
import { SignType } from '@unipasswallet/keys';
import { Wallet, BytesLike } from 'ethers';
import { hexlify, arrayify, isHexString, solidityPack } from 'ethers/lib/utils';
import { extractMasterPrivateKey } from './getMasterKeyAddress';
import UnipassWalletProvider from '../provider';
import { AccountInfo } from '../provider/interface';
import { txDecoder, feeDecoder } from '../util/decoder';
import { getFunctionText } from '../util';

export async function sendTransaction(
  params: SendTransactionRequest,
  wallet: SnapProvider
) {
  const { transactionParams, unipassWalletProps, email } = params;
  const masterPrivateKey = await extractMasterPrivateKey(wallet, email);
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

  const accountInfo = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  }) as AccountInfo;

  const decodedData = await txDecoder(transactionParams, unipassWalletProps.env)
  let decodedFee
  let contentText

  if (transactionParams.fee) {
    decodedFee = await feeDecoder(transactionParams.fee, transactionParams.chain, unipassWalletProps.env)
  }

  if (decodedData.type === 'contract-call') {
    contentText = 
      `From: ${accountInfo?.address}\n` + 
      `Interacted With (To): ${transactionParams.tx.target}\n` + 
      `Chain: ${transactionParams.chain}\n` +
      `Gasfee:` + 
        (decodedFee ? (`\n  cointype: ${decodedFee.symbol}\n` + `  amount: ${decodedFee.value}\n`) : `0\n`) +
      `Function: ${decodedData.function}\n` +
        getFunctionText(decodedData.name, decodedData.args[0], decodedData.amount) + 
      `Hex Data:\n` +
      `${transactionParams.tx.data}`
  } else {
    contentText = 
      `From: ${accountInfo?.address}\n` + 
      `To: ${transactionParams.tx.target}\n` + 
      `Amount ${decodedData.amount}\n` +
      `Chain: ${transactionParams.chain}\n` +
      `Gasfee:` + 
        (decodedFee ? (`\n  cointype: ${decodedFee.symbol}\n` + `  amount: ${decodedFee.value}\n`) : `0\n`) +
      `Hex Data:\n` +
      `0x`
  }
  
  const result = await wallet.request({
    method: 'snap_confirm',
    params: [
      {
        prompt: 'Send Transaction?',
        description: 'Please verify the transaction to be send',
        textAreaContent: contentText,
      },
    ],
  });

  if (result) {
    transactionParams.signFunc = signFunc;
    const unipassWallet = UnipassWalletProvider.getInstance(unipassWalletProps);
    const res = await unipassWallet.transaction(transactionParams);
    return JSON.stringify(res);
  } else {
    throw new Error('user reject the transaction');
  }
}
