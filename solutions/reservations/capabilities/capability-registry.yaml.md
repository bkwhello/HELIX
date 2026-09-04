# =============================================================================
# HELIX Reservations — Capability Registry
# =============================================================================

artifact:
  artifact_id: CAP-REG-001
  solution_id: PRD-001
  title: HELIX Reservations Capability Registry
  artifact_type: Capability Registry
  version: 1.0.0
  status: Active
  owner: HELIX Reservations Product Owner
  architect: Principal HELIX Architect
  authoritative_for:
    - capability identity
    - capability ownership
    - capability classification
    - capability dependencies
    - delivery status
    - operational maturity
    - MVP scope

solution:
  id: PRD-001
  name: HELIX Reservations
  namespace: reservations
  initial_deployment: Konnichiwa Utrecht

registry_rules:
  identifier_format: CAP-DNN.NN

  capability_definition: >
    A stable ability provided by HELIX Reservations that produces a meaningful
    operational outcome within a defined responsibility boundary.

  ownership_rule: >
    Each business concept, rule, state transition, and meaningful business event
    shall have one primary owning capability.

  dependency_rule: >
    A dependency identifies another capability whose information or behavior is
    required. It does not describe workflow sequence or technical coupling.

  implementation_rule: >
    Implementation modules realize capabilities but do not redefine capability
    ownership.

  activation_rule: >
    A dedicated capability engineering folder is created only when active
    engineering work begins.

  maturity_scale:
    M0: Not Available
    M1: Manual
    M2: Digitally Supported
    M3: Integrated
    M4: Optimized
    M5: Adaptive

  delivery_statuses:
    - Identified
    - Scoped
    - Designed
    - In Development
    - Pilot
    - Active
    - Deferred
    - Retired

  capability_types:
    - Core
    - Supporting
    - Integration
    - Intelligence

# =============================================================================
# Capability Domains
# =============================================================================

domains:

  - id: CAP-D01
    name: Reservation Demand
    purpose: >
      Receive, create, maintain, modify, cancel, and classify reservation demand.

  - id: CAP-D02
    name: Service Planning
    purpose: >
      Define restaurant services, service periods, availability, capacity,
      and operational pacing constraints.

  - id: CAP-D03
    name: Spatial Planning
    purpose: >
      Represent restaurant areas, floorplans, tables, seats, and seating
      combinations.

  - id: CAP-D04
    name: Seating Operations
    purpose: >
      Convert reservation demand into safe, visible, and manageable seating
      assignments during live restaurant service.

  - id: CAP-D05
    name: Guest Information
    purpose: >
      Maintain guest information required to operate reservations safely and
      provide appropriate hospitality.

  - id: CAP-D06
    name: Communication
    purpose: >
      Communicate reservation events to guests and operational staff.

  - id: CAP-D07
    name: Integration
    purpose: >
      Exchange reservation information with external booking channels and
      operational systems.

  - id: CAP-D08
    name: Control and Insight
    purpose: >
      Preserve operational history and provide visibility, auditability,
      reporting, and analytical insight.

  - id: CAP-D09
    name: Intelligence
    purpose: >
      Assist users through recommendations, predictions, risk detection,
      and explainable operational support.

# =============================================================================
# Capabilities
# =============================================================================

