import React, { Fragment } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  addMember,
  applyEvent,
  createChain,
  KeyPairBase64,
  removeMember,
  resolveState,
  TrustChainState,
  updateMember,
  getAdminCount,
  MemberAuthorization,
  isValidAdminDecision,
  addAuthorToEvent,
  DefaultTrustChainEvent,
  createKey,
  createLockboxes,
  encryptState,
  resolveEncryptedState,
  decryptLockbox,
  createLockbox,
  Key,
  sign,
} from "@serenity-tools/trust-chain";
import { useMutation, useQuery } from "urql";
import sodium from "libsodium-wrappers";
import { createUserMutationString } from "../graphql/mutations/createUser";
import { createOrganizationMutationString } from "../graphql/mutations/createOrganization";
import { addMemberToOrganizationMutationString } from "../graphql/mutations/addMemberToOrganization";
import { removeMemberFromOrganizationMutationString } from "../graphql/mutations/removeMemberFromOrganization";
import { updateOrganizationMemberMutationString } from "../graphql/mutations/updateOrganizationMember";
import { addEventProposalToOrganizationMutationString } from "../graphql/mutations/addEventProposalToOrganization";
import { organizationsQueryString } from "../graphql/queries/organizations";
import { createNewUserKeys } from "../utils/createNewUserKeys";
import { convertToSigningKeyPair } from "../utils/convertToSigningKeyPair";
import { updateOrganizationEventProposalMutationString } from "../graphql/mutations/updateOrganizationEventProposal";
import { deleteOrganizationEventProposalMutationString } from "../graphql/mutations/deleteOrganizationEventProposal";
import { requestAuthenticationChallengeMutationString } from "../graphql/mutations/requestAuthenticationChallenge";
import { authenticateMutationString } from "../graphql/mutations/authenticate";

type User = {
  sign: KeyPairBase64;
  lockbox: KeyPairBase64;
};

