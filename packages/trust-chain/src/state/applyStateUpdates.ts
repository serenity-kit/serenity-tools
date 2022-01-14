import { RawEncryptedStateUpdate, TrustChainState } from "../types";

export const applyStateUpdates = (
  currentState: TrustChainState,
  stateUpdates: RawEncryptedStateUpdate,
  authorPublicKey: string,
  clock: number
): TrustChainState => {
  const newState = { ...currentState };
  if (stateUpdates.hasOwnProperty("members")) {
    Object.keys(stateUpdates.members).forEach((key) => {
      if (
        newState.members[authorPublicKey]?.isAdmin ||
        (newState.members[key]?.addedBy.includes(authorPublicKey) &&
          // the member to be updated is not an admin
          !newState.members[key].isAdmin &&
          // prevent overwritting when already updated by an admin
          !(
            newState.members[key]?.profileUpdatedBy &&
            newState.members[newState.members[key].profileUpdatedBy].isAdmin
          ))
      ) {
        newState.members[key] = {
          ...newState.members[key],
          name: stateUpdates.members[key].name,
          profileUpdatedBy: authorPublicKey,
        };
      }
    });
  }

  return {
    ...newState,
    encryptedStateClock: clock,
  };
};
