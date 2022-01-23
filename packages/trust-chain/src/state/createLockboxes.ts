import { Key, Lockbox, TrustChainState } from "../types";
import { createLockbox } from "./createLockbox";

export const createLockboxes = (
  key: Key,
  lockboxPrivateKey: string,
  lockboxPublicKey: string,
  state: TrustChainState
) => {
  const lockboxes: { [signingPublicKey: string]: Lockbox } = {};

  Object.keys(state.members).forEach((signingPublicKey) => {
    lockboxes[signingPublicKey] = createLockbox(
      key,
      lockboxPrivateKey,
      lockboxPublicKey,
      signingPublicKey,
      state.members[signingPublicKey].lockboxPublicKey
    );
  });

  return {
    keyId: key.keyId,
    lockboxes,
  };
};
