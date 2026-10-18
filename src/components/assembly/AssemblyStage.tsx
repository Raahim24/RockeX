"use client";
// Owner: P1. Mounts P4's cinematic rocket-assembly front end (prototype/rocket-assembly) as the app's
// main screen. `markup` is the prototype's own index.html body (read on the server by markup.ts), so the
// elements always match what its main.js looks up. Then the prototype is started once on the client.
// The build is shared with the app store both ways, so Grok reads and edits the rocket on screen:
// "assembly:build" (screen -> store), "assembly:apply" (store -> screen). The screen also reports which parts
// are placed ("assembly:progress") and when the whole rocket is on the stack ("assembly:complete").
import { GrokBar } from "@/components/grok/GrokBar";
import { LaunchReadiness } from "@/components/specs/LaunchReadiness";
import type { BuildProgress } from "@/components/grok/voiceTools";
import { useBuildStore } from "@/store/buildStore";
import type { BuildState } from "@/types";
import { useEffect, useSyncExternalStore } from "react";
import "../../../prototype/rocket-assembly/src/style.css";

const EMPTY: BuildProgress = [];
let started = false; // the prototype sets up one renderer per page; never start it twice

// Same identity the prototype uses: livery is not part of what the screen shows.
const buildKey = (b: BuildState): string => JSON.stringify([b.missionId, b.payloadId, b.stages]);

let rocketComplete = false;
let progress: BuildProgress = [];
const screenListeners = new Set<() => void>();
const subscribeScreen = (fn: () => void): (() => void) => {
  screenListeners.add(fn);
  return () => screenListeners.delete(fn);
};
const screenChanged = (): void => screenListeners.forEach((fn) => fn());

function connectStore(): void {
  addEventListener("assembly:complete", (e) => {
    rocketComplete = (e as CustomEvent<{ complete: boolean }>).detail.complete;
    screenChanged();
  });
  addEventListener("assembly:progress", (e) => {
    progress = (e as CustomEvent<{ parts: BuildProgress }>).detail.parts;
    screenChanged();
  });
  let screenKey = "";
  addEventListener("assembly:build", (e) => {
    const { build } = (e as CustomEvent<{ build: BuildState }>).detail;
    screenKey = buildKey(build);
    if (buildKey(useBuildStore.getState().build) !== screenKey) useBuildStore.setState({ build });
  });
  useBuildStore.subscribe(({ build }) => {
    if (buildKey(build) !== screenKey) dispatchEvent(new CustomEvent("assembly:apply", { detail: { build } }));
  });
}

export default function AssemblyStage({ markup }: { markup: string }) {
  const complete = useSyncExternalStore(subscribeScreen, () => rocketComplete, () => false);
  const parts = useSyncExternalStore(subscribeScreen, () => progress, () => EMPTY);
  useEffect(() => {
    if (started) return;
    started = true;
    connectStore(); // before the import: the prototype announces its first build while it loads
    void import("../../../prototype/rocket-assembly/src/main.js");
  }, []);

  return (
    <>
      {/* display: contents keeps the prototype's fixed-position layout exactly as in its own page. */}
      <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: markup }} />
      <LaunchReadiness complete={complete} />
      <GrokBar rocketReady={complete} progress={parts} />
    </>
  );
}
