"use client";
// Owner: P1. Mounts P4's cinematic rocket-assembly front end (prototype/rocket-assembly) as the app's
// main screen. The prototype is plain three.js + anime.js that looks up these exact element ids, so this
// component renders its markup and then starts it once on the client. The Grok API routes keep working
// behind it; wiring them into this screen is the next step.
import { useEffect } from "react";
import "../../../prototype/rocket-assembly/src/style.css";

let started = false; // the prototype sets up one renderer per page; never start it twice

export default function AssemblyStage() {
  useEffect(() => {
    if (started) return;
    started = true;
    void import("../../../prototype/rocket-assembly/src/main.js");
  }, []);

  return (
    <>
      <canvas id="scene" aria-label="3D rocket assembly" />

      <header className="brand">
        <h1>Rocket assembly</h1>
        <p>
          Click the ghost to build the next part · click a part for details · <kbd>Space</kbd> explode · <kbd>B</kbd> build all ·{" "}
          <kbd>R</kbd> reset · <kbd>[</kbd> <kbd>]</kbd> change rocket
        </p>
      </header>

      <aside className="detail" id="detail" aria-live="polite" />

      <div className="hud" id="hud">
        <span id="hud-text">Pad ready</span>
      </div>

      <footer className="bar">
        <button id="btn-build-all" type="button">
          Build all
        </button>
        <button id="btn-explode" type="button" disabled>
          Explode
        </button>
        <button id="btn-reset" type="button" className="quiet">
          Reset
        </button>
        <button id="btn-sound" type="button" className="quiet" aria-pressed="true">
          Sound on
        </button>
      </footer>
    </>
  );
}
