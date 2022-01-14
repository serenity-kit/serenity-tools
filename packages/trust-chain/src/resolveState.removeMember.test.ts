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

test("should be able to remove a member as member with the permission canRemoveMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const removeMemberEvent = removeMember(
    hashTransaction(addMemberEvent2.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey)
  );
  const state = resolveState([
    createEvent,
    addMemberEvent,
    addMemberEvent2,
    removeMemberEvent,
  ]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": false,
        "canRemoveMembers": true,
        "isAdmin": false,
      },
    }
  `);
});

test("should not be able to remove a member as member without the permission canRemoveMember", async () => {
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
    keyPairA,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const removeMemberEvent = removeMember(
    hashTransaction(addMemberEvent2.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey)
  );
  const chain = [
    createEvent,
    addMemberEvent,
    addMemberEvent2,
    removeMemberEvent,
  ];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to remove a member.");
});

test("should not be able to remove an admin as member without the permission canRemoveMember", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const removeMemberEvent = removeMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairA.publicKey)
  );
  const chain = [createEvent, addMemberEvent, removeMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to remove an admin.");
});

test("should be able to remove a member as admin", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const removeMemberEvent = removeMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey)
  );
  const state = resolveState([createEvent, addMemberEvent, removeMemberEvent]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should not be able to remove the last admin", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const removeMemberEvent = removeMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairA.publicKey)
  );
  const chain = [createEvent, addMemberEvent, removeMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow(
    "Not allowed to remove the last admin."
  );
});

test("should be able to remove an admin as admin", async () => {
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
  const removeAdminEvent = removeMember(
    hashTransaction(addAdminEvent3.transaction),
    keyPairB,
    sodium.to_base64(keyPairA.publicKey)
  );
  const removeAdminEvent2 = addAuthorToEvent(removeAdminEvent, keyPairC);
  const removeAdminEvent3 = removeMember(
    hashTransaction(removeAdminEvent2.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey)
  );
  const removeAdminEvent4 = addAuthorToEvent(removeAdminEvent3, keyPairC);
  const state = resolveState([
    createEvent,
    addAdminEvent,
    addAdminEvent3,
    removeAdminEvent2,
    removeAdminEvent4,
  ]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should not be able to remove an admin if no more than 50% of admins signed the transaction", async () => {
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
  const removeAdminEvent = removeMember(
    hashTransaction(addAdminEvent3.transaction),
    keyPairB,
    sodium.to_base64(keyPairA.publicKey)
  );
  const chain = [createEvent, addAdminEvent, addAdminEvent3, removeAdminEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed to remove an admin.");
});

test("should throw in case the member does not exist", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const removeMemberEvent = removeMember(
    hashTransaction(createEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairB.publicKey)
  );
  const chain = [createEvent, removeMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow(
    "Failed to remove non-existing member."
  );
});

test("should not be able to remove the last member", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const eventRemoveMember = removeMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairA.publicKey)
  );
  expect(() => resolveState([createEvent, eventRemoveMember])).toThrow(
    InvalidTrustChainError
  );
  expect(() => resolveState([createEvent, eventRemoveMember])).toThrow(
    "Not allowed to remove last member."
  );
});
