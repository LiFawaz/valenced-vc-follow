/// <reference types="@valenced/types" />

import { lookupModules, waitForModules } from "@valenced/modules/finders";
import * as discordFinders from "@valenced/discord/utils/modules/finders";
import { withName, withProps } from "@valenced/modules/finders/filters";
import { after, before, instead } from "@valenced/patcher";

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
    // After an intentional disconnect, wait until the user chooses a VC themselves.
    // Once they join one, resume following and immediately move to the target's VC.
    if (id === currentUserId() && channelId && manualHold && followingUserId) {
      manualHold = false;
      log("Manual hold cleared after you joined a voice channel");
      const target = voiceChannelFor(followingUserId);
      if (target) joinChannel(target, "resume after manual VC join");
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
  const me = currentUserId();
  if (!userId) { log("ERROR: /vcf received an empty user ID."); return; }
  if (me && userId === me) { log("ERROR: You cannot follow your own user ID."); return; }
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
  log("Following started", userId, "current user:", me ?? "NOT FOUND", "voice store:", voiceStore() ? "found" : "NOT FOUND", "voice actions:", typeof voiceActions()?.selectVoiceChannel === "function" ? "found" : "NOT FOUND");
  if (targetChannelId) joinChannel(targetChannelId, "follow start");
  else log("Target voice channel not found yet; polling for voice-state changes.");
}
function actionSheetRow(): any {
  try {
    for (const [mod] of lookupModules(withProps("ActionSheetRow") as any, { returnNamespace: true } as any)) {
      const row = (mod as AnyRecord)?.ActionSheetRow ?? (mod as AnyRecord)?.default;
      if (typeof row === "function") return row;
    }
  } catch {}
  return null;
}
function addProfileMenuEntry(mod: AnyRecord, key: string, component: Function) {
  if (!mod || typeof mod[key] !== "function") return;
  let menuUserId = "";
  const capture = before(mod, key as any, (args: any[]) => {
    const props = args?.[0] ?? {};
    menuUserId = String(props.userId ?? props.user?.id ?? props.user?.userId ?? props.member?.userId ?? props.userInfo?.id ?? "");
    return args;
  });
  const unpatch = after(mod, key as any, (result: any) => {
    const userId = menuUserId;
    menuUserId = "";
    if (!result?.props || !/^\d{15,22}$/.test(userId) || userId === currentUserId()) return result;
    const React = apiRef?.unscoped?.react?.React ?? apiRef?.unscoped?.react;
    const RN = apiRef?.unscoped?.react?.native?.ReactNative ?? apiRef?.unscoped?.react?.native;
    if (!React?.createElement) return result;
    const Row = actionSheetRow();
    const entry = Row
      ? React.createElement(Row, {
          key: "vc-follow-entry",
          label: followingUserId === userId ? "Stop following VC" : "Follow VC",
          onPress: () => follow(userId),
        })
      : RN?.Pressable && RN?.Text
        ? React.createElement(RN.Pressable, {
            key: "vc-follow-entry",
            onPress: () => follow(userId),
            style: { paddingHorizontal: 16, paddingVertical: 12 },
            accessibilityRole: "button",
            accessibilityLabel: "Follow VC",
          }, React.createElement(RN.Text, { style: { color: "#FFFFFF", fontSize: 16 } }, followingUserId === userId ? "Stop following VC" : "Follow VC"))
        : null;
    if (!entry) return result;
    const children = result.props.children;
    const nextChildren = Array.isArray(children) ? [...children, entry] : children == null ? [entry] : [children, entry];
    try {
      return React.cloneElement ? React.cloneElement(result, { children: nextChildren }) : (result.props.children = nextChildren, result);
    } catch {
      return result;
    }
  });
  cleanups.push(capture, unpatch);
}
function patchMenus() {
  const names = ["UserContextMenu", "GuildMemberUserContextMenu", "NativeUserContextMenu", "UserProfileBottomSheetContextMenu"];
  let patched = 0;
  for (const name of names) {
    try {
      for (const [exports] of lookupModules(withName(name) as any, { returnNamespace: true } as any)) {
        const mod = exports as AnyRecord;
        if (!mod || typeof mod !== "object") continue;
        const key = typeof mod.default === "function" ? "default" : Object.keys(mod).find(k => typeof mod[k] === "function");
        if (!key) continue;
        addProfileMenuEntry(mod, key, mod[key]);
        patched++;
        log("Profile menu patched", name, key);
      }
    } catch (e) { log("Menu patch failed", name, String(e)); }
  }
  if (!patched) log("No matching profile menu exports found");
}
type CommandArg = { name: string; value: unknown };
type CommandContext = { channel?: { id: string } };
const BUILT_INS_PATH = "modules/application_commands/ApplicationCommandBuiltIns.tsx";
let commandRegistry: AnyRecord[] | null = null;
const queuedCommands = new Map<string, AnyRecord>();
let commandWatchers: Array<() => void> = [];
let commandWatching = false;
let followPoll: ReturnType<typeof setInterval> | null = null;

