"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Sun, X } from "lucide-react";
import { SoftButton, PillCta } from "@/components/ui/kit";
import useScanner from "./useScanner";
import { faceOnce, cameraErrorText } from "@/lib/vision";
import { analyseSkin, mergeReadings } from "@/lib/skin";

const NEED = 14; // good frames to collect before reporting

// Live skin-tone scan: guide oval, live tips, progress, then a merged reading.
export default function LiveColourScan({ onResult, onClose }) {
  const sc = useScanner("user");
  const fileRef = useRef(null);
  const [tip, setTip] = useState("Hold your phone or laptop at eye level, in daylight if you can.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const buf = useRef([]);
  const fails = useRef(0);

  const step = async (video) => {
    const { faces } = await faceOnce(video);
    const r = analyseSkin(video, faces);
    if (!r.ok) {
      fails.current++;
      if (fails.current > 2) setTip(r.tip);
      buf.current = buf.current.slice(-Math.max(0, buf.current.length - 1)); // lose a frame, do not reset entirely
      setProgress(Math.min(1, buf.current.length / NEED));
      return false;
    }
    fails.current = 0;
    setTip(r.note || (r.calibrated ? "Good light. Keep still." : "Keep still. Even daylight on your face works best."));
    buf.current.push(r);
    if (buf.current.length > NEED * 2) buf.current.shift();
    setProgress(Math.min(1, buf.current.length / NEED));
    if (buf.current.length >= NEED) {
      const merged = mergeReadings(buf.current);
      sc.stop();
      if (merged) onResult({ ...merged, source: "camera" });
      return true;
    }
    return false;
  };

  const begin = () => { buf.current = []; fails.current = 0; setProgress(0); sc.start(step, { fps: 7 }); };

  const fromPhoto = async (file) => {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const { faces } = await faceOnce(img);
      const r = analyseSkin(img, faces);
      if (!r.ok) { setErr(r.tip); }
      else { const merged = mergeReadings([r]); onResult({ ...merged, source: "photo", single: true }); }
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setErr(cameraErrorText(e));
    }
    setBusy(false);
  };

  const live = sc.state === "live";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink text-white shadow-neu-lg" data-testid="colour-scan">
      <button type="button" onClick={() => { sc.stop(); onClose?.(); }} aria-label="Close scan" className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
        <X size={16} />
      </button>

      <div className="relative mx-auto aspect-[3/4] max-h-[620px] w-full max-w-[460px] bg-black sm:aspect-[4/5]">
        <video ref={sc.videoRef} playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${live ? "" : "opacity-0"}`} />
        {live && (
          <>
            <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <mask id="oval-mask"><rect width="100" height="125" fill="white" /><ellipse cx="50" cy="58" rx="27" ry="35" fill="black" /></mask>
              </defs>
              <rect width="100" height="125" fill="rgba(0,0,0,.55)" mask="url(#oval-mask)" />
              <ellipse cx="50" cy="58" rx="27" ry="35" fill="none" stroke="white" strokeOpacity=".9" strokeWidth=".6" strokeDasharray="2 1.5" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-5 pt-16">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="flex items-start gap-2 text-sm font-medium" role="status" data-testid="scan-tip"><Sun size={16} className="mt-0.5 shrink-0" /> {tip}</p>
            </div>
          </>
        )}
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera size={34} className="text-white/70" />
            <p className="text-lg font-bold leading-snug">
              {sc.state === "starting" ? "Starting your camera…" : "Let's find the colours that love your skin."}
            </p>
            <p className="max-w-xs text-sm text-white/60">
              Everything is read on your device. The camera frames are never saved or uploaded.
            </p>
            {sc.state === "starting" ? null : (
              <div className="flex flex-col items-center gap-3">
                <div data-testid="start-colour-camera"><PillCta onClick={begin}>Start live scan</PillCta></div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 underline-offset-4 hover:underline">
                  <Upload size={13} /> {busy ? "Reading photo…" : "or upload a clear face photo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => fromPhoto(e.target.files?.[0])} />
              </div>
            )}
            {(sc.error || err) && <p className="max-w-xs rounded-2xl bg-white/10 p-3 text-xs leading-relaxed text-white/85" role="alert">{sc.error || err}</p>}
          </div>
        )}
      </div>
      <p className="px-5 pb-4 pt-3 text-center text-[11px] text-white/45">
        For best accuracy: face a window, no filters or beauty mode, no tinted lights, remove glasses and pull hair off your cheeks.
      </p>
    </div>
  );
}
