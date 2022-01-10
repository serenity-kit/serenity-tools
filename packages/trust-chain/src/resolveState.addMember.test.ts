import sodium from "libsodium-wrappers";
import { addAuthorToEvent } from "./addAuthorToEvent";
import { InvalidTrustChainError } from "./errors";
import { createChain, resolveState, addMember, removeMember } from "./index";
import { getKeyPairA, getKeyPairB, getKeyPairC } from "./testUtils";
import { hashTransaction } from "./utils";

let keyPairA: sodium.KeyPair = null;
let keyPairB: sodium.KeyPair = null;
let keyPairC: sodium.KeyPair = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairB = getKeyPairB();
  keyPairC = getKeyPairC();
});

test("should be able to add a member as member with the permission canAddMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const state = resolveState([createEvent, addMemberEvent, addMemberEvent2]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
      },
    }
  `);
});

test("should not be able to add a member as member without the permission canAddMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to add a member.");
});

test("should not be able to add an admin as member with the permission canAddMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const chain = [createEvent, addMemberEvent, addMemberEvent2];

  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to add an admin.");
});

test("should not be able to add a member with canAddMember as member with the permission canAddMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const chain = [createEvent, addMemberEvent, addMemberEvent2];

  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow(
    "Not allowed to add a member with canAddMembers."
  );
});

test("should be able to add an admin as admins", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addAdminEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const addAdminEvent2 = addMember(
    hashTransaction(addAdminEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const addAdminEvent3 = addAuthorToEvent(addAdminEvent2, keyPairB);
  const state = resolveState([createEvent, addAdminEvent, addAdminEvent3]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should not be able to add an admin if no more than 50% of admins signed the transaction", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addAdminEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const addAdminEvent2 = addMember(
    hashTransaction(addAdminEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const chain = [createEvent, addAdminEvent, addAdminEvent2];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to add an admin.");
});
