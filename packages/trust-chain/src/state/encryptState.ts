import sodium from "libsodium-wrappers";
import { Key, RawEncryptedStateUpdate, TrustChainState } from "../types";
import { canonicalize, hashTransaction } from "../utils";
import { applyStateUpdates } from "./applyStateUpdates";
import { encryptAead, sign } from "./crypto";

export const encryptState = (
  currentState: TrustChainState,
  stateUpdates: RawEncryptedStateUpdate,
  key: Key,
  author: sodium.KeyPair
) => {
  const clock = currentState.encryptedStateClock + 1;
  const newState = applyStateUpdates(
    currentState,
    stateUpdates,
    sodium.to_base64(author.publicKey),
    clock
  );
  const hash = hashTransaction(newState);
  const encryptedStateUpdateWithHash = { ...stateUpdates, hash };

  const publicData = { clock };
  const publicDataAsBase64 = sodium.to_base64(canonicalize(publicData));
  const { ciphertext, publicNonce } = encryptAead(
    JSON.stringify(encryptedStateUpdateWithHash),
    publicDataAsBase64,
    sodium.from_base64(key.key)
  );
  const ciphertextAsBase64 = sodium.to_base64(ciphertext);
  const nonceAsBase64 = sodium.to_base64(publicNonce);
  return {
    ciphertext: ciphertextAsBase64,
    nonce: nonceAsBase64,
    keyId: key.keyId,
    publicData,
    author: {
      publicKey: sodium.to_base64(author.publicKey),
      signature: sodium.to_base64(
        sign(
          `${nonceAsBase64}${ciphertextAsBase64}${publicDataAsBase64}`,
          author.privateKey
        )
      ),
    },
  };
};
