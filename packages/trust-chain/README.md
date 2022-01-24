## Trust Chain

A cryptographically verifyable chain of events to determine a list team members and encrypted data e.g. usernames only accessible to the members.

## Goal

The goal of this project is to allow a group of participants (organization) to exchange data without the content being revealed to anyone except the organization members.

The project is inspired by web of trust and blockchains to aim for the following behaviour:

- Enable asynchronous exchange of data (participants don't have to be online at the same time)
- Only one verification is necessary to establish trust between everyone in the organization
- Organization access to a member can be revoked instantly
- An organization can't be manipulated in hindsight
- "Efficiently" be able download the current state by a client (e.g. not running a full blockchain node)

## High Level Architecture

To achieve the defined goals this project relies on a central service in combination with asymmetric cryptography.

The current state of an organization can be constructed from a series of events (chain) and multiple encrypted state entries (encrypted state).

### Chain

The purpose of the chain is determine who is part of the organization and what permissions does this member have.

The central service as well as the members must have full access to this information.

### EncryptedState

The purpose of the encrypted-state is contain information like usernames to hide away from the central service. Only members have access to the content of the encrypted state.

## Design Decisions

### Why a central server?

In decentralized systems there are two issues that didn't align with the goals because:

1. A change e.g. adding or removing a participant from a group needs to propagate to all participants before the take effect and therefor state is only [eventual consistent](https://en.wikipedia.org/wiki/Eventual_consistency).
2. Afaik asynchronous exchange and strong consistency is conflicting. For example blockchains require a lot of online nodes to verify the chain and to achieve a certain gurantee that the current version is the one that will be used and not another fork. There are some ideas and proposal how to tackle it though e.g. [local-first-web/auth discussion](https://github.com/local-first-web/auth/discussions/35)

The three main objectives for the server are:

1. Be an always online instance for members to asynchronously exchange data
2. Prevent members to submit updates based on outdated state which ensures a correct data integrity (for the unencrypted state).
3. Instantly revoke access to removed members.

### How does it work?

For example the encrypted state has a logical clock in the public, but authenticated data submitted by a user. This way the server can throw an error in case the user didn't have the latest state. The user's client can then fetch the latest information and retry.

Note: Depending on the UX the user might want to re-review their changes. This might vary from case to case.

## Known Attack Vectors

- Member
- Admin
- Server
- Member collaborating with the central service
- Admin collaborating with the central service

## Meta Data

Since the chain is public all the meta data about who has access to the group and all their permissions are visible to the central service. This is a known trade-off and possibly an evolution of the protocol using zero knowledge proofs (like the [Signal Private Group System](https://eprint.iacr.org/2019/1416)) could reduce the meta data visible to the server while keep the functionality.

## Security Properties

- [Forward Secrecy](https://en.wikipedia.org/wiki/Forward_secrecy) is currently not supported. A future evolution of the project ideally uses a [ratchet](https://en.wikipedia.org/wiki/Double_Ratchet_Algorithm) to enable forward secrecy. Inspirations could be [DCGKA](https://eprint.iacr.org/2020/1281).
- [Post-compromise security](https://eprint.iacr.org/2016/221.pdf) is currently not supported. Only when a member gets removed the synchronous encryption key and related lockboxes are replaced which leads to PCS in this case.

## Server Authentication

For authentication with the server the client has to request a challenge from the server. A nonce is returned. The client verifies that the nonce is prefixed with the text `"server-auth-"` followed by a UUID. The UUID is only verified by the length. Once this is confirmed the client will sign the challenge and return the signature to sign in.
The server in the response sets a HTTP only session cookie to initialize a session.

The purpose of the nonce prefix is to avoid the server sending any other message that the client would sign accidentally (kind of a chosen-plaintext attack).

### Possible Improvement

It might make sense to also include an encryption challenge to verify that the client also has access to the lockbox private key.

This though needs caution to prevent to prevent a chosen-plaintext attack as described [here](https://crypto.stackexchange.com/a/76662).

## Demo

The demo is available at [https://www.serenity.li/](https://www.serenity.li/). Keep in mind the data is regularily wiped.

### Known Issues

- The private and public keys are currently storred in the localstorage. This is not as planned in the production ready implementation where they should only storred encrypted secured by a password or WebAuthn.
- Some buttons are shown as active e.g. "Demote to member", but the actual action will fail in certain cases e.g. when the current user is the last admin. In this case the error will only be visible in the console.
- Remove member (based on a event proposal does not work)
- Missing checks if the publicKeys are valid for createUser
- Missing checks if the publicKeys match an existing user when adding a member to an organisation
- Chain/Encryped State related
  - when promoting someone to an admin then set the name in the encrypted state
  - when removing a member, take over the encrypted state updates from them
  - when removing permissions from a member, take over the encrypted state updates

Note: The whole project is prototype style code e.g. some functions of the trust chain package are mutating the input object.

## Trust Chain Package

### Trust Chain Events

- `create-chain`
- `add-member`

  - admin: with all permissions
  - member: needs canAddMember, can set no permissions

- `remove-member`

  - admin: needs more than 50% admin votes
  - member: need can remove member

- `update-member`

  - needs >50% admins if a member is promoted or demoted as admin
  - needs one admin to update

- `end-chain` TODO

### Utility functions

- `addAuthorToEvent`
- `createInvitation` TODO
- `acceptInvitation` TODO
- `revokeInvitation` TODO

### Invitation Process (TODO)

- create invitation (to be storred in the encrypted part)
  - unique string id
  - author
- accept invitation
  - id
  - signature of the unique string (proof) by invitee

#### Error Philosophy

The chain will not accept any invalid input. It will not ignore them, but rather throw an Error. When creating an event there is no validation.

Here an example for clarification:

```ts
const event = createChain(…); // does not throw errors
const state = resolveState([event]); // throws errors (internally uses applyEvent)

const event2 = addMember(…); // does not throw errors
const newState = applyEvent(state, event2); // throws errors
```

## Known UX issue

Admin actions need to be in sync, meaning I can't vote on two admin interaction at the same time. Any additional chain event will invalidate them. See future improvements for a possible solution.

### Future Improvements

- Exhaustive TS Matching
- Functions should not mutate incoming parameters
- Implement a state machine
- Add functionality to sign multiple events in multiple orders and pick from the right one to prevent the known UX issue. It doesn't scale, but with a limit of 5 it probably covers lots of cases.
