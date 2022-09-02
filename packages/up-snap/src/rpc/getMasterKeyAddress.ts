import {
  deriveBIP44AddressKey as deprecated_deriveBIP44AddressKey,
  JsonBIP44CoinTypeNode as Deprecated_JsonBIP44CoinTypeNode,
} from '@metamask/key-tree-old';
import {
  getBIP44AddressKeyDeriver,
  JsonBIP44CoinTypeNode,
} from '@metamask/key-tree';
import { SnapProvider } from '@metamask/snap-types';
import { getMetamaskVersion, isNewerVersion } from '../util/version'
import { hexlify } from 'ethers/lib/utils';
import { Wallet } from 'ethers';

/**
 * Return private key from seed.
 * @param wallet
 */
export async function extractMasterPrivateKey(
  wallet: SnapProvider
): Promise<string> {
  const bip44Code = '60';
  const account = '100';
  const change = '100';
  const addressIndex = '0';
  const bip44Node = (await wallet.request({
    method: `snap_getBip44Entropy_${bip44Code}`,
    params: [],
  })) as Deprecated_JsonBIP44CoinTypeNode | JsonBIP44CoinTypeNode;

  let privateKey: Buffer;

  const currentVersion = await getMetamaskVersion(wallet);
  if (isNewerVersion('MetaMask/v10.15.99-flask.0', currentVersion)) {
    const addressKeyDeriver = await getBIP44AddressKeyDeriver(
      bip44Node as JsonBIP44CoinTypeNode,
      {
        account: parseInt(account),
        change: parseInt(change),
      }
    );
    const extendedPrivateKey = await addressKeyDeriver(Number(addressIndex));
    privateKey = extendedPrivateKey.privateKeyBuffer!.slice(0, 32);
  } else {
    // metamask has supplied us with entropy for "m/purpose'/bip44Code'/"
    // we need to derive the final "accountIndex'/change/addressIndex"
    const extendedPrivateKey = deprecated_deriveBIP44AddressKey(
      bip44Node as Deprecated_JsonBIP44CoinTypeNode,
      {
        account: parseInt(account),
        address_index: parseInt(addressIndex),
        change: parseInt(change),
      }
    );
    privateKey = extendedPrivateKey.slice(0, 32);
  }

  return hexlify(privateKey);
}

/**
 * Return UniPass master key address from seed.
 * @param wallet
 */
export async function getMasterKeyAddress(wallet: SnapProvider) {
  const masterPrivateKey = await extractMasterPrivateKey(wallet);
  const ethersWallet = new Wallet(masterPrivateKey);

  return ethersWallet.address;
}
