import sodium from "libsodium-wrappers";
import { addMember, createChain, resolveState, updateMember } from "..";
import { getKeyPairA, getKeyPairB, getKeyPairC } from "../testUtils";
import { hashTransaction } from "../utils";
import { createKey } from "./createKey";
import { encryptState } from "./encryptState";
import { resolveEncryptedState } from "./resolveEncryptedState";

let keyPairA: sodium.KeyPair = null;
let keyPairB: sodium.KeyPair = null;
let keyPairC: sodium.KeyPair = null;
let keyPairAPublicKey: string = null;
let keyPairCPublicKey: string = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairB = getKeyPairB();
  keyPairC = getKeyPairC();
  keyPairAPublicKey = sodium.to_base64(keyPairA.publicKey);
  keyPairCPublicKey = sodium.to_base64(keyPairC.publicKey);
});

test("should allow the client to add a member to set the name", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Anna" } } },
    key,
    keyPairB
  );

  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
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
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "name": "Anna",
        "profileUpdatedBy": "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
      },
    }
  `);
});

test("should allow an admin to update the name of a member added by someone else", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Anna" } } },
    key,
    keyPairA
  );

  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
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
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "name": "Anna",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should allow an admin to overwrite the name of a member", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Nik" } } },
    key,
    keyPairB
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairCPublicKey]: { name: "Niko" } } },
    key,
    keyPairA
  );
  const result3 = resolveEncryptedState(
    state,
    [encryptedState, encryptedState2],
    keys
  );

  expect(result3.state.members).toMatchInlineSnapshot(`
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
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "name": "Niko",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should not allow for a member to overwrite the name set by an admin", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Nik" } } },
    key,
    keyPairA
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairCPublicKey]: { name: "Niko" } } },
    key,
    keyPairB
  );
  const result3 = resolveEncryptedState(
    result2.state,
    [encryptedState, encryptedState2],
    keys
  );

  expect(result3.state.members).toMatchInlineSnapshot(`
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
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "name": "Nik",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should not allow for a member to overwrite the name added by the member, but later promoted to admin", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent2.transaction),
    keyPairA,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const chain = [
    createEvent,
    addMemberEvent,
    addMemberEvent2,
    updateMemberEvent,
  ];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairB
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
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
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});
