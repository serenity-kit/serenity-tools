import sodium from "libsodium-wrappers";
import { Lockbox } from "../types";

export const decryptLockbox = (privateKey: string, lockbox: Lockbox) => {
  const decrypted = sodium.crypto_box_open_easy(
    sodium.from_base64(lockbox.ciphertext),
    sodium.from_base64(lockbox.nonce),
    sodium.from_base64(lockbox.senderLockboxPublicKey),
    sodium.from_base64(privateKey)
  );

  return JSON.parse(sodium.to_string(decrypted));
};
