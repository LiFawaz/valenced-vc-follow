/// <reference types="@valenced/types" />

/**
 * VC Follow — Valenced port scaffold.
 *
 * The old plugin used Vendetta internals to inspect voice states and navigate
 * between channels. Those imports are not compatible with Valenced. Do not
 * guess private APIs here: wire following behavior only after verifying the
 * supported Discord/Valenced APIs for the target release.
 */
export default plugin({
  start() {
    console.log("[vc-follow] loaded; voice-follow adapter is not enabled yet");
  },

  stop() {
    console.log("[vc-follow] stopped");
  },
});
