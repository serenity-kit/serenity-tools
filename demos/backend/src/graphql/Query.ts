import { queryType, objectType, arg } from "nexus";
import { getOrganizations } from "../database/getOrganizations";

const Event = objectType({
  name: "Event",
  definition(t) {
    t.string("content");
  },
});

const EventProposal = objectType({
  name: "EventProposal",
  definition(t) {
    t.string("id");
    t.string("content");
  },
});

const Lockbox = objectType({
  name: "Lockbox",
  definition(t) {
    t.string("keyId");
    t.string("receiverSigningPublicKey");
    t.string("senderLockboxPublicKey");
    t.string("ciphertext");
    t.string("nonce");
  },
});

const Author = objectType({
  name: "Author",
  definition(t) {
    t.string("publicKey");
    t.string("signature");
  },
});

const EncryptedState = objectType({
  name: "EncryptedState",
  definition(t) {
    t.string("keyId");
    t.string("ciphertext");
    t.string("nonce");
    t.string("publicData");
    t.field("lockbox", { type: Lockbox });
    t.field("author", { type: Author });
  },
});

const Organization = objectType({
  name: "Organization",
  definition(t) {
    t.id("id");
    t.list.field("events", { type: Event });
    t.list.field("eventProposals", { type: EventProposal });
    t.list.field("encryptedStates", { type: EncryptedState });
  },
});

export const Query = queryType({
  definition(t) {
    t.list.field("organizations", {
      type: Organization,
      args: {
        signingPublicKey: arg({ type: "String" }),
      },
      async resolve(root, args, ctx) {
        return await getOrganizations(args.signingPublicKey, ctx.session);
      },
    });
  },
});
