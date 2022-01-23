import { InvalidEncryptedStateError, Key, RawEncryptedStateUpdate } from "..";
import { EncryptedState, TrustChainState } from "../types";
import { hashTransaction } from "../utils";
import { verifyAndApplyEncryptedState } from "./verifyAndApplyEncryptedState";

function compareByClock(a: EncryptedState, b: EncryptedState) {
  if (a.publicData.clock < b.publicData.clock) return -1;
  if (a.publicData.clock > b.publicData.clock) return 1;
  return 0;
}

function verifyClockInSortedArray(sortedEncryptedState: EncryptedState[]) {
  let currentClock = 0;
  sortedEncryptedState.forEach((encryptedState) => {
    if (!Number.isInteger(encryptedState.publicData.clock)) {
      throw new InvalidEncryptedStateError("Missing clock in the public data.");
    }
    if (encryptedState.publicData.clock === currentClock) {
      throw new InvalidEncryptedStateError(
        "Identical clock values dedected for encrypted states."
      );
    }
    currentClock = encryptedState.publicData.clock;
  });
}

export const resolveEncryptedState = (
  currentState: TrustChainState,
  encryptedState: EncryptedState[],
  keys: { [keyId: string]: string }, // TODO make sure they are signed,
  currentUserSigningPublicKey: string
) => {
  let failedToApplyAllUpdates = false;
  const sortedEncryptedState = encryptedState.sort(compareByClock);
  verifyClockInSortedArray(sortedEncryptedState);

  let state: TrustChainState = { ...currentState };
  let lastHash = null;
  let lastKey: Key = null;
  let currentUserEncryptedState: RawEncryptedStateUpdate = null;
  sortedEncryptedState.forEach((encryptedStateUpdate) => {
    const result = verifyAndApplyEncryptedState(
      state,
      encryptedStateUpdate,
      keys[encryptedStateUpdate.keyId]
    );
    if (encryptedStateUpdate.author.publicKey === currentUserSigningPublicKey) {
      currentUserEncryptedState = result.stateUpdates;
    }
    lastHash = result.hash;
    state = result.state;
    lastKey = {
      keyId: encryptedStateUpdate.keyId,
      key: keys[encryptedStateUpdate.keyId],
    };
    if (result.failed) {
      failedToApplyAllUpdates = true;
    }
  });

  const hash = hashTransaction(state);
  return {
    state,
    failedToApplyAllUpdates,
    isIdenticalContent: hash === lastHash,
    lastKey,
    currentUserEncryptedState,
  };
};
