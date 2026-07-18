### E-002 – Transfer from Guestplan Reservation Records to the Physical Floor Reservation Plan

Source Observations

- O-002 – Website Reservation Handling
- O-006 – Weekend Reservation Reconciliation
- O-007 – Physical Floor Reservation Plan
- O-008 – Rolling Preparation of the Floor Reservation Plan

Related Observations

- O-003 – Reservation Access and Floor-Level Handling
- O-004 – Deferred Manual Reservation Entry
- O-005 – Reservation Information Remained in Group App Without Guestplan Entry

Evidence Status

Established through direct organizational account.

Evidence Type

Direct Organizational Account

Observed Conditions

- The Engineering Lead is a direct organizational actor with very high familiarity with Konnichiwa's reservation operations.
- Investigation independence is limited because the Engineering Lead is directly involved in the organization.
- The physical Floor Reservation Plan has been described through direct operational knowledge.
- The rolling preparation process has been described through direct operational account.
- Documentary corroboration of individual transfer events has not yet been formally inspected.

----

#### Evidence Statement

Future reservation information represented in Guestplan is transferred to the physical Floor Reservation Plan through a rolling operational preparation process.

The current observed preparation priority is:

1. Reservations for the current day are checked as an operational priority.
2. Reservations for the following day are reviewed proactively.
3. When operational time is available, later service days may also be reviewed.
4. Advance preparation does not normally extend beyond three days ahead.

During this preparation process, reservation information is copied from Guestplan to the physical Floor Reservation Plan.

Same-day walk-ins may be added directly to the Floor Reservation Plan without first passing through the observed future-reservation transfer path.


#### Work Object Relationship

WO-001 – Reservation Record
        ↓
Maintained in Guestplan
        ↓
Rolling operational review
        ↓
Today reviewed as priority
        ↓
Tomorrow reviewed proactively
        ↓
Later days reviewed when operational time permits
        ↓
Maximum observed preparation horizon: three days ahead
        ↓
Reservation information copied
        ↓
WO-002 – Floor Reservation Plan

Additional observed entry path:

Same-day walk-in
        ↓
Direct entry into
        ↓
WO-002 – Floor Reservation Plan


#### Supporting Basis

O-002 establishes that reservation information contributes to creation of the Floor Reservation Plan.

O-006 establishes that reservation entries are reviewed against Guestplan and that Guestplan is updated where necessary before the Floor Reservation Plan is updated.

O-007 establishes the physical Floor Reservation Plan as an observed Work Object represented by an A4 paper document divided into Teppan Yaki and Sushi sections.

O-008 establishes the rolling preparation process through which reservation information in Guestplan is reviewed and copied to the Floor Reservation Plan.


#### Falsification Tests

The following stronger statements were tested and rejected:

1. **Every future reservation is guaranteed to exist in Guestplan.**

Rejected.

O-005 reports an actual occurrence where reservation information remained in the group app and was not entered into Guestplan.

2. **All information on the Floor Reservation Plan originates from Guestplan.**

Rejected.

Same-day walk-ins may be added directly to the Floor Reservation Plan.

3. **The Floor Reservation Plan is always complete and current.**

Not established.

The handling of late reservations, modifications, cancellations, and post-preparation reconciliation has not yet been fully established.

4. **The Floor Reservation Plan is created exactly three days before service.**

Rejected.

O-008 establishes a rolling preparation process prioritizing today and tomorrow, with later days reviewed when operational time permits and with an observed maximum preparation horizon of three days ahead.


#### Limitations

- The evidence does not establish that every reservation request successfully reaches Guestplan.
- The evidence does not establish that all information on the Floor Reservation Plan originates from Guestplan.
- The evidence does not establish that the Floor Reservation Plan is always complete or current.
- The propagation of late reservations has not yet been fully established.
- The propagation of reservation modifications has not yet been fully established.
- The propagation of cancellations has not yet been fully established.
- The exact timing of final reconciliation before service has not yet been established.
- Documentary corroboration has not yet been formally inspected.


#### Contradictory Evidence

None currently recorded that contradicts the bounded Evidence Statement.

O-005 does not contradict E-002 but limits its scope by demonstrating that a future reservation request may fail to reach Guestplan.


#### Challenge Evidence Relationship

Related to:

- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation

CE-001 establishes that the transfer of a future reservation request into Guestplan is not guaranteed in at least one reported manual pathway.

Therefore E-002 shall not be interpreted as establishing a universal end-to-end reservation chain.


#### Evidence Conclusion

The operational relationship between WO-001 – Reservation Record and WO-002 – Floor Reservation Plan is sufficiently supported for subsequent engineering reasoning within the observed conditions of EC-001.

The evidence establishes that future reservation information represented in Guestplan is transferred to the physical Floor Reservation Plan through a rolling preparation process.

It also establishes that the Floor Reservation Plan may receive same-day walk-ins directly.

The evidence does not establish Guestplan as a universal single source of truth, nor does it establish that the Floor Reservation Plan is always complete or current.
