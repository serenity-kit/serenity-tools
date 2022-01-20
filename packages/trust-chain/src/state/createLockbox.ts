import sodium from "libsodium-wrappers";
import { Key, Lockbox } from "../types";

export const createLockbox = (
  key: Key,
  lockboxPrivateKey: string,
  senderLockboxPublicKey: string,
  receiverSigningPublicKey: string,
  receiverLockboxPublicKey: string
): Lockbox => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(
    JSON.stringify(key),
    nonce,
    sodium.from_base64(receiverLockboxPublicKey),
    sodium.from_base64(lockboxPrivateKey)
  );
  return {
    receiverSigningPublicKey: receiverSigningPublicKey,
    senderLockboxPublicKey: senderLockboxPublicKey,
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
};