capabilities:

  # ---------------------------------------------------------------------------
  # CAP-D01 — Reservation Demand
  # ---------------------------------------------------------------------------

  - id: CAP-D01.01
    name: Reservation Management
    slug: reservation-management
    domain: CAP-D01
    type: Core
    delivery_status: Designed
    operational_maturity: M0
    mvp: true
    strategic_importance: Critical
    differentiation: Medium

    purpose: >
      Maintain the authoritative identity, lifecycle state and core
      operational information of a reservation.

    owns:
      concepts:
        - Reservation Identity
        - Reservation Lifecycle
        - Reservation Core Information
      commands:
        - Create Reservation
        - Modify Reservation
        - Confirm Reservation
        - Cancel Reservation
        - Complete Reservation
        - Correct Reservation
      decisions:
        - Is the reservation data valid?
        - Is the requested lifecycle transition permitted?
        - May the actor perform the requested action?
        - Does the command require an authorized override?
      events:
        - ReservationCreated
        - ReservationModified
        - ReservationConfirmed
        - ReservationCancelled
        - ReservationCompleted

    depends_on:
      - CAP-D02.02   # Service Period Management
      - CAP-D05.01   # Reservation Contact Management
      - CAP-D02.03   # Availability Management
      # Authorization is not yet a registered capability; tracked as an open dependency.

    provides_to:
      - CAP-D01.03   # Reservation Change Management
      - CAP-D04.01   # Seating Assignment
      - CAP-D04.03   # Guest Arrival Management
      - CAP-D06      # Communication
      - CAP-D08.01   # Reservation Timeline
      - CAP-D08.03   # Service Dashboard
      - CAP-D08.04   # Reservation Reporting
      - CAP-D07.01   # Reservation Import
      - CAP-D07.02   # Reservation Export
      # No single "Integration Management" capability is registered; Reservation Import
      # and Reservation Export are the concrete integration touchpoints owned today.

    implementation_modules: []

  - id: CAP-D01.02
    name: Reservation Source Management
    slug: reservation-source-management
    domain: CAP-D01
    type: Supporting
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Record and classify the channel or operational origin through which a
      reservation entered the solution.

    owns:
      concepts:
        - Reservation Source
        - Source Type
      rules:
        - source classification
        - source attribution
      events:
        - ReservationSourceRecorded
        - ReservationSourceChanged

    depends_on: []

    provides_to:
      - CAP-D01.01
      - CAP-D07.01
      - CAP-D08.04

    implementation_modules:
      - reservations
      - configuration

  - id: CAP-D01.03
    name: Reservation Change Management
    slug: reservation-change-management
    domain: CAP-D01
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Medium

    purpose: >
      Modify reservation information while preserving consistency, detecting
      operational impact, and recording meaningful change history.

    owns:
      concepts:
        - Reservation Change
        - Change Reason
      rules:
        - change validation
        - assignment revalidation
        - change attribution
      events:
        - ReservationModified
        - ReservationTimeChanged
        - ReservationPartySizeChanged
        - ReservationAreaPreferenceChanged

    depends_on:
      - CAP-D01.01
      - CAP-D02.02
      - CAP-D04.02
      - CAP-D08.01

    provides_to:
      - CAP-D04.01
      - CAP-D06.03
      - CAP-D08.02
      - CAP-D08.03

    implementation_modules:
      - reservations
      - timeline

  - id: CAP-D01.04
    name: Walk-in and Waitlist Management
    slug: walk-in-waitlist-management
    domain: CAP-D01
    type: Core
    delivery_status: Scoped
    operational_maturity: M1
    mvp: partial
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Record walk-in demand and maintain guests waiting for suitable seating.

    owns:
      concepts:
        - Walk-in
        - Waitlist Entry
        - Waitlist Status
      rules:
        - walk-in creation
        - waitlist ordering
        - estimated wait handling
        - waitlist removal
      events:
        - WalkInCreated
        - WaitlistEntryCreated
        - WaitlistPositionChanged
        - WaitlistEntryRemoved
        - WaitlistGuestSeated

    depends_on:
      - CAP-D02.03
      - CAP-D04.01
      - CAP-D04.04

    provides_to:
      - CAP-D04.03
      - CAP-D08.03
      - CAP-D09.04

    implementation_modules:
      - walk-ins
      - waitlist

  # ---------------------------------------------------------------------------
  # CAP-D02 — Service Planning
  # ---------------------------------------------------------------------------

  - id: CAP-D02.01
    name: Service Management
    slug: service-management
    domain: CAP-D02
    type: Supporting
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: High
    differentiation: Low

    purpose: >
      Define reusable restaurant service configurations such as lunch,
      dinner, sushi service, or teppan service.

    owns:
      concepts:
        - Service
        - Service Configuration
      rules:
        - service naming
        - default operating times
        - default reservation duration
      events:
        - ServiceCreated
        - ServiceModified
        - ServiceDeactivated

    depends_on: []

    provides_to:
      - CAP-D02.02

    implementation_modules:
      - services
      - configuration

  - id: CAP-D02.02
    name: Service Period Management
    slug: service-period-management
    domain: CAP-D02
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Medium

    purpose: >
      Represent a dated operational service period in which reservations,
      seating resources, and live service activity occur.

    owns:
      concepts:
        - Service Period
        - Service Period Status
      rules:
        - service period creation
        - service period opening
        - service period closing
        - active floorplan selection
      events:
        - ServicePeriodCreated
        - ServicePeriodOpened
        - ServicePeriodClosed
        - FloorplanVersionApplied

    depends_on:
      - CAP-D02.01
      - CAP-D03.02

    provides_to:
      - CAP-D01.01
      - CAP-D02.03
      - CAP-D04.01
      - CAP-D04.04
      - CAP-D08.03

    implementation_modules:
      - services
      - operations

  - id: CAP-D02.03
    name: Availability Management
    slug: availability-management
    domain: CAP-D02
    type: Core
    delivery_status: Pilot
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: High

    purpose: >
      Determine whether seating resources and reservation capacity are
      operationally available for a requested time and party.

    owns:
      concepts:
        - Availability
        - Availability Result
        - Resource Block
      rules:
        - time overlap
        - resource availability
        - reservation duration
        - blocked-resource exclusion
      events:
        - ResourceBlocked
        - ResourceUnblocked
        - AvailabilityEvaluated

    depends_on:
      - CAP-D02.02
      - CAP-D03.03
      - CAP-D04.01
      - CAP-D04.02

    provides_to:
      - CAP-D01.04
      - CAP-D04.01
      - CAP-D07.01
      - CAP-D09.01

    implementation_modules:
      - availability
      - assignments

  - id: CAP-D02.04
    name: Capacity and Pacing Management
    slug: capacity-pacing-management
    domain: CAP-D02
    type: Core
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: High

    purpose: >
      Control reservation intake and seating demand according to operational
      capacity, kitchen load, staffing, and service pacing.

    owns:
      concepts:
        - Capacity Rule
        - Pacing Rule
        - Cover Limit
        - Arrival Limit
      rules:
        - cover limits
        - arrival pacing
        - area-specific capacity
        - workload constraints
      events:
        - CapacityRuleApplied
        - PacingLimitReached
        - CapacityOverrideRecorded

    depends_on:
      - CAP-D02.02
      - CAP-D02.03
      - CAP-D04.04
      - CAP-D08.05

    provides_to:
      - CAP-D07.01
      - CAP-D09.02
      - CAP-D09.04

    implementation_modules:
      - capacity
      - pacing

  # ---------------------------------------------------------------------------
  # CAP-D03 — Spatial Planning
  # ---------------------------------------------------------------------------

  - id: CAP-D03.01
    name: Restaurant Area Management
    slug: restaurant-area-management
    domain: CAP-D03
    type: Supporting
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Define operational restaurant areas such as Teppan, Sushi, Dining Room,
      Bar, or Terrace.

    owns:
      concepts:
        - Restaurant Area
        - Area Type
        - Area Status
      rules:
        - area identity
        - area activation
        - area classification
      events:
        - RestaurantAreaCreated
        - RestaurantAreaModified
        - RestaurantAreaDeactivated

    depends_on: []

    provides_to:
      - CAP-D03.02
      - CAP-D03.03
      - CAP-D01.01

    implementation_modules:
      - floorplans
      - configuration

  - id: CAP-D03.02
    name: Floorplan Management
    slug: floorplan-management
    domain: CAP-D03
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Critical

    purpose: >
      Define and maintain versioned visual representations of restaurant
      seating resources and operational layout.

    owns:
      concepts:
        - Floorplan
        - Floorplan Version
        - Floorplan Status
      rules:
        - floorplan versioning
        - floorplan activation
        - layout integrity
      events:
        - FloorplanCreated
        - FloorplanVersionCreated
        - FloorplanActivated
        - FloorplanArchived

    depends_on:
      - CAP-D03.01

    provides_to:
      - CAP-D02.02
      - CAP-D03.03
      - CAP-D04.01
      - CAP-D04.04

    implementation_modules:
      - floorplans
      - floorplan-ui

  - id: CAP-D03.03
    name: Table and Seat Management
    slug: table-seat-management
    domain: CAP-D03
    type: Core
    delivery_status: Pilot
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Critical

    purpose: >
      Represent assignable tables and individual seats, including capacity,
      status, location, and shared-seating behavior.

    owns:
      concepts:
        - Table
        - Seat
        - Table Type
        - Seating Resource Status
      rules:
        - table capacity
        - seat identity
        - seat sequence
        - shared-seating eligibility
        - resource activation
      events:
        - TableCreated
        - TableModified
        - SeatCreated
        - SeatModified
        - SeatingResourceDisabled

    depends_on:
      - CAP-D03.01
      - CAP-D03.02

    provides_to:
      - CAP-D02.03
      - CAP-D03.04
      - CAP-D04.01
      - CAP-D04.02

    implementation_modules:
      - floorplans
      - seating-resources

  - id: CAP-D03.04
    name: Table Combination Management
    slug: table-combination-management
    domain: CAP-D03
    type: Core
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Medium

    purpose: >
      Define which tables may be combined and the resulting capacity and
      operational constraints.

    owns:
      concepts:
        - Table Combination
        - Combination Capacity
      rules:
        - valid combinations
        - combination availability
        - combined capacity
      events:
        - TableCombinationCreated
        - TableCombinationModified
        - TableCombinationActivated

    depends_on:
      - CAP-D03.03

    provides_to:
      - CAP-D02.03
      - CAP-D04.01
      - CAP-D09.01

    implementation_modules:
      - seating-resources
      - assignments

  # ---------------------------------------------------------------------------
  # CAP-D04 — Seating Operations
  # ---------------------------------------------------------------------------

  - id: CAP-D04.01
    name: Seating Assignment
    slug: seating-assignment
    domain: CAP-D04
    type: Core
    delivery_status: Pilot
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Critical

    purpose: >
      Allocate reservation parties to suitable tables, seats, or combinations
      for a defined time period.

    owns:
      concepts:
        - Seating Assignment
        - Assignment Resource
        - Assignment Status
        - Assignment Source
      rules:
        - assignment creation
        - assignment confirmation
        - assignment release
        - table assignment
        - individual-seat assignment
        - multi-resource assignment
      events:
        - SeatingAssigned
        - SeatingChanged
        - SeatingReleased
        - SeatingAssignmentCompleted

    depends_on:
      - CAP-D01.01
      - CAP-D02.02
      - CAP-D02.03
      - CAP-D03.03
      - CAP-D04.02

    provides_to:
      - CAP-D04.03
      - CAP-D04.04
      - CAP-D04.05
      - CAP-D08.01
      - CAP-D08.03

    implementation_modules:
      - assignments
      - floorplan-ui

  - id: CAP-D04.02
    name: Assignment Conflict Management
    slug: assignment-conflict-management
    domain: CAP-D04
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: High

    purpose: >
      Detect, explain, prevent, and where authorized record overrides of
      conflicting seating assignments.

    owns:
      concepts:
        - Assignment Conflict
        - Conflict Type
        - Conflict Severity
        - Conflict Override
      rules:
        - overlapping assignment detection
        - table exclusivity
        - seat exclusivity
        - capacity validation
        - resource-status validation
        - authorized override
      events:
        - AssignmentConflictDetected
        - AssignmentConflictResolved
        - AssignmentConflictOverridden

    depends_on:
      - CAP-D02.03
      - CAP-D03.03

    provides_to:
      - CAP-D01.03
      - CAP-D04.01
      - CAP-D08.02
      - CAP-D09.04

    implementation_modules:
      - assignments
      - conflict-detection

  - id: CAP-D04.03
    name: Guest Arrival Management
    slug: guest-arrival-management
    domain: CAP-D04
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Medium

    purpose: >
      Record guest arrival, late arrival, no-show, and readiness for seating.

    owns:
      concepts:
        - Arrival Status
        - Arrival Timestamp
        - No-show Status
      rules:
        - arrival registration
        - late-arrival handling
        - no-show handling
        - arrival correction
      events:
        - GuestArrived
        - GuestMarkedLate
        - GuestMarkedNoShow
        - ArrivalStatusCorrected

    depends_on:
      - CAP-D01.01
      - CAP-D01.04

    provides_to:
      - CAP-D04.04
      - CAP-D08.01
      - CAP-D08.03
      - CAP-D09.04

    implementation_modules:
      - operations
      - reservations

  - id: CAP-D04.04
    name: Live Service Management
    slug: live-service-management
    domain: CAP-D04
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Critical

    purpose: >
      Maintain a current operational view of reservations, arrivals, seating,
      occupancy, conflicts, and service progression.

    owns:
      concepts:
        - Operational Reservation State
        - Service Operational View
        - Seating State
      rules:
        - operational state progression
        - seated-state handling
        - operational correction
        - current-service inclusion
      events:
        - GuestSeated
        - SeatingStatusCorrected
        - ServiceStateUpdated

    depends_on:
      - CAP-D02.02
      - CAP-D04.01
      - CAP-D04.03
      - CAP-D05.02

    provides_to:
      - CAP-D04.05
      - CAP-D08.03
      - CAP-D08.05
      - CAP-D09.04

    implementation_modules:
      - operations
      - dashboard
      - floorplan-ui

  - id: CAP-D04.05
    name: Table Release and Turn Management
    slug: table-release-turn-management
    domain: CAP-D04
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: High
    differentiation: High

    purpose: >
      Complete a seating assignment, release occupied resources, and represent
      the operational transition to a subsequent table turn.

    owns:
      concepts:
        - Table Turn
        - Resource Release
        - Completion Timestamp
      rules:
        - reservation completion
        - assignment completion
        - resource release
        - subsequent availability
      events:
        - ReservationCompleted
        - TableReleased
        - SeatReleased
        - TableTurnCompleted

    depends_on:
      - CAP-D04.01
      - CAP-D04.04

    provides_to:
      - CAP-D02.03
      - CAP-D08.01
      - CAP-D08.03
      - CAP-D08.05

    implementation_modules:
      - operations
      - assignments

  # ---------------------------------------------------------------------------
  # CAP-D05 — Guest Information
  # ---------------------------------------------------------------------------

  - id: CAP-D05.01
    name: Reservation Contact Management
    slug: reservation-contact-management
    domain: CAP-D05
    type: Supporting
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: High
    differentiation: Low

    purpose: >
      Maintain contact information associated with a reservation without
      requiring a persistent CRM guest profile.

    owns:
      concepts:
        - Reservation Contact
        - Contact Name
        - Telephone Number
        - Email Address
      rules:
        - required contact information
        - contact validation
        - contact correction
      events:
        - ReservationContactRecorded
        - ReservationContactChanged

    depends_on: []

    provides_to:
      - CAP-D01.01
      - CAP-D06.01
      - CAP-D06.02
      - CAP-D06.03

    implementation_modules:
      - reservations
      - contacts

  - id: CAP-D05.02
    name: Allergy and Critical Note Management
    slug: allergy-critical-note-management
    domain: CAP-D05
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: Medium

    purpose: >
      Record and prominently expose allergy information and other critical
      operational notes.

    owns:
      concepts:
        - Allergy Information
        - Reservation Note
        - Critical Note Indicator
        - Note Type
      rules:
        - critical-note visibility
        - allergy classification
        - note attribution
        - note preservation
      events:
        - AllergyInformationRecorded
        - AllergyInformationChanged
        - CriticalNoteAdded
        - CriticalNoteResolved

    depends_on:
      - CAP-D01.01

    provides_to:
      - CAP-D04.04
      - CAP-D06.04
      - CAP-D08.03
      - CAP-D09.04

    implementation_modules:
      - reservations
      - notes

  - id: CAP-D05.03
    name: Guest Preference Management
    slug: guest-preference-management
    domain: CAP-D05
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Medium

    purpose: >
      Maintain reusable operational preferences such as area, seating,
      accessibility, and service preferences.

    owns:
      concepts:
        - Guest Preference
        - Preference Type
      rules:
        - preference recording
        - preference precedence
        - preference correction
      events:
        - GuestPreferenceRecorded
        - GuestPreferenceChanged
        - GuestPreferenceRemoved

    depends_on:
      - CAP-D05.04

    provides_to:
      - CAP-D04.01
      - CAP-D09.01
      - CAP-D09.05

    implementation_modules:
      - guests
      - preferences

  - id: CAP-D05.04
    name: Guest Profile Reference
    slug: guest-profile-reference
    domain: CAP-D05
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Link reservation contacts to a reusable guest identity without making
      HELIX Reservations the long-term CRM system of record.

    owns:
      concepts:
        - Guest Profile Reference
        - Guest External Reference
        - Guest Matching Result
      rules:
        - profile linking
        - duplicate-match handling
        - unlinking
      events:
        - GuestProfileLinked
        - GuestProfileUnlinked
        - GuestProfileMatchRejected

    depends_on:
      - CAP-D05.01
      - CAP-D07.03

    provides_to:
      - CAP-D05.03
      - CAP-D08.04
      - CAP-D09.05

    implementation_modules:
      - guests
      - external-identities

  # ---------------------------------------------------------------------------
  # CAP-D06 — Communication
  # ---------------------------------------------------------------------------

  - id: CAP-D06.01
    name: Reservation Confirmation
    slug: reservation-confirmation
    domain: CAP-D06
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Communicate reservation confirmation to the guest through configured
      communication channels.

    owns:
      concepts:
        - Confirmation Message
        - Confirmation Delivery Status
      rules:
        - confirmation eligibility
        - confirmation content selection
        - delivery attribution
      events:
        - ConfirmationRequested
        - ConfirmationSent
        - ConfirmationDeliveryFailed

    depends_on:
      - CAP-D01.01
      - CAP-D05.01

    provides_to:
      - CAP-D08.01

    implementation_modules:
      - communications
      - notifications

  - id: CAP-D06.02
    name: Reminder Management
    slug: reminder-management
    domain: CAP-D06
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Schedule and deliver reservation reminders before the planned arrival.

    owns:
      concepts:
        - Reservation Reminder
        - Reminder Schedule
        - Reminder Delivery Status
      rules:
        - reminder timing
        - reminder eligibility
        - reminder cancellation
      events:
        - ReminderScheduled
        - ReminderSent
        - ReminderCancelled
        - ReminderDeliveryFailed

    depends_on:
      - CAP-D01.01
      - CAP-D05.01

    provides_to:
      - CAP-D08.01
      - CAP-D09.04

    implementation_modules:
      - communications
      - scheduling

  - id: CAP-D06.03
    name: Change Notification
    slug: change-notification
    domain: CAP-D06
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Inform guests when material reservation information changes or a
      reservation is cancelled.

    owns:
      concepts:
        - Change Notification
        - Notification Delivery Status
      rules:
        - material-change detection
        - notification eligibility
        - delivery handling
      events:
        - ChangeNotificationRequested
        - ChangeNotificationSent
        - ChangeNotificationFailed

    depends_on:
      - CAP-D01.03
      - CAP-D05.01

    provides_to:
      - CAP-D08.01

    implementation_modules:
      - communications
      - notifications

  - id: CAP-D06.04
    name: Internal Operational Notifications
    slug: internal-operational-notifications
    domain: CAP-D06
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Medium

    purpose: >
      Surface operationally significant reservation events and risks to
      authorized restaurant staff.

    owns:
      concepts:
        - Operational Notification
        - Notification Priority
        - Acknowledgement Status
      rules:
        - notification triggering
        - audience selection
        - acknowledgement
        - escalation
      events:
        - OperationalNotificationCreated
        - OperationalNotificationAcknowledged
        - OperationalNotificationEscalated

    depends_on:
      - CAP-D05.02
      - CAP-D07.05
      - CAP-D09.04

    provides_to:
      - CAP-D04.04
      - CAP-D08.03

    implementation_modules:
      - notifications
      - operations

  # ---------------------------------------------------------------------------
  # CAP-D07 — Integration
  # ---------------------------------------------------------------------------

  - id: CAP-D07.01
    name: Reservation Import
    slug: reservation-import
    domain: CAP-D07
    type: Integration
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Receive external reservation records and translate them into valid
      internal reservation commands.

    owns:
      concepts:
        - Reservation Import Request
        - Import Result
        - Import Source Payload
      rules:
        - payload validation
        - source attribution
        - duplicate detection
        - import rejection
      events:
        - ReservationImportReceived
        - ReservationImported
        - ReservationImportRejected
        - ReservationImportDuplicateDetected

    depends_on:
      - CAP-D01.01
      - CAP-D01.02
      - CAP-D02.03
      - CAP-D07.03

    provides_to:
      - CAP-D07.04
      - CAP-D07.05
      - CAP-D08.02

    implementation_modules:
      - integrations
      - reservation-import

  - id: CAP-D07.02
    name: Reservation Export
    slug: reservation-export
    domain: CAP-D07
    type: Integration
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Publish internal reservation changes to authorized external systems.

    owns:
      concepts:
        - Reservation Export Request
        - Export Result
        - Export Payload
      rules:
        - export eligibility
        - destination selection
        - payload mapping
        - retry handling
      events:
        - ReservationExportRequested
        - ReservationExported
        - ReservationExportFailed

    depends_on:
      - CAP-D01.01
      - CAP-D01.03
      - CAP-D07.03

    provides_to:
      - CAP-D07.04
      - CAP-D07.05
      - CAP-D08.02

    implementation_modules:
      - integrations
      - reservation-export

  - id: CAP-D07.03
    name: External Identity Mapping
    slug: external-identity-mapping
    domain: CAP-D07
    type: Integration
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Map internal business identities to identifiers used by external
      platforms without surrendering internal identity ownership.

    owns:
      concepts:
        - External Reservation Reference
        - External Guest Reference
        - External System Identity
      rules:
        - identity uniqueness
        - identity linking
        - identity unlinking
        - source-specific identity mapping
      events:
        - ExternalIdentityLinked
        - ExternalIdentityChanged
        - ExternalIdentityUnlinked

    depends_on:
      - CAP-D01.02

    provides_to:
      - CAP-D05.04
      - CAP-D07.01
      - CAP-D07.02
      - CAP-D07.04

    implementation_modules:
      - integrations
      - external-identities

  - id: CAP-D07.04
    name: Synchronization Management
    slug: synchronization-management
    domain: CAP-D07
    type: Integration
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Coordinate reservation synchronization state, retries, ordering,
      and reconciliation across external systems.

    owns:
      concepts:
        - Synchronization State
        - Synchronization Attempt
        - Reconciliation Result
      rules:
        - synchronization ordering
        - idempotency
        - retry handling
        - reconciliation
      events:
        - SynchronizationStarted
        - SynchronizationCompleted
        - SynchronizationFailed
        - SynchronizationRetried

    depends_on:
      - CAP-D07.01
      - CAP-D07.02
      - CAP-D07.03

    provides_to:
      - CAP-D07.05
      - CAP-D08.02
      - CAP-D09.04

    implementation_modules:
      - integrations
      - synchronization

  - id: CAP-D07.05
    name: Integration Conflict Management
    slug: integration-conflict-management
    domain: CAP-D07
    type: Integration
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: High

    purpose: >
      Detect and resolve conflicting reservation information received from
      internal and external systems.

    owns:
      concepts:
        - Integration Conflict
        - Conflict Resolution
        - Authoritative Value
      rules:
        - conflict detection
        - authority determination
        - manual resolution
        - conflict preservation
      events:
        - IntegrationConflictDetected
        - IntegrationConflictResolved
        - IntegrationConflictEscalated

    depends_on:
      - CAP-D07.01
      - CAP-D07.02
      - CAP-D07.04

    provides_to:
      - CAP-D06.04
      - CAP-D08.02
      - CAP-D09.04

    implementation_modules:
      - integrations
      - conflict-resolution

  # ---------------------------------------------------------------------------
  # CAP-D08 — Control and Insight
  # ---------------------------------------------------------------------------

  - id: CAP-D08.01
    name: Reservation Timeline
    slug: reservation-timeline
    domain: CAP-D08
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: High

    purpose: >
      Preserve a chronological record of meaningful reservation and service
      events while current state remains directly accessible.

    owns:
      concepts:
        - Timeline Event
        - Event Summary
        - Event Payload
      rules:
        - append-only event preservation
        - meaningful-event selection
        - actor attribution
        - event chronology
      events:
        - TimelineEventAppended

    depends_on:
      - CAP-D01.01

    provides_to:
      - CAP-D08.02
      - CAP-D08.03
      - CAP-D08.04
      - CAP-D08.05
      - CAP-D09.02
      - CAP-D09.03
      - CAP-D09.04
      - CAP-D09.05

    implementation_modules:
      - timeline
      - event-log

  - id: CAP-D08.02
    name: Operational Audit
    slug: operational-audit
    domain: CAP-D08
    type: Supporting
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: High
    differentiation: Medium

    purpose: >
      Provide accountable inspection of meaningful changes, overrides,
      integration actions, and user decisions.

    owns:
      concepts:
        - Audit Record
        - Actor Attribution
        - Override Record
      rules:
        - audit attribution
        - override preservation
        - administrative inspection
      events:
        - AuditRecordCreated
        - OverrideAudited

    depends_on:
      - CAP-D08.01

    provides_to:
      - CAP-D08.04
      - CAP-D09.04

    implementation_modules:
      - audit
      - timeline

  - id: CAP-D08.03
    name: Service Dashboard
    slug: service-dashboard
    domain: CAP-D08
    type: Core
    delivery_status: Designed
    operational_maturity: M1
    mvp: true
    strategic_importance: Critical
    differentiation: High

    purpose: >
      Present the current operational condition of a selected service period
      in one actionable view.

    owns:
      concepts:
        - Service Dashboard View
        - Operational Summary
        - Service Alert
      rules:
        - dashboard inclusion
        - metric calculation
        - critical information visibility
      events: []

    depends_on:
      - CAP-D01.01
      - CAP-D02.02
      - CAP-D04.01
      - CAP-D04.03
      - CAP-D04.04
      - CAP-D04.05
      - CAP-D05.02
      - CAP-D08.01

    provides_to:
      - CAP-D09.04

    implementation_modules:
      - dashboard
      - operations

  - id: CAP-D08.04
    name: Reservation Reporting
    slug: reservation-reporting
    domain: CAP-D08
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M1
    mvp: false
    strategic_importance: Medium
    differentiation: Low

    purpose: >
      Produce structured historical reports about reservation activity,
      sources, statuses, guests, and service outcomes.

    owns:
      concepts:
        - Reservation Report
        - Report Definition
        - Report Period
      rules:
        - report filtering
        - report aggregation
        - report export
      events:
        - ReservationReportGenerated

    depends_on:
      - CAP-D01.02
      - CAP-D05.04
      - CAP-D08.01
      - CAP-D08.02

    provides_to:
      - CAP-D08.05

    implementation_modules:
      - reporting

  - id: CAP-D08.05
    name: Operational Analytics
    slug: operational-analytics
    domain: CAP-D08
    type: Supporting
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: High

    purpose: >
      Analyze operational performance, demand, utilization, conflicts,
      duration, pacing, and service outcomes.

    owns:
      concepts:
        - Operational Metric
        - Analytical Dataset
        - Performance Indicator
      rules:
        - metric definitions
        - aggregation periods
        - historical comparison
      events:
        - AnalyticalDatasetUpdated
        - OperationalMetricCalculated

    depends_on:
      - CAP-D04.04
      - CAP-D04.05
      - CAP-D08.01
      - CAP-D08.04

    provides_to:
      - CAP-D02.04
      - CAP-D09.02
      - CAP-D09.03
      - CAP-D09.04

    implementation_modules:
      - analytics

  # ---------------------------------------------------------------------------
  # CAP-D09 — Intelligence
  # ---------------------------------------------------------------------------

  - id: CAP-D09.01
    name: Seating Recommendation
    slug: seating-recommendation
    domain: CAP-D09
    type: Intelligence
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: Critical

    purpose: >
      Recommend suitable seating assignments while preserving staff authority
      and explaining relevant constraints.

    owns:
      concepts:
        - Seating Recommendation
        - Recommendation Rationale
        - Recommendation Confidence
      rules:
        - recommendation eligibility
        - constraint compliance
        - explainability
        - human approval
      events:
        - SeatingRecommendationGenerated
        - SeatingRecommendationAccepted
        - SeatingRecommendationRejected

    depends_on:
      - CAP-D02.03
      - CAP-D03.04
      - CAP-D04.01
      - CAP-D05.03
      - CAP-D08.01

    provides_to:
      - CAP-D04.01
      - CAP-D09.05

    implementation_modules:
      - intelligence
      - seating-recommendations

  - id: CAP-D09.02
    name: Demand Forecasting
    slug: demand-forecasting
    domain: CAP-D09
    type: Intelligence
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: High

    purpose: >
      Forecast future reservation demand, covers, arrival patterns, and
      capacity pressure.

    owns:
      concepts:
        - Demand Forecast
        - Forecast Horizon
        - Forecast Confidence
      rules:
        - forecast generation
        - confidence representation
        - historical input selection
      events:
        - DemandForecastGenerated
        - DemandForecastUpdated

    depends_on:
      - CAP-D08.01
      - CAP-D08.05

    provides_to:
      - CAP-D02.04
      - CAP-D09.04
      - CAP-D09.05

    implementation_modules:
      - intelligence
      - forecasting

  - id: CAP-D09.03
    name: Duration Prediction
    slug: duration-prediction
    domain: CAP-D09
    type: Intelligence
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: Medium
    differentiation: High

    purpose: >
      Predict likely reservation and table occupancy duration using historical
      and current operational context.

    owns:
      concepts:
        - Duration Prediction
        - Predicted Completion Time
        - Prediction Confidence
      rules:
        - prediction generation
        - confidence representation
        - prediction refresh
      events:
        - DurationPredictionGenerated
        - DurationPredictionUpdated

    depends_on:
      - CAP-D08.01
      - CAP-D08.05

    provides_to:
      - CAP-D02.03
      - CAP-D02.04
      - CAP-D04.05
      - CAP-D09.04

    implementation_modules:
      - intelligence
      - duration-prediction

  - id: CAP-D09.04
    name: Operational Risk Detection
    slug: operational-risk-detection
    domain: CAP-D09
    type: Intelligence
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: High
    differentiation: Critical

    purpose: >
      Detect operational risks such as unassigned reservations, capacity
      pressure, integration failures, late arrivals, allergy visibility issues,
      and seating conflicts.

    owns:
      concepts:
        - Operational Risk
        - Risk Severity
        - Risk Explanation
        - Risk Resolution Status
      rules:
        - risk detection
        - severity classification
        - risk explanation
        - risk dismissal
      events:
        - OperationalRiskDetected
        - OperationalRiskUpdated
        - OperationalRiskResolved
        - OperationalRiskDismissed

    depends_on:
      - CAP-D01.04
      - CAP-D02.04
      - CAP-D04.02
      - CAP-D04.03
      - CAP-D04.04
      - CAP-D05.02
      - CAP-D07.04
      - CAP-D07.05
      - CAP-D08.01
      - CAP-D08.02
      - CAP-D08.05
      - CAP-D09.02
      - CAP-D09.03

    provides_to:
      - CAP-D06.04
      - CAP-D08.03
      - CAP-D09.05

    implementation_modules:
      - intelligence
      - risk-detection

  - id: CAP-D09.05
    name: AI Operations Assistant
    slug: ai-operations-assistant
    domain: CAP-D09
    type: Intelligence
    delivery_status: Deferred
    operational_maturity: M0
    mvp: false
    strategic_importance: Medium
    differentiation: High

    purpose: >
      Explain operational conditions and assist authorized users with
      recommendations without owning or directly altering business state.

    owns:
      concepts:
        - Assistant Recommendation
        - Assistant Explanation
        - Suggested Action
      rules:
        - read-only observation by default
        - explicit user approval
        - recommendation explainability
        - uncertainty disclosure
        - no autonomous business-state ownership
      events:
        - AssistantRecommendationGenerated
        - AssistantRecommendationAccepted
        - AssistantRecommendationRejected

    depends_on:
      - CAP-D05.03
      - CAP-D05.04
      - CAP-D08.01
      - CAP-D09.01
      - CAP-D09.02
      - CAP-D09.04

    provides_to: []

    implementation_modules:
      - intelligence
      - operations-assistant

