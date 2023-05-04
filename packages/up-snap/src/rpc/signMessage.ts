import { Wallet } from 'ethers';
import { arrayify, isHexString } from 'ethers/lib/utils';
import { SignRequest } from '../interface';
import { extractMasterPrivateKey } from './getMasterKeyAddress';
import { panel, text, heading, divider } from '@metamask/snaps-ui';

export async function signMessage(
  signRequest: SignRequest,
) {
  const masterPrivateKey = await extractMasterPrivateKey(signRequest.email);
  const ethersWallet = new Wallet(masterPrivateKey);
  const { from, message, prefix } = signRequest;

  if (ethersWallet.address.toLowerCase() !== from.toLowerCase()) {
    throw new Error(`snap wallet address ${ethersWallet.address} != ${from}`);
  }

  let context = ''

  if (prefix) {
    context = `${prefix}\n\n` + 'Hex Data:\n\n' + message
  } else {
    context = message
  }

  const result = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        heading('Sign Message?'),
        text('Please verify the message to be signed'),
        divider(),
        text(context)
      ])
    },
  });

  if (result) {
    return ethersWallet.signMessage(
      isHexString(message) ? arrayify(message) : message
    );
  } else {
    throw new Error('user reject the sign request');
  }
}
