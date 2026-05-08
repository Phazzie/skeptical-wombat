/**
 * States in the Wombat analysis lifecycle.
 *
 * EXCAVATING  → Initial state. The user is dumping raw content.
 * CONFRONTING → After analysis: gaps and contradictions have been found.
 *               The user must confront and resolve them before drafting.
 * DRAFTING    → All gaps and contradictions resolved. Final writing stage.
 *
 * Transition rules enforced by Project.transitionTo():
 *   - EXCAVATING → CONFRONTING  (automatic, on analyze)
 *   - CONFRONTING → DRAFTING    (only when zero unresolved gaps/contradictions)
 */
export enum ProjectState {
  EXCAVATING = 'EXCAVATING',
  CONFRONTING = 'CONFRONTING',
  DRAFTING = 'DRAFTING',
}
