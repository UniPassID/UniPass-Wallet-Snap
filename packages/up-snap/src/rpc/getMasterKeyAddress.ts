import {
  getBIP44AddressKeyDeriver,
  // JsonBIP44CoinTypeNode,
} from '@metamask/key-tree';
// import { getMetamaskVersion, isNewerVersion } from '../util/version'
import { hexlify, sha256, toUtf8Bytes } from 'ethers/lib/utils';
import { Wallet } from 'ethers';
import { MasterKeyAddressRequest } from '../interface';

/**
 * Return private key from seed.
 * @param wallet
 */
export async function extractMasterPrivateKey(
  email: string,
): Promise<string> {
  let emailForAddress = ''
  emailForAddress = email
  const emailHash = sha256(toUtf8Bytes(email))
  const bip44Code = '60';
  const account = '100';
  const change = emailHash.substring(emailHash.length - 4, emailHash.length - 2)
  const addressIndex = emailHash.substring(emailHash.length - 2)

  // let bip44Node: JsonBIP44CoinTypeNode;


  // const currentVersion = await getMetamaskVersion();
  // if (isNewerVersion("MetaMask/v10.18.99-flask.0", currentVersion))
  let bip44Node = (await snap.request({
      method: "snap_getBip44Entropy",
      params: {
        coinType: Number(bip44Code),
      },
    }))
  // else
  //   bip44Node = (await ethereum.request({
  //     method: `snap_getBip44Entropy_${bip44Code}`,
  //     params: [],
  //   })) as JsonBIP44CoinTypeNode;

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
 */
export async function getMasterKeyAddress(params: MasterKeyAddressRequest) {
  const masterPrivateKey = await extractMasterPrivateKey(params.email);

  const ethersWallet = new Wallet(masterPrivateKey);

  return ethersWallet.address;
}
