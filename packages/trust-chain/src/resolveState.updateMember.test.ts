import sodium from "libsodium-wrappers";
import { addAuthorToEvent } from "./addAuthorToEvent";
import { InvalidTrustChainError } from "./errors";
import { createChain, resolveState, addMember, updateMember } from "./index";
import { getKeyPairA, getKeyPairB } from "./testUtils";
import { hashTransaction } from "./utils";

let keyPairA: sodium.KeyPair = null;
let keyPairB: sodium.KeyPair = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairB = getKeyPairB();
});

test("should be able to promote a member to an admin", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const state = resolveState([createEvent, addMemberEvent, updateMemberEvent]);
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
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should be able to demote an admin to a member", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addAdminEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addAdminEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const updateMemberEvent2 = addAuthorToEvent(updateMemberEvent, keyPairB);
  const state = resolveState([createEvent, addAdminEvent, updateMemberEvent2]);
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
        "canRemoveMembers": false,
        "isAdmin": false,
      },
    }
  `);
});

test("should be able to update a member's canAddMembers", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const state = resolveState([createEvent, addMemberEvent, updateMemberEvent]);
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
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
      },
    }
  `);
});

test("should be able to update a member's canRemoveMembers", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const state = resolveState([createEvent, addMemberEvent, updateMemberEvent]);
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

test("should be able to update a member's canAddMembers and canRemoveMembers", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: true }
  );
  const state = resolveState([createEvent, addMemberEvent, updateMemberEvent]);
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
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": false,
      },
    }
  `);
});

test("should fail to demote an admin to a member if not more than 50% admins agree", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addAdminEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addAdminEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const chain = [createEvent, addAdminEvent, updateMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});

test("should fail to promote an admin that is already an admin", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addAdminEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addAdminEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const updateMemberEvent2 = addAuthorToEvent(updateMemberEvent, keyPairB);
  const chain = [createEvent, addAdminEvent, updateMemberEvent2];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});

test("should fail to update a member if nothing changes and canAddMembers and canRemoveMembers are false", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const chain = [createEvent, addMemberEvent, updateMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});

test("should fail to update a member if nothing changes and canAddMembers and canRemoveMembers are true", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: true }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: true }
  );
  const chain = [createEvent, addMemberEvent, updateMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});

test("should fail to update a member if nothing changes and canAddMembers is true and canRemoveMembers is false", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const chain = [createEvent, addMemberEvent, updateMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});

test("should fail to update a member if nothing changes and canAddMembers is false and canRemoveMembers is true", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: true }
  );
  const chain = [createEvent, addMemberEvent, updateMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Not allowed member update.");
});
