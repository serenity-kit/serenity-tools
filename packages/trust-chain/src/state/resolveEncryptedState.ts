import { InvalidEncryptedStateError } from "..";
import { EncryptedState, TrustChainState } from "../types";
import { hashTransaction } from "../utils";
import { encryptState } from "./encryptState";
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
  keys: { [publicKey: string]: string } // TODO make sure they are signed
) => {
  let failedToApplyAllUpdates = false;
  const sortedEncryptedState = encryptedState.sort(compareByClock);
  verifyClockInSortedArray(sortedEncryptedState);

  let state: TrustChainState = { ...currentState };
  let lastHash = null;
  sortedEncryptedState.forEach((encryptedStateUpdate) => {
    const result = verifyAndApplyEncryptedState(
      state,
      encryptedStateUpdate,
      keys[encryptedStateUpdate.keyId]
    );
    lastHash = result.hash;
    state = result.state;
    if (result.failed) {
      failedToApplyAllUpdates = true;
    }
  });

  const hash = hashTransaction(state);
  return {
    state,
    failedToApplyAllUpdates,
    isIdenticalContent: hash === lastHash,
  };
};
