import sodium from "libsodium-wrappers";
import {
  EncryptedState,
  EncryptedStateUpdate,
  TrustChainState,
} from "../types";
import { applyStateUpdates } from "./applyStateUpdates";
import { decryptAead, verifySignature } from "./crypto";

export const verifyAndApplyEncryptedState = (
  currentState: TrustChainState,
  { nonce, ciphertext, publicData, author }: EncryptedState,
  key: string
) => {
  // A single user should not be possible to break the entry state.
  try {
    if (
      !verifySignature(
        `${nonce}${ciphertext}${sodium.to_base64(JSON.stringify(publicData))}`,
        sodium.from_base64(author.signature),
        sodium.from_base64(author.publicKey)
      )
    ) {
      throw new Error("Invalid Signature"); // TODO convert to custom error
    }

    const decryptedContent = decryptAead(
      sodium.from_base64(ciphertext),
      sodium.to_base64(JSON.stringify(publicData)),
      sodium.from_base64(key),
      sodium.from_base64(nonce)
    );
    const stateUpdates: EncryptedStateUpdate = JSON.parse(
      sodium.to_string(decryptedContent)
    );
    const newState = applyStateUpdates(
      currentState,
      stateUpdates,
      author.publicKey,
      publicData.clock
    );
    return { state: newState, hash: stateUpdates.hash, failed: false };
  } catch (err) {
    return { state: currentState, hash: null, failed: false };
  }
};
