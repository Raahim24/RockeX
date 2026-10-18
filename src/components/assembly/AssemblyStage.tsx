"use client";
// Owner: P1. Mounts P4's cinematic rocket-assembly front end (prototype/rocket-assembly) as the app's
// main screen. `markup` is the prototype's own index.html body (read on the server by markup.ts), so the
// elements always match what its main.js looks up. Then the prototype is started once on the client.
// The Grok API routes keep working behind it; wiring them into this screen is the next step.
import { useEffect } from "react";
import "../../../prototype/rocket-assembly/src/style.css";

let started = false; // the prototype sets up one renderer per page; never start it twice

export default function AssemblyStage({ markup }: { markup: string }) {
  useEffect(() => {
    if (started) return;
    started = true;
    void import("../../../prototype/rocket-assembly/src/main.js");
  }, []);

  // display: contents keeps the prototype's fixed-position layout exactly as in its own page.
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
