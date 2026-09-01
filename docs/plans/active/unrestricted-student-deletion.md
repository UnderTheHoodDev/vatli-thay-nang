# Execution Plan: Unrestricted Student Deletion

Date: 2026-09-01

## Status

Active

## Outcome

An authenticated admin can permanently delete any `STUDENT`, regardless of
whether that student has learning, tuition, attendance, course-progress, or
test data. The operation immediately removes the student account and data owned
only by that student, without deleting shared resources or data belonging to
other users.

The existing single-user and bulk-delete confirmation flows remain in place.
Deletion remains unavailable for `ADMIN`, `TEACHING_ASSISTANT`, and the actor's
own account.

## Context

- Frontend single-delete flow:
  `src/components/features/users/DeleteUserButton.tsx` and
  `src/actions/v1/users/delete-user.ts`.
- Frontend bulk-delete flow:
  `src/components/features/users/BulkDeleteUsersButton.tsx` and
  `src/actions/v1/users/bulk-delete-users.ts`.
- Frontend bulk result contract: `src/types/actions/users.ts`.
- Backend endpoint and authorization:
  `../vltn-backend/src/users/users.controller.ts`.
- Backend deletion implementation:
  `../vltn-backend/src/users/users.service.ts`.
- Backend data model: `../vltn-backend/prisma/schema.prisma` and its migrations.
- Backend Redis cleanup:
  `../vltn-backend/src/common/utils/session-revocation.ts` and
  `../vltn-backend/src/common/constants/redis-keys.ts`.
- Backend object cleanup pattern:
  `../vltn-backend/src/tests/test-storage.cleanup.ts` and
  `../vltn-backend/src/tests/tests.service.ts`.

At backend fixed point `591c2f24ec9957eb0a77ae29595df351573f0272`, deletion
ran a set of `hasDataChecks` and returned HTTP 409 before deleting a user with
related data. Those checks also omitted at least `tuition_payments` and
`test_attempts`, allowing some requests to reach a foreign-key failure and
become a generic HTTP 500. That fixed point had neither a self-delete guard nor
an explicit target-role guard matching this plan.

## Scope

In scope:

- Permit hard deletion only when the target role is `STUDENT`.
- Reject deletion when the target is the authenticated actor.
- Reject deletion of `ADMIN` and `TEACHING_ASSISTANT` targets.
- Apply the same eligibility rules to single and bulk deletion.
- Delete student-owned rows in a database transaction before deleting the
  `users` row:
  - class membership;
  - tuition payments;
  - the student's leave requests;
  - the student's attendance logs and manual-edit subject history;
  - course enrollments;
  - video views and progress;
  - test attempts, submissions, and submission-file records.
- Preserve shared resources such as classes, class sessions, attendance
  sessions, courses, tests, and records belonging to other users.
- After the database commit, revoke only the deleted student's sessions,
  activation token/reverse key, and activation issuance lock.
- After the database commit, delete only submission objects collected from the
  target student's records, using the existing unreferenced-object protection.
- Preserve the current frontend confirmation interaction, pending state,
  refresh behavior, and current logging/backup behavior.
- Update frontend and Swagger wording that currently says users with data
  cannot be deleted.
- Return explicit single and bulk reasons for protected target roles and
  self-deletion.

Out of scope:

- Deleting `ADMIN` or `TEACHING_ASSISTANT` accounts.
- Soft deletion, a recovery window, anonymization, or a recycle bin.
- New audit, backup, or restore infrastructure.
- Deleting shared classes, sessions, courses, tests, or other users' records.
- Reassigning shared resources to another admin.
- Broadly changing foreign keys to `ON DELETE CASCADE`.
- Inferring and deleting an avatar object from `avatarUrl` without verified
  storage ownership metadata.
- Changing the number or structure of frontend confirmation steps.

## Approach

1. Define one backend deletion eligibility helper used by both single and bulk
   endpoints. Pass the authenticated actor ID from the controller and reject
   self-deletion or any target whose role is not `STUDENT`.
2. Replace the student `hasDataChecks` gate with a dedicated hard-delete
   transaction. Use the repository's serializable transaction helper and retry
   behavior.
3. Inside the transaction, load and lock the target semantics, collect the
   target student's submission storage keys, delete owned records in
   child-before-parent order, and delete the `users` row last.
4. Keep shared records untouched. Do not cascade through creator, instructor,
   opener, reviewer, grader, editor, or enrolment-actor relationships belonging
   to other users.
5. After commit, run best-effort external cleanup for the target's Redis keys
   and unreferenced submission objects. External cleanup failure must be logged
   but must not report that the committed database deletion was rolled back.
6. Make bulk deletion deduplicate IDs and process each target independently.
   Delete eligible students and return per-ID skip reasons for `notFound`,
   `selfDelete`, and `protectedRole`.