# =============================================================================
# MVP Boundary
# =============================================================================

mvp:

  objective: >
    Validate that restaurant staff can create reservations, organize them
    within service periods, assign tables or individual seats, detect conflicts,
    operate the live floorplan, and preserve meaningful history.

  included_capabilities:
    - CAP-D01.01
    - CAP-D01.02
    - CAP-D01.03
    - CAP-D02.01
    - CAP-D02.02
    - CAP-D02.03
    - CAP-D03.01
    - CAP-D03.02
    - CAP-D03.03
    - CAP-D04.01
    - CAP-D04.02
    - CAP-D04.03
    - CAP-D04.04
    - CAP-D04.05
    - CAP-D05.01
    - CAP-D05.02
    - CAP-D08.01
    - CAP-D08.02
    - CAP-D08.03

  partially_included_capabilities:
    - id: CAP-D01.04
      included_scope:
        - manual walk-in creation
      excluded_scope:
        - managed waitlist
        - wait-time estimation
        - automated waitlist sequencing

  explicitly_excluded_capabilities:
    - CAP-D02.04
    - CAP-D03.04
    - CAP-D05.03
    - CAP-D05.04
    - CAP-D06.01
    - CAP-D06.02
    - CAP-D06.03
    - CAP-D06.04
    - CAP-D07.01
    - CAP-D07.02
    - CAP-D07.03
    - CAP-D07.04
    - CAP-D07.05
    - CAP-D08.04
    - CAP-D08.05
    - CAP-D09.01
    - CAP-D09.02
    - CAP-D09.03
    - CAP-D09.04
    - CAP-D09.05

