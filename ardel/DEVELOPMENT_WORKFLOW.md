# ARDEL Development Workflow

## Reference
ARDEL follows the proven iterative workflow used during the Tower project.

## Rules
1. Inspect the current file/state before changing it.
2. Make one coherent feature change at a time.
3. Commit every meaningful milestone with a clear message.
4. Validate syntax/structure immediately after each change.
5. Separate logic changes from UI changes when possible.
6. Run the actual playable flow after changes.
7. Check for regression in existing systems before adding another feature.
8. Preserve intentional design changes; do not revert them as bugs.
9. When a test fails, diagnose the smallest failing unit before making another large change.
10. Use Git history as the rollback point instead of fake/manual backup markers.

## ARDEL v0.5 validation order
- Load page
- Select each ally
- Move within the 3 lanes
- Verify AP consumption
- Verify attack range
- Select an enemy target directly
- Verify counterattack
- Test each character's role-specific action
- End turn and verify enemy AI
- Verify morale / West Army time / 7-turn condition
- Verify success and failure states
- Recheck mobile touch layout

## Development philosophy
The prototype must remain playable after every milestone. Prefer small, testable increments over large rewrites.

Core question for every feature:
"Does this give the commander a meaningful decision and make the result of that decision matter?"
