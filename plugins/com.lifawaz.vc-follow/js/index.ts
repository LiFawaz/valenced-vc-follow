/// <reference types="@valenced/types" />

import { lookupModules } from "@valenced/modules/finders";
import { withName, withProps } from "@valenced/modules/finders/filters";
import { after, before } from "@valenced/patcher";

type AnyRecord = Record<string, any>;

let active = false;
let followingUserId: string | null = null;
let targetChannelId: string | null = null;
let manualHold = false;
let lastJoinAt = 0;
let apiRef: any;
const cleanups: Array<() => void> = [];
const CONNECT = 1n << 20n;

function log(...args: unknown[]) {
  try { console.log("[vc-follow]", ...args); } catch {}
}
function moduleWith(...props: string[]): AnyRecord | null {
  try {
    for (const [mod] of lookupModules(withProps(...props) as any)) {
      if (mod && typeof mod === "object") return mod as AnyRecord;
    }
  } catch {}
  return null;
}
function storeByName(name: string): AnyRecord | null {
  try {
    for (const [mod] of lookupModules(withProps("getName") as any)) {
      if (mod && typeof (mod as AnyRecord).getName === "function" && (mod as AnyRecord).getName() === name) return mod as AnyRecord;
    }
  } catch {}
  return null;
}
function currentUserId(): string | null {
  try {
    const s = storeByName("UserStore") ?? moduleWith("getCurrentUser");
    return s?.getCurrentUser?.()?.id ?? null;
  } catch { return null; }
}
function voiceStore(): AnyRecord | null {
  return storeByName("VoiceStateStore") ?? moduleWith("getVoiceStateForUser", "getVoiceStatesForChannel");
}
function channelStore(): AnyRecord | null {
  return storeByName("ChannelStore") ?? moduleWith("getChannel");
}
function voiceActions(): AnyRecord | null {
  return moduleWith("selectVoiceChannel");
}
function voiceChannelFor(userId: string): string | null {
  try {
    const s = voiceStore();
    const direct = s?.getVoiceStateForUser?.(userId);
    if (direct) return direct.channelId ?? direct.channel_id ?? null;
    const all = s?.getAllVoiceStates?.();
    if (all && typeof all === "object") {
      for (const group of Object.values(all) as AnyRecord[]) {
        const state = group?.[userId];
        if (state) return state.channelId ?? state.channel_id ?? null;
      }
    }
  } catch {}
  return null;
}
function joinChannel(channelId: string, reason: string) {
  if (!active || !followingUserId || manualHold || !channelId) return;
  if (voiceChannelFor(currentUserId() ?? "") === channelId) return;
  if (Date.now() - lastJoinAt < 1800) return;
  const channel = channelStore()?.getChannel?.(channelId);
  const permissions = moduleWith("can");
  if (channel && permissions?.can) {
    try {
      if (!permissions.can(CONNECT, channel)) {
        log("Cannot follow: CONNECT permission denied", channelId);
        return;
      }
    } catch {
      // Let Discord enforce permissions if this client exposes no compatible permission signature.
    }
  }
  const actions = voiceActions();
  if (typeof actions?.selectVoiceChannel !== "function") {
    log("Voice join action unavailable in this Discord build");
    return;
  }
  lastJoinAt = Date.now();
  try {
    actions.selectVoiceChannel(channelId);
    log("Join requested", channelId, reason);
  } catch (e) {
    log("Join request failed", String(e));
  }
}
function onVoiceUpdate(payload: AnyRecord) {
  if (!active || !payload) return;
  const type = String(payload.type ?? "");
  if (type && !type.includes("VOICE_STATE")) return;
  const states = payload.voiceStates ?? payload.voice_states ?? (payload.voiceState ? [payload.voiceState] : [payload]);
  if (!Array.isArray(states)) return;
  for (const state of states) {
    const id = String(state?.userId ?? state?.user_id ?? state?.user?.id ?? "");
    const channelId = state?.channelId ?? state?.channel_id ?? null;
    if (id === currentUserId() && !channelId) {
      // A manual disconnect is detected by the action wrapper below; an external
      // disconnect should rejoin the target, but never override an intentional one.
      if (!manualHold && followingUserId) {
        const target = voiceChannelFor(followingUserId);
        if (target) joinChannel(target, "external disconnect");
      }
    }
    if (id === followingUserId) {
      targetChannelId = channelId;
      if (channelId) joinChannel(channelId, "target voice update");
    }
  }
  if (followingUserId && !manualHold) {
    const nowTarget = voiceChannelFor(followingUserId);
    if (nowTarget && nowTarget !== targetChannelId) {
      targetChannelId = nowTarget;
      joinChannel(nowTarget, "voice store update");
    }
  }
}
function follow(userId: string) {
  if (!userId || userId === currentUserId()) return;
  if (followingUserId === userId) {
    followingUserId = null;
    targetChannelId = null;
    manualHold = false;
    log("Following stopped");
    return;
  }
  followingUserId = userId;
  manualHold = false;
  targetChannelId = voiceChannelFor(userId);
  log("Following started", userId);
  if (targetChannelId) joinChannel(targetChannelId, "follow start");
}
function addProfileMenuEntry(mod: AnyRecord, key: string) {
  const component = mod?.[key];
  if (typeof component !== "function") return;
  const unpatch = after(mod, key, (result: any) => {
    if (!result?.props) return result;
    const props = result.props ?? {};
    const userId = String(props.userId ?? props.user?.id ?? props.user?.userId ?? props.member?.userId ?? "");
    if (!/^\d{15,22}$/.test(userId) || userId === currentUserId()) return result;
    const React = apiRef?.unscoped?.react?.React ?? apiRef?.unscoped?.react;
    const RN = apiRef?.unscoped?.react?.native?.ReactNative ?? apiRef?.unscoped?.react?.native;
    if (!React?.createElement || !RN?.Pressable || !RN?.Text) return result;
    const button = React.createElement(
      RN.Pressable,
      {
        key: "vc-follow-entry",
        onPress: () => follow(userId),
        style: { paddingHorizontal: 16, paddingVertical: 12 },
        accessibilityRole: "button",
        accessibilityLabel: "Follow VC",
      },
      React.createElement(RN.Text, { style: { color: "#FFFFFF", fontSize: 16 } }, followingUserId === userId ? "Stop following VC" : "Follow VC"),
    );
    const children = props.children;
    // Add at the end of the user menu; exact placement depends on Discord's menu component.
    props.children = Array.isArray(children) ? [...children, button] : children == null ? [button] : [children, button];
    return result;
  });
  cleanups.push(unpatch);
}
function patchMenus() {
  const names = ["UserContextMenu", "GuildMemberUserContextMenu", "NativeUserContextMenu", "UserProfileBottomSheetContextMenu"];
  for (const name of names) {
    try {
      for (const [mod] of lookupModules(withName(name) as any)) {
        const exports = mod as AnyRecord;
        const key = typeof exports === "function" ? "default" : Object.keys(exports ?? {}).find(k => typeof exports[k] === "function");
        if (key) addProfileMenuEntry(exports, key);
      }
    } catch {}
  }
}
function patchManualDisconnect() {
  const actions = voiceActions();
  if (!actions) return;
  for (const key of ["selectVoiceChannel", "disconnect"]) {
    if (typeof actions[key] !== "function") continue;
    const unpatch = before(actions, key as any, (args: any[]) => {
      const disconnect = key === "disconnect" || (key === "selectVoiceChannel" && (args[0] == null || args[0] === ""));
      if (disconnect && active && followingUserId) {
        manualHold = true;
        log("Following paused after manual disconnect");
      }
      return args;
    });
    cleanups.push(unpatch);
  }
}
export default plugin({
  start(api) {
    apiRef = api;
    active = true;
    patchMenus();
    patchManualDisconnect();
    try {
      const flux = api.unscoped.discord.flux;
      if (typeof flux.onAnyFluxEventDispatched === "function") {
        cleanups.push(flux.onAnyFluxEventDispatched((payload: AnyRecord) => {
          onVoiceUpdate(payload);
          return payload;
        }));
      }
    } catch (e) { log("Flux listener unavailable", String(e)); }
    try {
      const store = voiceStore();
      if (typeof store?.addChangeListener === "function") {
        store.addChangeListener(onVoiceUpdate);
        cleanups.push(() => store.removeChangeListener?.(onVoiceUpdate));
      }
    } catch {}
    log("Started");
  },
  stop() {
    active = false;
    followingUserId = null;
    targetChannelId = null;
    manualHold = false;
    for (const cleanup of cleanups.splice(0)) {
      try { cleanup(); } catch {}
    }
    apiRef = null;
    log("Stopped");
  },
});
