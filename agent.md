# AGENTS.md

## 1. Think Before Coding

Do not assume business logic silently.

Before implementing:

- State assumptions explicitly.
- If requirements are ambiguous, ask.
- If multiple implementations exist, explain the tradeoffs.
- Prefer the simplest working solution.
- Stop and clarify unclear requirements before coding.

Examples:

- "Should expenses be editable after creation?"
- "Can a participant belong to multiple events simultaneously?"
- "Should invitations work only between registered users?"

Do not invent product rules.

---

## 2. Simplicity First

Build only the MVP features described in the project.

Avoid:

- unnecessary abstractions;
- premature optimization;
- over-engineered architectures;
- generic utility systems for single-use features;
- speculative features not requested.

Rules:

- Keep components small.
- Keep hooks focused.
- Keep state simple.
- Prefer readable code over clever code.
- Prefer explicit types over advanced TypeScript patterns.

If a feature can be implemented in 50 lines instead of 200, choose 50.

---

## 3. Surgical Changes

Only modify what is required.

When editing code:

- Do not refactor unrelated files.
- Do not rename variables without reason.
- Do not reformat unrelated code.
- Match the existing code style.
- Remove only the unused code introduced by your own changes.

If unrelated issues are discovered:

- Mention them separately.
- Do not fix them unless requested.

Every modified line must directly support the requested feature or fix.

---

## 4. Goal-Driven Execution

Define success criteria before implementation.

Examples:

### Bug Fix

1. Reproduce the bug
2. Implement the fix
3. Verify the bug no longer occurs

### Feature

1. Create UI
2. Connect state
3. Persist data
4. Verify complete user flow

For multi-step tasks:

1. [Step] → verify: [expected result]
2. [Step] → verify: [expected result]
3. [Step] → verify: [expected result]

Avoid vague goals like:

- "make it work"
- "improve performance"

Prefer measurable outcomes.

---

# 5. Project Context — Event Expense Sharing App

## Tech Stack

- React Native with Expo
- TypeScript only
- Supabase
- PostgreSQL
- React Navigation
- React Context or Zustand for global state
- No Redux unless explicitly required

Rules:

- No JavaScript files
- Keep TypeScript simple
- Prefer explicit interfaces/types
- Avoid advanced generics

---

# 6. Application Concept

The application helps groups organize events and manage shared expenses.

Users can:

- create events;
- invite participants;
- add expenses;
- calculate reimbursements automatically;
- track shared costs clearly.

The application centralizes event organization and expense management in one mobile app.

---

# 7. Core Features (MVP)

## Authentication

Users can:

- create an account;
- log in;
- log out.

Authentication uses Supabase Auth.

---

## Events

Users can:

- create an event;
- edit event information;
- view event details;
- view their event list.

Each event contains:

- title;
- date;
- time;
- location;
- description;
- creator.

---

## Participants

Users can:

- invite other registered users;
- accept or refuse invitations;
- view participant lists.

Participant statuses:

- pending
- accepted
- refused

---

## Expenses

Users can:

- add an expense;
- specify:
  - title;
  - amount;
  - payer;
  - participants involved.

Expenses belong to one event.

---

## Expense Sharing

The app automatically calculates:

- total paid by each participant;
- total owed by each participant;
- reimbursements between participants.

The calculation logic must remain simple and transparent.

---

## Expense History

Users can:

- view all event expenses;
- track spending history.

---

## Final Summary

Each event displays:

- total event cost;
- amount paid per participant;
- balances;
- reimbursements to perform.

Example:

- Tom owes 12€ to Sarah
- Inès owes 8€ to Lucas

---

# 8. Architecture

Single React Native application.

Suggested structure:

```txt
src/
├── components/
├── screens/
├── navigation/
├── services/
├── hooks/
├── context/
├── lib/
├── types/
├── utils/
└── supabase/
```

# 9.Supabase Schema

profiles
Field Type Role
id uuid PK User identifier
username text Display name
email text User email
created_at timestamptz Creation date
events
Field Type Role
id uuid PK Event identifier
title text Event title
date date Event date
time time Event time
location text Event location
description text Event description
created_by uuid FK References profiles.id
created_at timestamptz Creation date
event_participants
Field Type Role
id uuid PK Relation identifier
event_id uuid FK References events.id
user_id uuid FK References profiles.id
status text pending / accepted / refused
joined_at timestamptz Participation timestamp
expenses
Field Type Role
id uuid PK Expense identifier
event_id uuid FK References events.id
title text Expense title
amount decimal Expense amount
paid_by uuid FK References profiles.id
created_at timestamptz Creation date
expense_shares
Field Type Role
id uuid PK Share identifier
expense_id uuid FK References expenses.id
user_id uuid FK References profiles.id
share_amount decimal Amount owed
invitations
Field Type Role
id uuid PK Invitation identifier
event_id uuid FK References events.id
invited_by uuid FK References profiles.id
invited_user_id uuid FK References profiles.id
status text pending / accepted / refused
created_at timestamptz Creation date

# 10. Realtime

Supabase Realtime may be used for:
live participant updates;
live invitations;
live expense updates.
Realtime is optional for MVP unless explicitly requested.