7. Update frontend result types, skipped-result messages, delete-dialog copy,
   help text, and backend Swagger documentation to describe permanent student
   deletion accurately.
8. Add focused backend and frontend proof before running repository-wide
   validation.

## Risks And Recovery

- Risk: deleting a shared parent could erase other students' data. Mitigation:
  use explicit `deleteMany` operations scoped by the target student's foreign
  key; do not delete classes, sessions, courses, or tests.
- Risk: incomplete dependency coverage causes an FK failure midway. Mitigation:
  keep all database deletes in one transaction and add fixtures covering every
  student-owned relation, including tuition payments and test attempts.
- Risk: cleanup targets another user's shared storage object. Mitigation:
  collect keys only from the target's submissions and use the existing
  unreferenced-object check before deletion.
- Risk: Redis or R2 fails after the database commit. Mitigation: log the exact
  cleanup failure and keep cleanup idempotent so it can be retried safely.
- Risk: single and bulk endpoints drift. Mitigation: share eligibility and
  per-target deletion implementation between both entrypoints.
- Recovery: before deployment, rollback the code and schema migration, if any.
  After a production hard deletion, application rollback cannot restore the
  deleted student; recovery depends solely on the existing external database
  and object-storage backup arrangements, which are not defined in either
  repository.

## Progress

- [x] Add backend tests that capture current rejection and the intended student
  hard-delete behavior.
- [x] Pass authenticated actor identity into single and bulk deletion.
- [x] Add self-delete and protected-role eligibility checks.
- [x] Implement transactional deletion of every student-owned database record.
- [x] Implement post-commit Redis and submission-object cleanup.
- [x] Align bulk deletion results with the new skip reasons.
- [x] Update frontend types, messages, dialog copy, and help documentation.
- [x] Run focused backend proof; frontend has no configured test runner.
- [x] Run required repository-wide static validation in both repositories.
- [x] Inspect both diffs for unrelated changes or accidental shared-data
  deletion.
- [ ] Apply the migration to an isolated database and run the real admin UI
  deletion flow against representative student data.
- [ ] Record verified results and move this plan to `docs/plans/completed/`.

## Decisions

- 2026-09-01: Unrestricted hard deletion applies only to `STUDENT` targets.
- 2026-09-01: Existing related data does not block deletion of a student.
- 2026-09-01: Delete all data owned only by the target student; preserve shared
  resources and every other user's data.
- 2026-09-01: Block deletion of `ADMIN`, `TEACHING_ASSISTANT`, and the actor's
  own account.
- 2026-09-01: Preserve the existing frontend confirmation flow.
- 2026-09-01: Do not add soft deletion, recovery, audit, or backup behavior.
- 2026-09-01: Bulk deletion processes IDs independently and skips protected or
  missing targets without preventing deletion of eligible students.
- 2026-09-01: Database deletion is transactional; Redis and R2 cleanup occurs
  after commit and remains best-effort.
- 2026-09-02: Shared resources created or opened by a user remain in place when
  that user is deleted; nullable attribution foreign keys use `ON DELETE SET
  NULL`, while unmodeled actor IDs are cleared explicitly.

## Validation

- Focused proof:
  - A student with class membership, tuition, attendance, leave requests,
    course enrollment, video progress, test attempts, submissions, and files is
    deleted successfully.
  - Every owned row is gone after deletion.
  - Shared classes, sessions, courses, tests, and a second student's records
    remain unchanged.
  - Self-delete, `ADMIN`, and `TEACHING_ASSISTANT` targets are rejected with the
    intended reason.
  - A transaction failure rolls back all database deletion.
  - R2 cleanup receives only the target student's unreferenced keys.
  - Redis cleanup covers the student's session key plus activation keys and
    locks owned by the target.
- Integration or end-to-end proof:
  - Through the existing admin users UI, delete a student that has related
    records and observe success plus table refresh.
  - Exercise a mixed bulk selection and observe eligible students deleted while
    protected targets are reported as skipped.
  - Confirm another student's class, attendance, tuition, and test data remains
    visible after deletion.
- Repository-required checks:
  - Backend native lint, typecheck/build, and Jest commands discovered from its
    package manifest.
  - Frontend `pnpm lint`, `pnpm format:check`, `pnpm exec tsc --noEmit`, and
    `pnpm build`.

## Result

Implementation is complete in both working trees. Backend focused and full
Jest runs pass with 9 tests; Prisma schema validation, backend ESLint,
TypeScript, formatting, and build pass. Frontend ESLint, formatting,
TypeScript, and production build pass, with one pre-existing `VideoPlayer`
hook-dependency warning.

The plan remains active because no isolated database migration or real admin UI
deletion was run. The backend repository has no checked-in operational runbook,
and this task did not authorize using a production-like database. Runtime proof
and migration rehearsal remain required before deployment.
