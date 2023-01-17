import { arrayify, concat, hexlify, randomBytes, toUtf8Bytes, toUtf8String } from 'ethers/lib/utils'

export const encryptSessionKey = async (
  privkey: string,
): Promise<{ encrypted_key: string; aes_key: CryptoKey }> => {
  const iv = randomBytes(16)
  const aes_key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )

  const encryptedPrivkey = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv,
    },
    aes_key,
    toUtf8Bytes(privkey),
  )

  return {
    encrypted_key: hexlify(concat([hexlify(iv), hexlify(new Uint8Array(encryptedPrivkey))])),
    aes_key,
  }
}

export async function decryptSessionKey(
  aes_key: CryptoKey,
  encrypted_key: string,
): Promise<string> {
  const buffer = arrayify(encrypted_key)

  const privkey = await window.crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: buffer.slice(0, 16),
    },
    aes_key,
    buffer.slice(16),
  )

  return toUtf8String(new Uint8Array(privkey))
}
