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

export type TrustChainState = {
  id: string;
  members: { [publicKey: string]: MemberAuthorization };
  lastEventHash: string;
  trustChainStateVersion: number; // allows to know when to recompute the state after a bug fix
};
