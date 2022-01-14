export type Permission = "canAddMembers" | "canRemoveMembers";

export type CreateChainTransaction = {
  type: "create";
  id: string;
  admins: string[];
};

export type AddMemberTransaction =
  | {
      type: "add-member";
      memberPublicKey: string;
      isAdmin: true;
      canAddMembers: true;
      canRemoveMembers: true;
    }
  | {
      type: "add-member";
      memberPublicKey: string;
      isAdmin: false;
      canAddMembers: boolean;
      canRemoveMembers: boolean;
    };

export type UpdateMemberTransaction =
  | {
      type: "update-member";
      memberPublicKey: string;
      isAdmin: true;
      canAddMembers: true;
      canRemoveMembers: true;
    }
  | {
      type: "update-member";
      memberPublicKey: string;
      isAdmin: false;
      canAddMembers: boolean;
      canRemoveMembers: boolean;
    };

export type RemoveMemberTransaction = {
  type: "remove-member";
  memberPublicKey: string;
};

export type Author = {
  publicKey: string;
  signature: string;
};

export type CreateChainTrustChainEvent = {
  authors: Author[];
  transaction: CreateChainTransaction;
  prevHash: null;
};

export type DefaultTrustChainEvent = {
  authors: Author[];
  transaction:
    | AddMemberTransaction
    | UpdateMemberTransaction
    | RemoveMemberTransaction;
  prevHash: string;
};

export type TrustChainEvent =
  | CreateChainTrustChainEvent
  | DefaultTrustChainEvent;

export type MemberAuthorization =
  | {
      isAdmin: true;
      canAddMembers: true;
      canRemoveMembers: true;
    }
  | {
      isAdmin: false;
      canAddMembers: boolean;
      canRemoveMembers: boolean;
    };

export type MemberProperties =
  | {
      isAdmin: true;
      canAddMembers: true;
      canRemoveMembers: true;
      addedBy: string[];
      name?: string;
      profileUpdatedBy?: string;
    }
  | {
      isAdmin: false;
      canAddMembers: boolean;
      canRemoveMembers: boolean;
      addedBy: string[];
      name?: string;
      profileUpdatedBy?: string;
    };

export type TrustChainState = {
  id: string;
  // TODO split up into a better structure
  members: { [publicKey: string]: MemberProperties };
  lastEventHash: string;
  encryptedStateClock: number;
  trustChainStateVersion: number; // allows to know when to recompute the state after a bug fix
};

// encrypted state

export type Key = {
  keyId: string;
  key: string;
};

export type EncryptedState = {
  ciphertext: string;
  nonce: string;
  keyId: string;
  publicData: { clock: number };
  author: Author;
};

export type EncryptedMemberStateUpdate = {
  name: string;
};

export type RawEncryptedStateUpdate = {
  members: { [publicKey: string]: EncryptedMemberStateUpdate };
};

export type EncryptedStateUpdate = {
  members: { [publicKey: string]: EncryptedMemberStateUpdate };
  hash: string; // this hash ensures that all participants end up with the same state
  // TODO add the chain hash as well to ensure integrity?
};