# =============================================================================
# Active Engineering
# =============================================================================

active_engineering:

  first_capability:
    id: CAP-D01.01
    name: Reservation Management
    reason: >
      Reservation identity and lifecycle are prerequisites for floor planning,
      seating assignment, live service management, and timeline recording.

  recommended_sequence:
    - CAP-D02.01
    - CAP-D02.02
    - CAP-D05.01
    - CAP-D01.01
    - CAP-D01.02
    - CAP-D01.03
    - CAP-D03.01
    - CAP-D03.02
    - CAP-D03.03
    - CAP-D08.01
    - CAP-D04.02
    - CAP-D04.01
    - CAP-D04.03
    - CAP-D04.04
    - CAP-D04.05
    - CAP-D05.02
    - CAP-D08.02
    - CAP-D08.03
    - CAP-D02.03

# =============================================================================
# Conformance
# =============================================================================

conformance:

  required_checks:
    - Every capability has one stable identifier.
    - Every capability belongs to one capability domain.
    - Every capability has one primary purpose.
    - Owned concepts are not duplicated across capabilities.
    - Dependencies reference valid capability identifiers.
    - MVP scope is explicit.
    - Delivery status and operational maturity are recorded separately.
    - Implementation modules do not redefine business ownership.
    - Intelligence capabilities do not own authoritative operational state.
    - External systems do not replace internal reservation identity.

  change_control: >
    Changes to capability identity, ownership, domain placement, or MVP scope
    require architectural review. Changes to delivery status, maturity, and
    implementation-module references may be updated through normal product
    engineering activity.