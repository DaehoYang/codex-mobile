### Thread goal mode

#### Feature/Change Name
Manage Codex's persisted thread goal from the composer and display its live
status, token usage, and elapsed time above the composer.

#### Prerequisites/Setup
1. Install a Codex CLI version whose app-server exposes `thread/goal/set`,
   `thread/goal/get`, and `thread/goal/clear`.
2. Build and start Codex Mobile directly or below a reverse-proxy base path.
3. Open browser developer tools so app-server RPC requests and console errors
   can be inspected.

#### Steps
1. On the new-thread screen, open the composer **+** menu and select **Goal**.
2. Enter an objective and optional positive token budget, then select
   **Start goal**.
3. Confirm that the new thread starts with the objective as its first message
   and that the goal row appears above the composer.
4. Reload the page and reopen the thread.
5. Use **Edit**, **Pause**, **Resume**, and **Clear**, confirming the clear
   prompt before deletion.
6. In another thread, submit `/goal`, `/goal Keep the tests green`,
   `/goal edit`, `/goal pause`, `/goal resume`, and `/goal clear`.
7. While the goal is active, inspect status changes delivered by
   `thread/goal/updated` and `thread/goal/cleared`.
8. Repeat the active row and editor checks in light and dark themes at
   375x812 and 768x1024 viewports.
9. Repeat through the configured JupyterHub or other reverse-proxy base path.

#### Expected Results
- The Goal menu opens a focused inline editor without sending `/goal` as an
  ordinary chat message.
- A goal is persisted before the new thread's first turn starts.
- The row shows the objective, status, compact token usage, elapsed time, and
  actions that are valid for the current status.
- Editing the objective resets usage according to Codex semantics; status-only
  updates preserve the objective and usage.
- Reloading or switching back to a thread performs at most one goal read for
  that thread until its cached state is invalidated.
- Goal notifications update the row directly and do not trigger a thread-list
  or conversation-history refresh.
- Clearing removes the row after confirmation.
- Unsupported older Codex CLIs leave normal chat usable even when goal loading
  fails.
- The controls remain readable, reachable, and free of horizontal overflow in
  both themes and both responsive viewports.
- Goal RPC requests remain below the active reverse-proxy base path.

#### Rollback/Cleanup
- Clear any test goals and archive disposable test threads.
- Revert the goal gateway, state, composer menu, progress row, and command
  parser changes to remove the feature.
