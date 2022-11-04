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
    change: parseInt(change),
  });

  const extendedPrivateKey = await addressKeyDeriver(Number(addressIndex));
  const privateKey = extendedPrivateKey.privateKeyBuffer!.slice(0, 32);

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
