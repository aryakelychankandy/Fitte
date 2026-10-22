"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import { PillCta } from "@/components/ui/kit";
import useScanner from "./useScanner";
import { poseOnce, cameraErrorText } from "@/lib/vision";
import { measureBody } from "@/lib/bodyscan";
import { aggregateRatios, classifyRatios, ISSUE_TIPS } from "@/lib/bodytype";

const NEED = 18;
const BLOCKING = ["visibility", "cropped", "far", "turned", "tilted", "arms", "mask"];
const ORDER = ["visibility", "cropped", "far", "turned", "tilted", "arms", "mask"];

// Live body scan: finds you with pose + person segmentation, measures the
// silhouette (shoulders, bust, waist, hips), waits until you stand still and
// square-on, then reports a body type with a confidence.
export default function LiveBodyScan({ onResult, onClose }) {
  const sc = useScanner("user");
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [tip, setTip] = useState("Prop your phone up, step back so your whole body fits, arms slightly away from your sides.");
  const [ok, setOk] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const buf = useRef([]);

  const paint = (video, m, lms) => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = video.videoWidth; c.height = video.videoHeight;
    const x = c.getContext("2d");
    x.clearRect(0, 0, c.width, c.height);
    if (!lms) return;
    // joints
    x.fillStyle = "rgba(255,255,255,.85)";
    [11, 12, 23, 24, 25, 26, 27, 28].forEach((i) => {
      if ((lms[i].visibility ?? 1) < 0.5) return;
      x.beginPath(); x.arc(lms[i].x * c.width, lms[i].y * c.height, 5, 0, 7); x.fill();
    });
    if (m?.ok) {
      x.lineWidth = 3;
      [["chest", "#ffffff"], ["waist", "#7CF2C0"], ["hip", "#ffffff"]].forEach(([k, col]) => {
        const l = m.lines[k];
        x.strokeStyle = col;
        x.beginPath(); x.moveTo(l.x0 * c.width, l.y * c.height); x.lineTo(l.x1 * c.width, l.y * c.height); x.stroke();
      });
    }
  };

  const finish = (src) => {
    const agg = aggregateRatios(buf.current);
    const cls = classifyRatios(agg.ratios);
    onResult({ ...cls, ratios: agg.ratios, steady: agg.steady, frames: agg.n, source: src });
  };

  const step = async (video) => {
    const res = await poseOnce(video);
    if (!res) { setOk(false); setTip(ISSUE_TIPS.no_person); buf.current = []; setProgress(0); paint(video, null, null); return false; }
    const m = measureBody(res.landmarks, res.mask);
    paint(video, m, res.landmarks);
    const issues = (m.issues || []).filter((i) => BLOCKING.includes(i)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    if (!m.ok || issues.length) {
      setOk(false);
      setTip(ISSUE_TIPS[issues[0] || "mask"]);
      buf.current = [];
      setProgress(0);
      return false;
    }
    setOk(true);
    setTip("Perfect. Stay still while I measure.");
    buf.current.push(m.ratios);
    setProgress(Math.min(1, buf.current.length / NEED));
    if (buf.current.length >= NEED) {
      sc.stop();
      finish("camera");
      return true;
    }
    return false;
  };

  const begin = () => { buf.current = []; setProgress(0); sc.start(step, { fps: 8 }); };

  const fromPhoto = async (file) => {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const res = await poseOnce(img, 900);
      if (!res) { setErr(ISSUE_TIPS.no_person); }
      else {
        const m = measureBody(res.landmarks, res.mask);
        const issues = (m.issues || []).filter((i) => BLOCKING.includes(i));
        if (!m.ok || issues.length) setErr(ISSUE_TIPS[ORDER.find((k) => issues.includes(k)) || "mask"]);
        else {
          buf.current = [m.ratios];
          const cls = classifyRatios(m.ratios);
          onResult({ ...cls, ratios: m.ratios, steady: true, frames: 1, single: true, source: "photo" });
        }
      }
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setErr(cameraErrorText(e));
    }
    setBusy(false);
  };

  const live = sc.state === "live";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink text-white shadow-neu-lg" data-testid="body-scan">
      <button type="button" onClick={() => { sc.stop(); onClose?.(); }} aria-label="Close scan" className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
        <X size={16} />
      </button>
      <div className="relative mx-auto aspect-[9/16] max-h-[680px] w-full max-w-[420px] bg-black sm:aspect-[3/4] sm:max-w-[520px]">
        <video ref={sc.videoRef} playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-contain ${live ? "" : "opacity-0"}`} />
        <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-contain ${live ? "" : "hidden"}`} />
        {live && (
          <>
            <svg viewBox="0 0 100 150" className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity ${ok ? "opacity-0" : "opacity-60"}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <g fill="none" stroke="white" strokeWidth=".5" strokeDasharray="2 1.5">
                <circle cx="50" cy="17" r="8" />
                <path d="M33 32 Q50 27 67 32 L72 70 L66 70 L63 98 L60 138 L52 138 L50 100 L48 138 L40 138 L37 98 L34 70 L28 70 Z" />
              </g>
            </svg>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-5 pt-16">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className={`h-full rounded-full transition-all ${ok ? "bg-emerald-300" : "bg-white/60"}`} style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="flex items-start gap-2 text-sm font-medium" role="status" data-testid="scan-tip"><User size={16} className="mt-0.5 shrink-0" /> {tip}</p>
            </div>
          </>
        )}
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera size={34} className="text-white/70" />
            <p className="text-lg font-bold leading-snug">{sc.state === "starting" ? "Starting your camera…" : "Stand back. Let DRIFT read your shape."}</p>
            <p className="max-w-xs text-sm text-white/60">
              We measure the outline of your body on this device. Nothing is recorded, saved or uploaded.
            </p>
            {sc.state === "starting" ? null : (
              <div className="flex flex-col items-center gap-3">
                <div data-testid="start-body-camera"><PillCta onClick={begin}>Start live scan</PillCta></div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 underline-offset-4 hover:underline">
                  <Upload size={13} /> {busy ? "Reading photo…" : "or upload a full-length photo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => fromPhoto(e.target.files?.[0])} />
              </div>
            )}
            {(sc.error || err) && <p className="max-w-xs rounded-2xl bg-white/10 p-3 text-xs leading-relaxed text-white/85" role="alert">{sc.error || err}</p>}
          </div>
        )}
      </div>
      <p className="px-5 pb-4 pt-3 text-center text-[11px] text-white/45">
        Best results: fitted clothes (loose layers hide your shape), plain wall, even light, facing the camera, arms a little away from your sides, feet visible.
      </p>
    </div>
  );
}