function commandEntry(name: string, description: string, options: AnyRecord[], execute: (args: CommandArg[], context: CommandContext) => void) {
  return {
    id: `lifawaz-vc-follow-${name}`, applicationId: "-1", type: 1, inputType: 0,
    name, displayName: name, untranslatedName: name,
    description, displayDescription: description, untranslatedDescription: description,
    options: options.map(option => ({ ...option, displayName: option.name, displayDescription: option.description, required: option.required ?? false })),
    execute(args: CommandArg[], context: CommandContext) { execute(args ?? [], context ?? {}); },
  };
}
function extractBuiltIns(mod: AnyRecord): AnyRecord[] | null {
  if (Array.isArray(mod?.BUILT_IN_COMMANDS)) return mod.BUILT_IN_COMMANDS;
  if (Array.isArray(mod?.default?.BUILT_IN_COMMANDS)) return mod.default.BUILT_IN_COMMANDS;
  return null;
}
function stopCommandWatchers() {
  for (const stop of commandWatchers.splice(0)) { try { stop(); } catch {} }
  commandWatching = false;
}
function adoptCommandRegistry(value: unknown) {
  if (commandRegistry || !Array.isArray(value)) return false;
  commandRegistry = value as AnyRecord[];
  for (const [id, entry] of queuedCommands) {
    const stale = commandRegistry.findIndex(command => command?.id === id);
    if (stale >= 0) commandRegistry.splice(stale, 1);
    commandRegistry.push(entry);
    log("Registered native built-in command", entry.name);
  }
  queuedCommands.clear();
  stopCommandWatchers();
  return true;
}
function watchCommandRegistry() {
  if (commandWatching || commandRegistry) return;
  commandWatching = true;
  try {
    const finder = discordFinders as AnyRecord;
    if (typeof finder.getModuleWithImportedPath === "function") {
      const unsubscribe = finder.getModuleWithImportedPath(BUILT_INS_PATH, (exports: AnyRecord) => adoptCommandRegistry(extractBuiltIns(exports)));
      if (typeof unsubscribe === "function") commandWatchers.push(unsubscribe);
    }
  } catch (error) { log("Command path lookup failed", String(error)); }
  if (commandRegistry) return stopCommandWatchers();
  try {
    const filter = withProps("BUILT_IN_COMMANDS");
    for (const [exports] of lookupModules(filter as any)) {
      if (adoptCommandRegistry(extractBuiltIns(exports as AnyRecord))) return;
    }
    const unsubscribe = waitForModules(filter as any, (exports: AnyRecord) => adoptCommandRegistry(extractBuiltIns(exports)));
    if (typeof unsubscribe === "function") commandWatchers.push(() => unsubscribe());
  } catch (error) { log("Command registry watcher failed", String(error)); }
}
function registerBuiltInCommand(entry: AnyRecord) {
  const id = String(entry.id);
  if (commandRegistry) {
    const stale = commandRegistry.findIndex(command => command?.id === id);
    if (stale >= 0) commandRegistry.splice(stale, 1);
    commandRegistry.push(entry);
    log("Registered native built-in command", entry.name);
  } else {
    queuedCommands.set(id, entry);
    watchCommandRegistry();
  }
  return () => {
    queuedCommands.delete(id);
    if (commandRegistry) {
      const index = commandRegistry.findIndex(command => command?.id === id);
      if (index >= 0) commandRegistry.splice(index, 1);
    }
    if (!queuedCommands.size) stopCommandWatchers();
  };
}
function registerCommands() {
  cleanups.push(registerBuiltInCommand(commandEntry("vcf", "Follow a user between voice channels.", [
    { name: "user_id", description: "Discord user ID to follow", type: 3, required: true },
  ], args => {
    const id = String(args.find(arg => arg?.name === "user_id")?.value ?? "").trim();
    if (/^\d{15,22}$/.test(id)) {
      if (id === currentUserId()) {
        log("ERROR: You cannot follow your own user ID.");
        return;
      }
      follow(id);
      if (!targetChannelId) log("Following is armed, but the target is not currently in a voice channel. Waiting for their next voice update.");
    } else {
      log("ERROR: Invalid user ID. Use /vcf user_id:<Discord user ID>.");
    }
  })));
  cleanups.push(registerBuiltInCommand(commandEntry("unvcf", "Stop following the current user.", [], () => {
    followingUserId = null; targetChannelId = null; manualHold = false;
    log("Following stopped by /unvcf");
  })));
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
    registerCommands();
    patchManualDisconnect();
    followPoll = setInterval(() => {
      if (!active || !followingUserId || manualHold) return;
      const target = voiceChannelFor(followingUserId);
      if (target && target !== targetChannelId) {
        targetChannelId = target;
        log("Detected target voice channel by polling", target);
        joinChannel(target, "poll");
      } else if (target && targetChannelId === target) {
        if (voiceChannelFor(currentUserId() ?? "") !== target && Date.now() - lastJoinAt > 5000) joinChannel(target, "poll retry");
      }
    }, 1500);
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
    if (followPoll) { clearInterval(followPoll); followPoll = null; }
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