export default function App() {
  // NOTE: Never store a privateKey in an unsecure storage like Localstorage
  // This here is only for demo purposes
  const [currentUser, setCurrentUser] = useLocalStorage<User>(
    "currentUser",
    null
  );
  const [hasActiveSession, setHasActiveSession] = useLocalStorage<boolean>(
    "hasActiveSession",
    false
  );
  const [, createUserMutation] = useMutation(createUserMutationString);
  const [, createOrganizationMutation] = useMutation(
    createOrganizationMutationString
  );
  const [, addMemberToOrganizationMutation] = useMutation(
    addMemberToOrganizationMutationString
  );
  const [, removeMemberFromOrganizationMutation] = useMutation(
    removeMemberFromOrganizationMutationString
  );
  const [, updateOrganizationMemberMutation] = useMutation(
    updateOrganizationMemberMutationString
  );
  const [, addEventProposalToOrganizationMutation] = useMutation(
    addEventProposalToOrganizationMutationString
  );
  const [, updateOrganizationEventProposalMutation] = useMutation(
    updateOrganizationEventProposalMutationString
  );
  const [, deleteOrganizationEventProposalMutation] = useMutation(
    deleteOrganizationEventProposalMutationString
  );
  const [, requestAuthenticationChallengeMutation] = useMutation(
    requestAuthenticationChallengeMutationString
  );
  const [, authenticateMutation] = useMutation(authenticateMutationString);

  const [organizationsQueryResult, refetchOrganizations] = useQuery({
    query: organizationsQueryString,
    variables: { signingPublicKey: currentUser?.sign.publicKey },
  });

  const refresh = async () => {
    await refetchOrganizations({ requestPolicy: "network-only" });
  };

  const organizations: (TrustChainState & {
    eventProposals: any[];
    lastKey: Key;
    currentUserEncryptedState: any;
  })[] =
    organizationsQueryResult?.data?.organizations
      ?.map(
        (
          org
        ):
          | (TrustChainState & {
              eventProposals: any[];
              lastKey: Key;
              currentUserEncryptedState: any;
            })
          | null => {
          const events = org.events.map((event) => JSON.parse(event.content));
          if (!events) return null;

          const keys = {};
          const encryptedStates = org.encryptedStates.map((encryptedState) => {
            const result = decryptLockbox(
              currentUser.lockbox.privateKey,
              encryptedState.lockbox
            );
            keys[result.keyId] = result.key;
            return {
              ...encryptedState,
              publicData: JSON.parse(encryptedState.publicData),
            };
          });

          const state = resolveState(events);
          const fullState = resolveEncryptedState(
            state,
            encryptedStates,
            keys,
            currentUser.sign.publicKey
          );

          if (
            fullState.failedToApplyAllUpdates
            // TODO handle isIdenticalContent
            // || !fullState.isIdenticalContent
          ) {
            alert(
              "Warning: Failed to apply all updates correctly. You might miss the latest organization or member name updates."
            );
          }

          try {
            return {
              ...fullState.state,
              eventProposals: org.eventProposals,
              lastKey: fullState.lastKey,
              currentUserEncryptedState: fullState.currentUserEncryptedState,
            };
          } catch (err) {
            return null;
          }
        }
      )
      .filter((org) => org !== null) || [];

  const updateMemberFunc = async (
    state,
    signingPublicKey,
    authorization: MemberAuthorization
  ) => {
    const event = updateMember(
      state.lastEventHash,
      convertToSigningKeyPair(currentUser.sign),
      signingPublicKey,
      authorization
    );
    applyEvent(state, event);
    const result = await updateOrganizationMemberMutation({
      input: {
        organizationId: state.id,
        event: JSON.stringify(event),
      },
    });
    if (result.data.updateOrganizationMember === null) {
      alert("Failed to update the member");
    }
    await refresh();
  };

  const proposeMemberUpdate = async (
    state,
    signingPublicKey,
    authorization: MemberAuthorization
  ) => {
    const event = updateMember(
      state.lastEventHash,
      convertToSigningKeyPair(currentUser.sign),
      signingPublicKey,
      authorization
    );
    const result = await addEventProposalToOrganizationMutation({
      input: {
        organizationId: state.id,
        event: JSON.stringify(event),
      },
    });
    if (result.data.addEventProposalToOrganization === null) {
      alert("Failed to add the proposal");
    }
    await refresh();
  };

  return (
    <main>
      <h1>Trust Chain</h1>
      {currentUser ? (
        <div>
          <h2>Current User</h2>
          <pre>{JSON.stringify(currentUser, undefined, 2)}</pre>
          <button
            onClick={() => {
              setCurrentUser(null);
              // TODO handle this on the remote
            }}
          >
            Delete current user from local storage
          </button>
          <button
            disabled={hasActiveSession}
            onClick={async () => {
              const result = await requestAuthenticationChallengeMutation({
                input: { signingPublicKey: currentUser.sign.publicKey },
              });
              // TODO move the nonce verification + signing into the trust-chain package as util
              if (
                result?.data?.requestAuthenticationChallenge?.nonce &&
                result.data.requestAuthenticationChallenge.nonce.startsWith(
                  "server-auth-"
                ) &&
                result.data.requestAuthenticationChallenge.nonce.length === 48
              ) {
                const authResult = await authenticateMutation({
                  input: {
                    signingPublicKey: currentUser.sign.publicKey,
                    nonce: result.data.requestAuthenticationChallenge.nonce,
                    nonceSignature: sodium.to_base64(
                      sign(
                        result.data.requestAuthenticationChallenge.nonce,
                        sodium.from_base64(currentUser.sign.privateKey)
                      )
                    ),
                  },
                });
                if (authResult?.data?.authenticate?.success) {
                  await refresh();
                  setHasActiveSession(true);
                } else {
                  setHasActiveSession(false);
                }
              } else {
                alert("Failed to sign in.");
              }
            }}
          >
            Login
          </button>
          <button
            // disabled={!hasActiveSession}
            onClick={async () => {
              // const result = await requestAuthenticationChallengeMutation({
              //   input: { signingPublicKey: currentUser.sign.publicKey },
              // });
              // // TODO move the nonce verification + signing into the trust-chain package as util
              // if ()
              // } else {
              //   alert("Failed to sign out.");
              // }
              setHasActiveSession(false);
              // alert("Failed to sign out");
            }}
          >
            Logout (not implemented yet)
          </button>
          <div>
            <h2>Organizations</h2>
            {organizations.map((org) => {
              const currentUserIsAdmin =
                org.members[currentUser.sign.publicKey].isAdmin;
              return (
                <div key={org.id}>
                  <pre>{JSON.stringify(org.id, undefined, 2)}</pre>
                  <pre>
                    Last Key: {JSON.stringify(org.lastKey, undefined, 2)}
                  </pre>

                  <div>
                    <h3>Event Proposals</h3>
                    {org.eventProposals.map((eventProposal) => {
                      const event: DefaultTrustChainEvent = JSON.parse(
                        eventProposal.content
                      );
                      return (
                        <Fragment key={eventProposal.id}>
                          <pre>
                            <div>{eventProposal.id}</div>
                            {JSON.stringify(event, undefined, 2)}
                          </pre>
                          <button
                            type="button"
                            disabled={!currentUserIsAdmin}
                            onClick={async () => {
                              const newEvent = addAuthorToEvent(
                                event,
                                convertToSigningKeyPair(currentUser.sign)
                              );

                              const result =
                                await updateOrganizationEventProposalMutation({
                                  input: {
                                    eventProposalId: eventProposal.id,
                                    event: JSON.stringify(newEvent),
                                  },
                                });
                              if (
                                result.data.updateOrganizationEventProposal ===
                                null
                              ) {
                                alert("Failed to sign the event");
                              }
                              await refresh();
                            }}
                          >
                            Sign event
                          </button>
                          <button
                            type="button"
                            disabled={!isValidAdminDecision(org, event)}
                            onClick={async () => {
                              if (event.transaction.type === "update-member") {
                                applyEvent(org, event);
                                const result =
                                  await updateOrganizationMemberMutation({
                                    input: {
                                      organizationId: org.id,
                                      event: JSON.stringify(event),
                                      eventProposalId: eventProposal.id,
                                    },
                                  });
                                if (
                                  result.data.updateOrganizationMember === null
                                ) {
                                  alert("Failed to update the member");
                                }
                                await refresh();
                              } else if (
                                event.transaction.type === "add-member"
                              ) {
                                alert(
                                  "Adding member is currently not allowed."
                                );
                              } else if (
                                event.transaction.type === "remove-member"
                              ) {
                                applyEvent(org, event);
                                await removeMemberFromOrganizationMutation({
                                  input: {
                                    organizationId: org.id,
                                    event: JSON.stringify(event),
                                    eventProposalId: eventProposal.id,
                                  },
                                });
                                await refresh();
                              }
                            }}
                          >
                            Submit event
                          </button>
                          <button
                            type="button"
                            disabled={!currentUserIsAdmin}
                            onClick={async () => {
                              const result =
                                await deleteOrganizationEventProposalMutation({
                                  input: { eventProposalId: eventProposal.id },
                                });
                              if (
                                result.data.deleteOrganizationEventProposal ===
                                null
                              ) {
                                alert("Failed to delete the event proposal");
                              }
                              await refresh();
                            }}
                          >
                            Delete event proposal
                          </button>
                        </Fragment>
                      );
                    })}
                  </div>

                  <div>
                    <h3>Members</h3>
                    {Object.keys(org.members).map((key) => {
                      return (
                        <div key={key}>
                          <pre>
                            <div>
                              <h4>
                                {org.members[key].name} ({key})
                              </h4>
                            </div>
                            {JSON.stringify(org.members[key], undefined, 2)}

                            {getAdminCount(org) > 1 ? (
                              <button
                                type="button"
                                disabled={!currentUserIsAdmin}
                                onClick={() => {
                                  org.members[key].isAdmin
                                    ? proposeMemberUpdate(org, key, {
                                        isAdmin: false,
                                        canAddMembers: false,
                                        canRemoveMembers: false,
                                      })
                                    : proposeMemberUpdate(org, key, {
                                        isAdmin: true,
                                        canAddMembers: true,
                                        canRemoveMembers: true,
                                      });
                                }}
                              >
                                {org.members[key].isAdmin
                                  ? "Propose to demote to member"
                                  : "Propose to promote to admin"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!currentUserIsAdmin}
                                onClick={() => {
                                  org.members[key].isAdmin
                                    ? updateMemberFunc(org, key, {
                                        isAdmin: false,
                                        canAddMembers: false,
                                        canRemoveMembers: false,
                                      })
                                    : updateMemberFunc(org, key, {
                                        isAdmin: true,
                                        canAddMembers: true,
                                        canRemoveMembers: true,
                                      });
                                }}
                              >
                                {org.members[key].isAdmin
                                  ? "Demote to member"
                                  : "Promote to admin"}
                              </button>
                            )}

                            {!org.members[key].isAdmin && (
                              <form
                                onSubmit={async (formEvent) => {
                                  formEvent.preventDefault();
                                  updateMemberFunc(org, key, {
                                    isAdmin: false,
                                    canAddMembers: formEvent.target[0].checked,
                                    canRemoveMembers:
                                      formEvent.target[1].checked,
                                  });
                                }}
                              >
                                <label>
                                  canAddMembers
                                  <input
                                    disabled={!currentUserIsAdmin}
                                    type="checkbox"
                                    defaultChecked={
                                      org.members[key].canAddMembers
                                    }
                                  />
                                </label>
                                <label>
                                  canRemoveMembers
                                  <input
                                    disabled={!currentUserIsAdmin}
                                    type="checkbox"
                                    defaultChecked={
                                      org.members[key].canRemoveMembers
                                    }
                                  />
                                </label>

                                <button disabled={!currentUserIsAdmin}>
                                  Update Member
                                </button>
                              </form>
                            )}
                          </pre>
                          <button
                            disabled={!currentUserIsAdmin}
                            onClick={async () => {
                              const event = removeMember(
                                org.lastEventHash,
                                convertToSigningKeyPair(currentUser.sign),
                                key
                              );

                              if (org.members[key].isAdmin) {
                                const result =
                                  await addEventProposalToOrganizationMutation({
                                    input: {
                                      organizationId: org.id,
                                      event: JSON.stringify(event),
                                    },
                                  });
                                if (
                                  result.data.addEventProposalToOrganization ===
                                  null
                                ) {
                                  alert("Failed to add the proposal");
                                }
                                await refresh();
                              } else {
                                const newState = applyEvent(org, event);
                                const newKey = createKey();
                                const lockboxes = createLockboxes(
                                  newKey,
                                  currentUser.lockbox.privateKey,
                                  currentUser.lockbox.publicKey,
                                  newState
                                );
                                // should use a deep clone
                                const newEncryptedStateUpdate = {
                                  ...org.currentUserEncryptedState,
                                };
                                // might not exits, but should not throw
                                delete newEncryptedStateUpdate["members"][key];
                                const encryptedState = encryptState(
                                  newState,
                                  newEncryptedStateUpdate,
                                  newKey,
                                  convertToSigningKeyPair(currentUser.sign)
                                );

                                const result =
                                  await removeMemberFromOrganizationMutation({
                                    input: {
                                      organizationId: org.id,
                                      event: JSON.stringify(event),
                                      keyId: newKey.keyId,
                                      lockboxes: JSON.stringify(
                                        lockboxes.lockboxes
                                      ),
                                      encryptedState:
                                        JSON.stringify(encryptedState),
                                    },
                                  });
                                if (
                                  result.data.removeMemberFromOrganization ===
                                  null
                                ) {
                                  alert("Failed to remove member");
                                }
                                await refresh();
                              }
                            }}
                          >
                            {org.members[key].isAdmin
                              ? "Propose to remove admin"
                              : "Remove member"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <h3>Add Member</h3>
                  <form
                    onSubmit={async (formEvent) => {
                      formEvent.preventDefault();
                      const newMemberSigningPublicKey =
                        formEvent.target[0].value;
                      const newMemberLockboxPublicKey =
                        formEvent.target[1].value;
                      const username = formEvent.target[2].value;
                      if (username === "") {
                        alert("Username required");
                        return;
                      }
                      const event = addMember(
                        org.lastEventHash,
                        convertToSigningKeyPair(currentUser.sign),
                        newMemberSigningPublicKey,
                        newMemberLockboxPublicKey,
                        {
                          isAdmin: false,
                          canAddMembers: formEvent.target[3].checked,
                          canRemoveMembers: formEvent.target[4].checked,
                        }
                      );
                      if (event.transaction.type !== "add-member") {
                        alert("Failed to add the member");
                        return;
                      }

                      applyEvent(org, event);

                      const lockbox = createLockbox(
                        org.lastKey,
                        currentUser.lockbox.privateKey,
                        currentUser.lockbox.publicKey,
                        newMemberSigningPublicKey,
                        newMemberLockboxPublicKey
                      );
                      const encryptedState = encryptState(
                        org,
                        {
                          ...org.currentUserEncryptedState,
                          members: {
                            ...org.currentUserEncryptedState.members,
                            [newMemberSigningPublicKey]: { name: username },
                          },
                        },
                        org.lastKey,
                        convertToSigningKeyPair(currentUser.sign)
                      );

                      const result = await addMemberToOrganizationMutation({
                        input: {
                          organizationId: org.id,
                          event: JSON.stringify(event),
                          keyId: org.lastKey.keyId,
                          lockbox: JSON.stringify(lockbox),
                          encryptedState: JSON.stringify(encryptedState),
                        },
                      });
                      if (result.data.addMemberToOrganization === null) {
                        alert("Failed to add the member");
                      }
                      await refresh();
                    }}
                  >
                    <input
                      name="signingPublicKey"
                      type="text"
                      placeholder="Signing Public Key"
                    />
                    <input
                      name="lockboxPublicKey"
                      type="text"
                      placeholder="Lockbox Public Key"
                    />
                    <input name="name" type="text" placeholder="Username" />
                    <label>
                      canAddMembers
                      <input name="canAddMembers" type="checkbox" />
                    </label>
                    <label>
                      canRemoveMembers
                      <input name="canRemoveMembers" type="checkbox" />
                    </label>
                    <button>Add Member</button>
                    <span>
                      Hint: can{"'"}t add as admin, but can be promoted once
                      added (UI limitation only)
                    </span>
                  </form>
                </div>
              );
            })}
            <h2>Create Organization</h2>
            <form
              onSubmit={async (formEvent) => {
                formEvent.preventDefault();
                const username = formEvent.target[0].value;
                if (username === "") {
                  alert("Username required");
                  return;
                }

                const event = createChain(currentUser.sign, {
                  [currentUser.sign.publicKey]: currentUser.lockbox.publicKey,
                });

                const state = resolveState([event]);
                const key = createKey();
                const lockboxes = createLockboxes(
                  key,
                  currentUser.lockbox.privateKey,
                  currentUser.lockbox.publicKey,
                  state
                );
                const encryptedState = encryptState(
                  state,
                  {
                    members: {
                      [currentUser.sign.publicKey]: { name: username },
                    },
                  },
                  key,
                  convertToSigningKeyPair(currentUser.sign)
                );

                const result = await createOrganizationMutation({
                  input: {
                    event: JSON.stringify(event),
                    keyId: key.keyId,
                    lockboxes: JSON.stringify(lockboxes.lockboxes),
                    encryptedState: JSON.stringify(encryptedState),
                  },
                });
                if (result.data.createOrganization === null) {
                  alert("Failed to create the organization");
                }
                await refresh();
              }}
            >
              <input
                name="name"
                type="text"
                placeholder="Your Username in the organization"
              />
              <button>Create Organization (Chain)</button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={async () => {
            const user = createNewUserKeys();
            await createUserMutation({
              input: { signingPublicKey: user.sign.publicKey },
            });
            setCurrentUser(user);
          }}
        >
          Create User (private/public keypair)
        </button>
      )}
    </main>
  );
}
