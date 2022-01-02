import sodium from "libsodium-wrappers";
import {
  TrustChainEvent,
  Permission,
  DefaultTrustChainEvent,
  TrustChainState,
} from "./types";

export const hashTransaction = (transaction) => {
  return sodium.to_base64(
    sodium.crypto_generichash(64, JSON.stringify(transaction))
  );
};

export const isValidCreateChainEvent = (event: TrustChainEvent) => {
  if (event.transaction.type !== "create" || event.prevHash !== null) {
    return false;
  }
  if (event.transaction.admins.length !== event.authors.length) {
    return false;
  }
  const admins = event.transaction.admins;
  const hash = sodium.to_base64(
    sodium.crypto_generichash(64, JSON.stringify(event.transaction))
  );
  return event.authors.every((author) => {
    if (!admins.includes(author.publicKey)) {
      return false;
    }
    return sodium.crypto_sign_verify_detached(
      sodium.from_base64(author.signature),
      hash,
      sodium.from_base64(author.publicKey)
    );
  });
};

export const areValidPermissions = (
  state: TrustChainState,
  event: DefaultTrustChainEvent,
  permission: Permission
) => {
  return event.authors.every((author) => {
    if (!state.members.hasOwnProperty(author.publicKey)) {
      return false;
    }
    if (!state.members[author.publicKey][permission]) {
      return false;
    }
    return true;
  });
};

export const allAuthorsAreValidAdmins = (
  state: TrustChainState,
  event: DefaultTrustChainEvent
) => {
  return event.authors.every((author) => {
    if (!state.members.hasOwnProperty(author.publicKey)) {
      return false;
    }
    if (!state.members[author.publicKey].isAdmin) {
      return false;
    }
    return true;
  });
};

export const getAdminCount = (state: TrustChainState) => {
  let adminCount = 0;
  Object.keys(state.members).forEach((memberKey) => {
    if (state.members[memberKey].isAdmin) {
      adminCount = adminCount + 1;
    }
  });
  return adminCount;
};

export const isValidAdminDecision = (
  state: TrustChainState,
  event: DefaultTrustChainEvent
) => {
  if (!allAuthorsAreValidAdmins(state, event as DefaultTrustChainEvent)) {
    return false;
  }
  const adminCount = getAdminCount(state);
  if (event.authors.length > adminCount / 2) {
    return true;
  }
  return false;
};
