## Trust Chain

A cryptographically verifyable chain of events to determine a list team members and encrypted data e.g. usernames only accessible to the members.

## Goal

The goal of this project is to allow a group of participants (organization) to exchange data without the content being revealed to anyone except the organization members.

The project is inspired by web of trust and blockchains to aim for the following behaviour:

- Only one verification necessary to establish trust between everyone in the organization
- Organization access to a member can be revoked instantly
- An organization can't be manipulated in hindsight

## High Level Architecture

To achieve the defined goals this project relies on a central service in combination with asymmetric cryptography.

The current state of an organization can be constructed from a series of events (chain) and multiple encrypted state entries (encrypted state).

### Chain

The purpose of the chain is determine who is part of the organization and what permissions does this member have.

The central service as well as the members must have full access to this information.

### EncryptedState

The purpose of the encrypted-state is contain information like usernames to hide away from the central service. Only members have access to the content of the encrypted state.

## Benefit

- instant removal (if the server is honest)

## Known Attack Vectors

- Member
- Admin
- Server
- Member collaborating with the central service
- Admin collaborating with the central service

## Meta Data

Since the chain is public all the meta data about who has access to the group and all their permissions are visible to the central service. This is a known trade-off.

## Security Properties

- [Forward Secrecy](https://en.wikipedia.org/wiki/Forward_secrecy) is currently not supported. A future evolution of the project ideally uses a (ratchet)[https://en.wikipedia.org/wiki/Double_Ratchet_Algorithm] to enable forward secrecy. Inspirations could be [DCGKA](https://eprint.iacr.org/2020/1281).
- [Post-compromise security](https://eprint.iacr.org/2016/221.pdf) is currently not supported. Only when a member gets removed the synchronous encryption key and related lockboxes are replaced which leads to PCS in this case.

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

  - needs 50% admins if a member is promoted or demoted as admin
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
