## Trust Chain

A cryptographically verifyable chain of events to determine a list team members.

## Trust Chain Events

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

## Utility functions

- `addAuthorToEvent`
- `createInvitation` TODO
- `acceptInvitation` TODO
- `revokeInvitation` TODO

## Invitation Process

- create invitation (to be storred in the encrypted part)
  - unique string id
  - author
- accept invitation
  - id
  - signature of the unique string (proof) by invitee

## Error Philosophy

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

## Future Improvements

- Exhaustive TS Matching
- Implement a state machine
- Add functionality to sign multiple events in multiple orders and pick from the right one to prevent the known UX issue. It doesn't scale, but with a limit of 5 it probably covers lots of cases.
