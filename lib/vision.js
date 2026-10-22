// On-device vision: MediaPipe face mesh + pose, loaded lazily from /mediapipe
// (copied from node_modules by scripts/copy-mediapipe.mjs). Nothing is uploaded;
// frames never leave the browser.

const scripts = {};
function loadScript(src) {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = () => reject(new Error("model-files-missing"));
      document.head.appendChild(s);
    });
  }
  return scripts[src];
}

let faceP = null;
let poseP = null;

export function getFace() {
  if (!faceP) {
    faceP = (async () => {
      await loadScript("/mediapipe/face_mesh/face_mesh.js");
      const fm = new window.FaceMesh({ locateFile: (f) => `/mediapipe/face_mesh/${f}` });
      fm.setOptions({ maxNumFaces: 2, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      const box = { cb: null };
      fm.onResults((r) => box.cb && box.cb(r));
      await fm.initialize();
      return { fm, box };
    })().catch((e) => { faceP = null; throw e; });
  }
  return faceP;
}

export function getPose() {
  if (!poseP) {
    poseP = (async () => {
      await loadScript("/mediapipe/pose/pose.js");
      const pose = new window.Pose({ locateFile: (f) => `/mediapipe/pose/${f}` });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: false,
        enableSegmentation: true,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      const box = { cb: null };
      pose.onResults((r) => box.cb && box.cb(r));
      await pose.initialize();
      return { pose, box };
    })().catch((e) => { poseP = null; throw e; });
  }
  return poseP;
}

// Run the face model on an image/video/canvas. Returns { faces: [landmarks[]] }.
export async function faceOnce(source) {
  const h = await getFace();
  return new Promise(async (resolve, reject) => {
    h.box.cb = (r) => resolve({ faces: r.multiFaceLandmarks || [] });
    try { await h.fm.send({ image: source }); } catch (e) { reject(e); }
  });
}

// Run pose + segmentation. Returns { landmarks, mask:{data,w,h} } or null.
export async function poseOnce(source, maxSide = 640) {
  const h = await getPose();
  const res = await new Promise(async (resolve, reject) => {
    h.box.cb = resolve;
    try { await h.pose.send({ image: source }); } catch (e) { reject(e); }
  });
  if (!res?.poseLandmarks || !res.segmentationMask) return null;
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k)), hh = Math.max(1, Math.round(sh * k));
  const c = document.createElement("canvas");
  c.width = w; c.height = hh;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(res.segmentationMask, 0, 0, w, hh);
  const d = x.getImageData(0, 0, w, hh).data;
  const data = new Uint8Array(w * hh);
  for (let i = 0; i < data.length; i++) data[i] = d[i * 4];
  return { landmarks: res.poseLandmarks, mask: { data, w, h: hh } };
}

// Camera helpers ---------------------------------------------------------
export async function openCamera(video, facing = "user") {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera-api");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  return stream;
}
export function closeCamera(video, stream) {
  try { stream?.getTracks().forEach((t) => t.stop()); } catch {}
  if (video) video.srcObject = null;
}

export function cameraErrorText(e) {
  const n = e?.name || e?.message || "";
  if (n === "NotAllowedError" || n === "SecurityError") return "Camera permission was blocked. Allow the camera in your browser's address bar, or use the manual options.";
  if (n === "NotFoundError" || n === "OverconstrainedError" || n === "no-camera-api") return "No camera found (or this page isn't on https / localhost). You can upload a photo instead.";
  if (n === "model-files-missing") return "The on-device models weren't installed. Run npm install once so they are copied. You can still choose manually.";
  return "Couldn't start the camera. You can upload a photo or choose manually.";
}
