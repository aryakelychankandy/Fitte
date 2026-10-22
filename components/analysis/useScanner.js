"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openCamera, closeCamera, cameraErrorText } from "@/lib/vision";

// Shared camera plumbing for the two live scans: owns the <video>, the stream,
// and a cancellable ~8fps loop that calls `step(video)` and waits for it.
export default function useScanner(facing = "user") {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const runRef = useRef(0);
  const [state, setState] = useState("idle"); // idle | starting | live | error
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    runRef.current++;
    closeCamera(videoRef.current, streamRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async (step, { fps = 8 } = {}) => {
    setError("");
    setState("starting");
    const id = ++runRef.current;
    try {
      streamRef.current = await openCamera(videoRef.current, facing);
    } catch (e) {
      setError(cameraErrorText(e));
      setState("error");
      return;
    }
    if (id !== runRef.current) { closeCamera(videoRef.current, streamRef.current); return; }
    setState("live");
    const gap = 1000 / fps;
    const loop = async () => {
      while (id === runRef.current) {
        const t0 = performance.now();
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth) {
          try {
            const done = await step(v);
            if (done) break;
          } catch (e) {
            if (id !== runRef.current) return;
            setError(cameraErrorText(e));
            setState("error");
            stop();
            return;
          }
        }
        const wait = gap - (performance.now() - t0);
        await new Promise((r) => setTimeout(r, Math.max(30, wait)));
      }
    };
    loop();
  }, [facing, stop]);

  return { videoRef, state, setState, error, setError, start, stop };
}
