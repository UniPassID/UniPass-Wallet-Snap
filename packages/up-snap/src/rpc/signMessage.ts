import { SnapProvider } from '@metamask/snap-types';
import { Wallet } from 'ethers';
import { arrayify, isHexString } from 'ethers/lib/utils';
import { SignRequest } from '../interface';
import { extractMasterPrivateKey } from './getMasterKeyAddress';

export async function signMessage(
  signRequest: SignRequest,
  wallet: SnapProvider
) {
  const masterPrivateKey = await extractMasterPrivateKey(wallet);
  const ethersWallet = new Wallet(masterPrivateKey);

  const { from, message } = signRequest;

  if (ethersWallet.address.toLowerCase() !== from.toLowerCase()) {
    throw new Error(`snap wallet address ${ethersWallet.address} != ${from}`);
  }

  const result = await wallet.request({
    method: 'snap_confirm',
    params: [
      {
        prompt: 'Sign Message?',
        description: 'Please verify the message to be signed',
        textAreaContent: message,
      },
    ],
  });

  if (result) {
    return ethersWallet.signMessage(
      isHexString(message) ? arrayify(message) : message
    );
  } else {
    throw new Error('user reject the sign request');
  }
}
