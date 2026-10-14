# "Add dark mode" split into task cards by an AI-COO

**Vague request:** Add dark mode
**Approved objective:** Add a user-selectable dark theme to the Leave Request form without changing behaviour or layout.
**Validator:** VALID - 8 cards, 5 dependency waves, parallel cards share no files.

## Wave 1 (can run in parallel)

### T1 - Define light and dark colour tokens as CSS variables

- **Assignee:** task-agent
- **Depends on:** nothing
- **Allowed files:**
  - day-19-capstone-leave-request/src/theme/tokens.css
- **Non-goals:**
  - Do not edit existing stylesheets
  - Do not add JavaScript
  - No new libraries
- **Acceptance checks:**
  - Every colour used by the form has a --token with a light value
  - A [data-theme="dark"] block redefines every token
  - All dark text/background pairs meet WCAG AA 4.5:1
- **Required local tests:**
  - Covered by T5 contrast test
- **Stop and report when:** A colour in use has no obvious token

### T2 - Theme state hook: saved choice, else OS preference

- **Assignee:** task-agent
- **Depends on:** nothing
- **Allowed files:**
  - day-19-capstone-leave-request/src/theme/useTheme.ts
  - day-19-capstone-leave-request/tests/useTheme.test.tsx
- **Non-goals:**
  - No UI
  - No server calls
  - No new libraries
- **Acceptance checks:**
  - Defaults to prefers-color-scheme when nothing is saved
  - A saved choice wins over the OS preference
  - Storage failure (private mode) falls back without throwing
- **Required local tests:**
  - Jest: default, saved choice, storage failure
- **Stop and report when:** localStorage is unavailable in the test environment

## Wave 2 (can run in parallel)

### T3 - Accessible theme toggle and mount it in the app header

- **Assignee:** task-agent
- **Depends on:** T2
- **Allowed files:**
  - day-19-capstone-leave-request/src/theme/ThemeToggle.tsx
  - day-19-capstone-leave-request/src/main.tsx
  - day-19-capstone-leave-request/tests/ThemeToggle.test.tsx
- **Non-goals:**
  - Do not change form fields
  - No icons library
  - No new libraries
- **Acceptance checks:**
  - A real <button> with aria-pressed reflecting the theme
  - Operable with Enter and Space; visible focus
  - Label announces the action (Switch to dark theme)
- **Required local tests:**
  - Jest: click and keyboard toggle update aria-pressed
- **Stop and report when:** main.tsx has changed since the task was written

### T4 - Move existing styles onto the colour tokens

- **Assignee:** task-agent
- **Depends on:** T1
- **Allowed files:**
  - day-19-capstone-leave-request/src/styles.css
- **Non-goals:**
  - Do not change spacing, layout or typography
  - Do not rename classes
  - No new libraries
- **Acceptance checks:**
  - No hard-coded colour remains in styles.css
  - The light theme looks pixel-identical to before
  - Dark theme renders every state (loading, error, empty, success)
- **Required local tests:**
  - Existing component test still passes
  - T5 contrast test passes
- **Stop and report when:** A rule cannot be expressed with an existing token

## Wave 3 (can run in parallel)

### T5 - Automated WCAG AA contrast test for both themes

- **Assignee:** task-agent
- **Depends on:** T1, T4
- **Allowed files:**
  - day-19-capstone-leave-request/tests/themeContrast.test.ts
- **Non-goals:**
  - Do not change colours to make the test pass
  - No new libraries
- **Acceptance checks:**
  - Parses tokens.css and checks each text/background pair
  - Fails when a pair drops below 4.5:1 (negative control)
- **Required local tests:**
  - Jest: all pairs pass in light and dark
- **Stop and report when:** A pair fails AA - report it, do not weaken the threshold

### T6 - Browser flow: toggle, persist across reload, keyboard only

- **Assignee:** task-agent
- **Depends on:** T3, T4
- **Allowed files:**
  - day-19-capstone-leave-request/tools/theme_flow.py
- **Non-goals:**
  - Do not edit application code
  - One flow only
- **Acceptance checks:**
  - Toggle switches data-theme and the computed page colours
  - The choice survives a reload
  - Works using only Tab and Enter
- **Required local tests:**
  - Playwright flow exits 0
- **Stop and report when:** The toggle is not reachable by keyboard

## Wave 4

### T7 - Independent review of the whole diff

- **Assignee:** review-agent
- **Depends on:** T1, T2, T3, T4, T5, T6
- **Allowed files:** none
- **Non-goals:**
  - Do not write code
  - No style or formatting remarks
- **Acceptance checks:**
  - Diff stays inside every card's allowed files
  - Contrast and keyboard checks have evidence
  - Every finding has a risk level and a required fix
- **Required local tests:** none
- **Stop and report when:** The diff touches a file no card owns

## Wave 5

### T8 - Human merge approval (security and scope verification)

- **Assignee:** human
- **Depends on:** T7
- **Allowed files:** none
- **Non-goals:**
  - The author may not approve their own change
- **Acceptance checks:**
  - Final CI passed on the exact final SHA
  - Reviewer is not the author
- **Required local tests:** none
- **Stop and report when:** CI is Not Run or blocked by infrastructure
