import {
  CreateChainTrustChainEvent,
  MemberAuthorization,
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

  let members: { [publicKey: string]: MemberAuthorization } = {};
  event.authors.forEach((author) => {
    members[author.publicKey] = {
      isAdmin: true,
      canAddMembers: true,
      canRemoveMembers: true,
    };
  });

  return {
    id: event.transaction.id,
    members,
    lastEventHash: hashTransaction(event.transaction),
    trustChainStateVersion: 1,
  };
};
