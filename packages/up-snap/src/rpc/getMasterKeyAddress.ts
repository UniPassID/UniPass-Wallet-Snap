import {
  getBIP44AddressKeyDeriver,
  JsonBIP44CoinTypeNode,
} from '@metamask/key-tree';
import { SnapProvider } from '@metamask/snap-types';
import { getMetamaskVersion, isNewerVersion } from '../util/version'
import { hexlify, sha256, toUtf8Bytes } from 'ethers/lib/utils';
import { Wallet } from 'ethers';
import { AccountInfo } from '../provider/interface';
import { MasterKeyAddressRequest } from '../interface';

/**
 * Return private key from seed.
 * @param wallet
 */
export async function extractMasterPrivateKey(
  wallet: SnapProvider,
  email: string,
): Promise<string> {
  let emailForAddress = ''
  if (email) {
    emailForAddress = email
  } else {
    const account = await wallet.request({
      method: 'snap_manageState',
      params: ['get'],
    }) as AccountInfo;
    emailForAddress = account.email
  }
  const emailHash = sha256(toUtf8Bytes(email))
  const bip44Code = '60';
  const account = '100';
  const change = emailHash.substring(emailHash.length - 4, emailHash.length - 2)
  const addressIndex = emailHash.substring(emailHash.length - 2)

  let bip44Node: JsonBIP44CoinTypeNode;

  const currentVersion = await getMetamaskVersion(wallet);
  if (isNewerVersion("MetaMask/v10.18.99-flask.0", currentVersion))
    bip44Node = (await wallet.request({
      method: "snap_getBip44Entropy",
      params: {
        coinType: Number(bip44Code),
      },
    })) as JsonBIP44CoinTypeNode;
  else
    bip44Node = (await wallet.request({
      method: `snap_getBip44Entropy_${bip44Code}`,
      params: [],
    })) as JsonBIP44CoinTypeNode;

  const addressKeyDeriver = await getBIP44AddressKeyDeriver(bip44Node, {
    account: parseInt(account),
    change: parseInt(change, 16),
  });

  const extendedPrivateKey = await addressKeyDeriver(parseInt(addressIndex, 16));
  const privateKey = extendedPrivateKey.privateKeyBuffer!.slice(0, 32);

  return hexlify(privateKey);
}

/**
 * Return UniPass master key address from seed.
 * @param wallet
 */
// export async function getMasterKeyAddress() {
export async function getMasterKeyAddress(params: MasterKeyAddressRequest, wallet: SnapProvider) {
  const masterPrivateKey = await extractMasterPrivateKey(wallet, params.email);

  const ethersWallet = new Wallet(masterPrivateKey);

  return ethersWallet.address;
}
