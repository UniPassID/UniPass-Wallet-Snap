import { SnapProvider } from '@metamask/snap-types';
import { SendTransactionRequest } from '../interface';
import { SignType } from '@unipasswallet/keys';
import { Wallet, BytesLike } from 'ethers';
import { hexlify, arrayify, isHexString, solidityPack } from 'ethers/lib/utils';
import { extractMasterPrivateKey } from './getMasterKeyAddress';
import UnipassWalletProvider from '../provider';
import { AccountInfo } from '../provider/interface';

export async function sendTransaction(
  params: SendTransactionRequest,
  wallet: SnapProvider
) {
  const { transactionParams, unipassWalletProps } = params;
  const masterPrivateKey = await extractMasterPrivateKey(wallet);
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

  const contentText = 
    `from: ${accountInfo?.address}\nto: ${transactionParams.tx.target}\nchainType: ${transactionParams.chain}\ntx: ${JSON.stringify(transactionParams.tx)}`

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
