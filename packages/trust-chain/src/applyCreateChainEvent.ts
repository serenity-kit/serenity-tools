import {
  CreateChainTrustChainEvent,
  MemberProperties,
  TrustChainState,
} from "./types";
import { hashTransaction, isValidCreateChainEvent } from "./utils";
import { InvalidTrustChainError } from "./errors";

export const applyCreateChainEvent = (
  event: CreateChainTrustChainEvent
): TrustChainState => {
  if (!isValidCreateChainEvent(event)) {
    throw new InvalidTrustChainError("Invalid chain creation event.");
  }

  let members: { [publicKey: string]: MemberProperties } = {};
  event.authors.forEach((author) => {
    members[author.publicKey] = {
      isAdmin: true,
      canAddMembers: true,
      canRemoveMembers: true,
      addedBy: event.authors.map((author) => author.publicKey),
    };
  });

  return {
    id: event.transaction.id,
    members,
    lastEventHash: hashTransaction(event.transaction),
    trustChainStateVersion: 1,
    encryptedStateClock: 0,
  };
};
