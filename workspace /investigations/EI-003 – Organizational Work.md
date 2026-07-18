# EI-003 – Organizational Work

Status: Discovery

---

## Objective

Discover the smallest meaningful unit of organizational work.

---

## Core Question

What is the atomic unit of organizational work?

---

## Investigation

The following candidates were investigated:

- Task
- Activity
- Operation
- Workflow Step
- Work Item

None survived architectural validation.

---

## Observation

Organizational work always transforms something from one governed state into another.

Examples:

Reservation

Reserved
↓

Seated

Invoice

Draft
↓

Paid

Patient Case

Registered
↓

Discharged

---

## Leading Hypothesis

Organizational work is the intentional transformation of organizational state.

---

## Major Discovery

The investigation shifted from work itself to the object undergoing work.

This directly led to the discovery of the Work Object.

---

## Architectural Impact

Introduced candidate concept:

Work Object

Definition (candidate):

An organizational entity whose lifecycle progresses through governed state transitions as organizational work is performed.

---

## Status

Continued by EI-004.