# 11. Key Constraints

Application requires authentication.
Users can only access events they participate in.
Shared expenses must stay consistent across all participants.
Calculations should be deterministic and reproducible.
No offline support required for MVP.
No payment integration.
No chat system for MVP.
Invitations only work between registered users.

# 12. Calculation Rules

Expense calculations must follow these principles:
Each expense is split equally between selected participants.
The payer already covers their own share.
Other participants reimburse the payer.
Balances are calculated from:
total paid;
total owed.
Keep calculations explicit and easy to debug.
Avoid premature optimization.

---

# 13. Course-Based React Native Guidelines

The project should follow the React Native patterns covered in class as much as possible.

The course modules covered:

- Module I: `useState`, `useRef`, `useEffect`, `View`, `Text`, `TextInput`.
- Module II: `Context`, `Provider`, safe areas, `ScrollView`, `FlatList`, API calls.
- Module III: Expo Router, `Stack`, `Tabs`, dynamic routes, route params, images.
- Module IV: `Pressable`, `ActivityIndicator`, loading/error states, custom hooks.
- Module V: React Hook Form, `Controller`, Zod validation, `AsyncStorage`, `SecureStore`.
- Module VI: image picker, camera, advanced styles, `Platform`, responsive layouts.
- Module VII: render performance, `React.memo`, `useMemo`, `useCallback`.
- Module VIII: SQLite, `SQLiteProvider`, `useSQLiteContext`, migrations with `PRAGMA user_version`.

## Preferred Architecture

Keep Expo Router routes inside `app/`, but move reusable application code into `src/`:

```txt
app/
├── _layout.tsx
├── (auth)/
├── (tabs)/
└── events/

src/
├── components/
├── screens/
├── context/
├── hooks/
├── services/
├── types/
├── utils/
└── supabase/
```

Rules:

- `app/` files should mostly define routes and navigation structure.
- Screen UI should live in `src/screens/` when it becomes non-trivial.
- Reusable UI belongs in `src/components/`.
- Shared state belongs in `src/context/` using the Context/Provider pattern.
- Reusable logic belongs in `src/hooks/`.
- Supabase access belongs in `src/services/` or `src/supabase/`.
- Shared interfaces belong in `src/types/`.
- Pure calculation functions belong in `src/utils/`.

## Navigation

Use Expo Router as taught in class:

- Use `_layout.tsx` for `Stack` and `Tabs`.
- Use route files for screens.
- Use `router.push()` for normal navigation.
- Use `router.replace()` after authentication changes when the user should not go back.
- Use dynamic routes like `app/events/[id].tsx` for details.
- Use `useLocalSearchParams()` to read route parameters.

Avoid adding another navigation system unless explicitly required.

## State Management

Use simple state first:

- Use `useState` for local screen state.
- Use `useEffect` for loading data on mount or when dependencies change.
- Use `useRef` only for persistent mutable values that should not trigger re-renders.
- Use Context/Provider for global state such as authenticated user/session.
- Avoid Redux.
- Avoid Zustand unless Context becomes clearly insufficient.

## UI Components

Use the course primitives:

- Use `View`, `Text`, `TextInput`, `Image`, `ScrollView`, and `FlatList`.
- Use `Pressable` for custom interactive elements.
- Use `ActivityIndicator` for loading states.
- Use `FlatList` for dynamic lists of events, participants, invitations, or expenses.
- Use `ScrollView` for small static pages or forms.
- Keep components small and readable.

## Loading And Errors

For data screens, follow the class pattern:

1. Start with `loading = true`.
2. Fetch data in `useEffect` or a custom hook.
3. Show an `ActivityIndicator` while loading.
4. Show a simple error message if loading fails.
5. Show the content when data is available.

If the same loading logic is reused, extract it into a custom hook.

## Forms And Validation

For simple one-off inputs, `useState` with `TextInput` is acceptable.

For real forms such as login, register, create event, edit event, and add expense:

- Use React Hook Form.
- Use `Controller` to connect `TextInput`.
- Use Zod for schema validation.
- Infer TypeScript types from the Zod schema when useful.
- Keep validation rules close to the form schema.

## Persistence

Use the storage mechanism that matches the data:

- Supabase is the main source of truth for the MVP.
- Use `SecureStore` for sensitive local values such as auth tokens if needed.
- Use `AsyncStorage` only for non-sensitive preferences or small caches.
- Use SQLite only if local relational persistence becomes a real requirement.

Do not add SQLite just because it was covered in class.

## Performance

Optimize only when there is a concrete reason:

- Use `useCallback` for stable `FlatList` callbacks such as `renderItem`.
- Use `useMemo` for derived values that are expensive or passed to memoized children.
- Use `React.memo` for repeated list items when re-renders become visible or likely.
- Do not add memoization everywhere by default.

## Styling

Use `StyleSheet.create`.

Keep styles close to the component unless they become reusable.

Use:

- `Platform` for platform-specific behavior.
- responsive dimensions only when needed.
- safe area handling for screens with content near device edges.

Avoid large styling abstractions before the UI needs them.
