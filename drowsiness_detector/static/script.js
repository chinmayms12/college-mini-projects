// Frontend logic: capture webcam frames and POST to /detect
const video = document.getElementById("video");
const hiddenCanvas = document.getElementById("hiddenCanvas");
const ctx = hiddenCanvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const stateSpan = document.getElementById("state");
const earSpan = document.getElementById("ear");
const framesSpan = document.getElementById("frames");

let stream = null;
let intervalId = null;
let alarmPlaying = false;

// WebAudio beep alarm (no external file needed)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(){
  if(alarmPlaying) return;
  alarmPlaying = true;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  setTimeout(()=> {
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    o.stop(audioCtx.currentTime + 0.15);
    alarmPlaying = false;
  }, 800);
}

async function startCamera(){
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    video.srcObject = stream;
    await video.play();
    stateSpan.textContent = "Ready";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (e){
    console.error(e);
    stateSpan.textContent = "Camera unavailable";
  }
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  stateSpan.textContent = "Stopped";
}

async function sendFrame(){
  if(!stream) return;
  // draw current frame to canvas
  const w = hiddenCanvas.width = video.videoWidth || 640;
  const h = hiddenCanvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, w, h);
  // get dataURL (JPEG to reduce size)
  const dataURL = hiddenCanvas.toDataURL("image/jpeg", 0.6);

  try {
    const res = await fetch("/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataURL })
    });
    const j = await res.json();
    if(j.error){
      stateSpan.textContent = "Error: " + j.error;
      return;
    }
    earSpan.textContent = j.ear !== undefined ? j.ear : "-";
    framesSpan.textContent = j.frames_below !== undefined ? j.frames_below : "0";
    if(j.message === "no_face"){
      stateSpan.textContent = "No face detected";
    } else if (j.drowsy){
      stateSpan.textContent = "Drowsy! Wake up!";
      playBeep();
    } else {
      stateSpan.textContent = "Alert";
    }
  } catch (e){
    console.error(e);
    stateSpan.textContent = "Server error";
  }
}

// Start capturing frames every 300ms (adjustable)
startBtn.addEventListener("click", async () => {
  await startCamera();
  if(!intervalId) intervalId = setInterval(sendFrame, 300);
});

stopBtn.addEventListener("click", () => {
  stopCamera();
});

// Stop when leaving page
window.addEventListener("beforeunload", stopCamera);