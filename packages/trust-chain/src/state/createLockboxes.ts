import sodium from "libsodium-wrappers";
import { Key, Lockbox, TrustChainState } from "../types";

export const createLockboxes = (
  key: Key,
  lockboxPrivateKey: string,
  lockboxPublicKey: string,
  state: TrustChainState
) => {
  const lockboxes: { [signingPublicKey: string]: Lockbox } = {};

  Object.keys(state.members).forEach((signingPublicKey) => {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const ciphertext = sodium.crypto_box_easy(
      JSON.stringify(key),
      nonce,
      sodium.from_base64(state.members[signingPublicKey].lockboxPublicKey),
      sodium.from_base64(lockboxPrivateKey)
    );
    lockboxes[signingPublicKey] = {
      receiverSigningPublicKey: signingPublicKey,
      senderLockboxPublicKey: lockboxPublicKey,
      ciphertext: sodium.to_base64(ciphertext),
      nonce: sodium.to_base64(nonce),
    };
  });

  return {
    keyId: key.keyId,
    lockboxes,
  };
};
