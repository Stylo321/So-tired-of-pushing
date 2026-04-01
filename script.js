// Starfield background (canvas-based)
(function() {
  function rand(min, max) { return Math.random() * (max - min) + min; }
  const canvas = document.getElementById('starfield');
  if (!canvas) return; // if canvas missing, bail
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  let numStars = Math.max(80, Math.floor((w * h) / 8000));
  const stars = [];

  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.2, 1.6),
      vx: rand(-0.02, 0.02),
      vy: rand(0.02, 0.08),
      t: Math.random() * Math.PI * 2
    });
  }

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    // adjust stars if canvas size changed
    numStars = Math.max(80, Math.floor((w * h) / 8000));
    while (stars.length < numStars) {
      stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.2,1.6), vx: rand(-0.02,0.02), vy: rand(0.02,0.08), t: Math.random()*Math.PI*2 });
    }
    while (stars.length > numStars) stars.pop();
  }

  addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let s of stars) {
      s.x += s.vx * (s.r * 0.5);
      s.y += s.vy * (s.r * 0.5);
      if (s.x < 0) s.x = w;
      if (s.x > w) s.x = 0;
      if (s.y > h) s.y = 0;

      s.t += 0.02 + (s.r * 0.002);
      const alpha = 0.4 + Math.abs(Math.sin(s.t)) * 0.6;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${(alpha * (s.r/1.6)).toFixed(3)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

  // Expose a controller and FORCE the starfield visible (user requested)
  try {
    canvas.style.display = 'block';
    canvas.style.zIndex = '5';
    window._starfield = {
      canvas,
      show() { canvas.style.display = 'block'; },
      hide() { canvas.style.display = 'none'; }
    };
  } catch (e) {
    console.error('Starfield init error', e);
  }

})();

const screens = document.querySelectorAll(".screen");
const music = document.getElementById("bgMusic");
const intro = document.getElementById("introMusic");
const toggle = document.getElementById("musicToggle");
const cakeBtn = document.getElementById("cakeBtn");
const flame = document.getElementById("flame");
const nameContainer = document.getElementById("herName");

let current = 0;

// Show screen by ID
function showScreen(id) {
  screens.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Fade elements and remove them from layout while credits are showing.
  try {
    const selector = '.char-gif, .luffy-dance, .avatars';
    const extras = Array.from(document.querySelectorAll(selector));
    const meBtn = document.getElementById('meButton');
    const allEls = extras.concat(meBtn ? [meBtn] : []);
    const TRANS_MS = 600; // must match CSS transition duration

    if (id === 'credits') {
      allEls.forEach(el => {
        if (!el) return;
        // if already hidden via display none, skip
        if (getComputedStyle(el).display === 'none') return;
        // start fade
        el.classList.add('fade-hidden');
        // after transition, remove from layout
        const onEnd = (ev) => {
          if (ev && ev.target !== el) return;
          el.style.display = 'none';
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
        // fallback in case transitionend doesn't fire
        setTimeout(() => {
          if (getComputedStyle(el).display !== 'none') {
            el.style.display = 'none';
            try { el.removeEventListener('transitionend', onEnd); } catch(e){}
          }
        }, TRANS_MS + 80);
      });
    } else {
      allEls.forEach(el => {
        if (!el) return;
        // restore to layout first so transition can run
        el.style.display = '';
        // force reflow
        void el.offsetWidth;
        // then remove hidden class to fade back in
        el.classList.remove('fade-hidden');
      });
    }
  } catch (e) { /* ignore if elements missing */ }
}

// Start credits screen
function startCredits() {
  // stop intro (One Piece) if it's playing
  try {
    if (intro && !intro.paused) {
      intro.pause();
      intro.currentTime = 0;
    }
  } catch (e) {}

  showScreen("credits");
  music.play();
  toggle.textContent = "🔈";
}

// Music toggle: control whichever track is currently playing (intro or credits)
toggle.onclick = () => {
  try {
    if (intro && !intro.paused) {
      // control intro music
      if (intro.paused) {
        intro.play();
        toggle.textContent = "🔈";
      } else {
        intro.pause();
        toggle.textContent = "🔊";
      }
      return;
    }
  } catch (e) { /* ignore */ }

  // default: control credits/background music
  if (music.paused) {
    music.play();
    toggle.textContent = "🔈";
  } else {
    music.pause();
    toggle.textContent = "🔊";
  }
};

// Try to autoplay intro music on load (may be blocked by browser)
window.addEventListener('load', async () => {
  if (!intro) return;
  try {
    await intro.play();
    // show playing icon
    toggle.textContent = "🔈";
  } catch (err) {
    // autoplay blocked; keep toggle showing muted state
    console.warn('Autoplay blocked or prevented:', err);
    toggle.textContent = "🔊";
    // show overlay and attach a one-time user gesture to start intro
    try {
      const overlay = document.getElementById('autoplayOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        const startIntro = async () => {
          try {
            await intro.play();
            toggle.textContent = '🔈';
          } catch (e) {
            console.error('Failed to play intro after user gesture', e);
          }
          overlay.classList.add('hidden');
          document.removeEventListener('pointerdown', startIntro);
        };
        // try to play on any user interaction
        document.addEventListener('pointerdown', startIntro, { once: true });
        // also allow keyboard activation
        overlay.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') startIntro();
        });
        overlay.addEventListener('click', startIntro);
      }
    } catch (e) { console.error(e); }
  }
});

// Cake button: navigation only after ADVANCE has filled; otherwise handled by Advance logic below
// (keep the handler in place but guard it)
cakeBtn.addEventListener("click", () => {
  // If advance overlay has fully filled, allow navigation to cake screen
  const advanceOverlay = document.getElementById('advanceOverlay');
  if (advanceOverlay && parseFloat(getComputedStyle(advanceOverlay).opacity) >= 1) {
    showScreen("cakeScreen");
  }
  // otherwise, cake button click is consumed by Advance behavior (see handler added later)
});

function createSmoke() {
  for (let i = 0; i < 6; i++) {
    const smoke = document.createElement("div");
    smoke.className = "smoke";
    smoke.textContent = "💨";

    smoke.style.left = 50 + (Math.random() * 20 - 10) + "%";
    smoke.style.animationDelay = Math.random() * 0.3 + "s";

    document.body.appendChild(smoke);
    setTimeout(() => smoke.remove(), 2500);
  }
}


// Floating hearts
function createHeart() {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.textContent = Math.random() > 0.5 ? "♥" : "💗";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.fontSize = Math.random() * 20 + 10 + "px";
  heart.style.animationDuration = Math.random() * 3 + 3 + "s";
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 6000);
}
setInterval(createHeart, 300);

// Typewriter effect for her name
const name = "Aphiwe";
let i = 0;
function typeName() {
  if (i < name.length) {
    nameContainer.textContent += name[i++];
    setTimeout(typeName, 200);
  }
}
typeName();

// ----------- Interactive Cake Flame ----------
let audioContext;
let microphone;
let analyser;
let dataArray;
let blowing = false;

// -------- Voice Command: "Happy Birthday to Me" --------
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript
      .toLowerCase()
      .trim();

    console.log("Heard:", transcript);

if (
  (transcript.includes("Happy Birthday To Me") ||
   transcript.includes("I am loved") ||
   transcript.includes("And i am Beatiful")) &&
  !blowing
) {
  blowing = true;
  extinguishFlame();
}

  };

  recognition.onerror = (e) => {
    console.log("Speech error:", e);
  };

  recognition.start();
} else {
  console.log("Speech recognition not supported");
}

async function initMic() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    microphone.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    detectBlow();
  } catch (err) {
    alert("Microphone access is required for this interactive cake 🎂");
    console.error(err);
  }
}

function detectBlow() {
  analyser.getByteFrequencyData(dataArray);
  const avg = dataArray.reduce((a,b)=>a+b,0)/dataArray.length;

  // Lower threshold for sensitivity (detect smaller sounds)
  if (avg > 15 && !blowing) { // <-- changed from 50 to 15
    blowing = true;
    extinguishFlame();
  }
  // Manual blow button fallback
const manualBlowBtn = document.getElementById("manualBlowBtn");

if (manualBlowBtn) {
  manualBlowBtn.addEventListener("click", () => {
    if (!blowing) {
      blowing = true;
      extinguishFlame();
    }
  });
}


  requestAnimationFrame(detectBlow);
}
function launchConfetti() {
  const emojis = ["🎉", "🎊", "💖", "✨", "💝"];

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    confetti.style.setProperty("--x", `${Math.random() * 400 - 200}px`);
    confetti.style.setProperty("--y", `${Math.random() * 400 - 200}px`);

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2500);
  }
}
let historyStack = [];

function showScreen(id) {
  const active = document.querySelector(".screen.active");
  if (active && active.id !== id) {
    historyStack.push(active.id);
  }

  screens.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Delay revealing the credits crawl a few seconds for cinematic effect
  const crawl = document.querySelector('#credits .crawl');
  const titleCard = document.getElementById('titleCard');
  if (crawl) {
    if (id === 'credits') {
      // Force-hide specific GIFs and the ME button immediately (fixes cases where they don't disappear)
      try {
        ['chopper','luffyFixed','lawFixed','meButton'].forEach(iid => {
          const el = document.getElementById(iid);
          if (el) {
            el.classList.add('fade-hidden');
            el.style.display = 'none';
          }
        });
        // if ME video is open/playing, stop and hide it
        try {
          const meVid = document.getElementById('meVideo');
          const meOverlay = document.getElementById('meVideoOverlay');
          if (meVid && !meVid.paused) {
            meVid.pause();
            meVid.currentTime = 0;
          }
          if (meOverlay) {
            meOverlay.classList.add('hidden');
            meOverlay.setAttribute('aria-hidden','true');
          }
        } catch (e) {}
      } catch (e) {}
      // ensure crawl is reset and hidden
      try {
        crawl.style.transition = 'opacity 1s ease';
        crawl.style.opacity = 0;
        crawl.style.animationPlayState = 'paused';
        // reset the CSS animation so it starts from the beginning
        crawl.style.animation = 'none';
        // force reflow
        void crawl.offsetWidth;
        // restore animation — run the crawl once for the credits and detect when it ends
        // we set the animation explicitly so we can listen for 'animationend'
        const CRAWL_DURATION = 60000; // 60s in ms, matches CSS starCrawl duration
        crawl.style.animation = 'starCrawl 60s linear forwards';
        crawl.style.animationPlayState = 'paused';

        // Show title card immediately (if present)
        try {
          if (titleCard) {
            titleCard.classList.remove('hidden');
            titleCard.style.opacity = 1;
            titleCard.style.visibility = 'visible';
          }
        } catch (e) {}

        // Start fade of title card slightly before revealing the crawl
        const revealDelay = 3000; // total time before crawl starts (ms)
        const titleFadeStart = Math.max(600, revealDelay - 800);

        setTimeout(() => {
          try { if (titleCard) titleCard.classList.add('hidden'); } catch (e) {}
        }, titleFadeStart);

        // reveal crawl after revealDelay; start the one-shot animation
        setTimeout(() => {
          crawl.style.opacity = 1;
          // start the animation
          try {
            crawl.style.animationPlayState = 'running';
          } catch (e) {}
          try { if (titleCard) { titleCard.style.visibility = 'hidden'; } } catch (e) {}

          // when the crawl animation ends, show the cake button (fade in)
          const cakeBtn = document.getElementById('cakeBtn');
          const onAnimEnd = (ev) => {
            if (ev && ev.animationName && ev.animationName.indexOf('starCrawl') === -1) {
              // ignore unrelated animations
              return;
            }
            try {
              if (cakeBtn) {
                cakeBtn.classList.add('visible-cake');
              }
            } catch (e) {}
            crawl.removeEventListener('animationend', onAnimEnd);
          };

          crawl.addEventListener('animationend', onAnimEnd);

          // as a safety fallback, ensure cake appears after crawl duration
          setTimeout(() => {
            try { if (cakeBtn && !cakeBtn.classList.contains('visible-cake')) cakeBtn.classList.add('visible-cake'); } catch (e) {}
          }, CRAWL_DURATION + 200);

        }, revealDelay);
      } catch (e) { console.error('crawl reveal error', e); }
    } else {
      // hide and pause immediately when leaving credits
      try {
        crawl.style.opacity = 0;
        crawl.style.animationPlayState = 'paused';
        if (titleCard) {
          titleCard.classList.add('hidden');
          titleCard.style.visibility = 'hidden';
        }
        // restore any forced-hidden GIFs and the ME button
        try {
          ['chopper','luffyFixed','lawFixed','meButton'].forEach(iid => {
            const el = document.getElementById(iid);
            if (el) {
              el.style.display = '';
              void el.offsetWidth; // reflow
              el.classList.remove('fade-hidden');
            }
          });
        } catch (e) {}
      } catch (e) {}
    }
  }
}

document.getElementById("backBtn").onclick = () => {
   try {
    const letter = document.getElementById('giftLetter');
    // If gift letter is visible, hide it and restore the UI
    if (letter && !letter.classList.contains('hidden')) {
      letter.classList.add('hidden');
      letter.setAttribute('aria-hidden','true');
      // restore previously hidden elements
      try { restoreHiddenByGift(); } catch(e) {}
      // resume music if needed
      try { if (music && music.paused) music.play(); } catch(e) {}
      return;
    }
  } catch (e) {}

  if (historyStack.length > 0) {
    const prev = historyStack.pop();
    screens.forEach(s => s.classList.remove("active"));
    document.getElementById(prev).classList.add("active");
  }
};
function spawnShootingStar() {
  const credits = document.getElementById("credits");
  if (!credits.classList.contains("active")) return;

  const star = document.createElement("div");
  star.className = "shooting-star";

  star.style.left = Math.random() * 60 + "vw";
  star.style.top = Math.random() * 30 + "vh";

  credits.appendChild(star);

  setTimeout(() => star.remove(), 1500);
}

// Random interval (cinematic, not spammy)
// schedule shooting stars at random intervals between 3s and 10s
(function scheduleShootingStar() {
  const min = 3000; // 3s
  const max = 10000; // 10s
  const delay = Math.random() * (max - min) + min;
  setTimeout(() => {
    try { spawnShootingStar(); } catch (e) { console.error('shooting star error', e); }
    scheduleShootingStar();
  }, delay);
})();


function extinguishFlame() {
  flame.style.display = "none";
  createSmoke();
  launchConfetti();
}
document.getElementById("giftBtn").onclick = () => {
  showScreen("giftScreen");
};
// gift box click: play gift video then show letter, hiding other UI elements
const _hiddenByGift = [];
function hideNonEssentialForGift() {
  _hiddenByGift.length = 0;
  const selectors = [
    '.char-gif', '.luffy-dance', '.avatars', '.me-button',
    '#cakeBtn', '#giftBtn', '.start-btn', '.title', '.gift-message', '.gift-box', '.avatar'
  ];
  const els = document.querySelectorAll(selectors.join(','));
  els.forEach(el => {
    if (!el) return;
    _hiddenByGift.push({ el, display: el.style.display || '' });
    el.style.display = 'none';
  });
  // also hide overlays we don't want shown
  const extras = document.querySelectorAll('.me-video-overlay, #fullVideoOverlay, #advanceOverlay, #autoplayOverlay');
  extras.forEach(el => { if (!el) return; _hiddenByGift.push({ el, display: el.style.display || '' }); el.style.display = 'none'; });
}

function restoreHiddenByGift() {
  while (_hiddenByGift.length) {
    const item = _hiddenByGift.pop();
    try { item.el.style.display = item.display; } catch (e) {}
  }
}

document.querySelector(".gift-box").onclick = async () => {
  try {
    // show the gift screen so stars background (credits) are present if needed
    showScreen('giftScreen');

    // pause music briefly
    try { if (intro && !intro.paused) intro.pause(); } catch(e){}
    try { if (music && !music.paused) music.pause(); } catch(e){}

    // hide non-essential elements (gifs, buttons etc.)
    hideNonEssentialForGift();

    const overlay = document.getElementById('giftVideoOverlay');
    const vid = document.getElementById('giftVideo');
    if (!overlay || !vid) {
      // fallback: show letter immediately
      const letter = document.getElementById('giftLetter');
      if (letter) { letter.classList.remove('hidden'); letter.setAttribute('aria-hidden','false'); }
      return;
    }

    console.log('Gift click: overlay=', overlay, 'vid=', vid);
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden','false');
    // force visible styles in case CSS or other scripts interfere
    overlay.style.display = 'flex';
    overlay.style.zIndex = '100000';
    overlay.style.visibility = 'visible';
    vid.style.display = 'block';
    vid.style.opacity = '1';
    vid.currentTime = 0;
    try { vid.controls = false; vid.disablePictureInPicture = true; } catch(e){}

    // Try playing unmuted first (user gesture). If that fails or video still not playing,
    // fall back to muted playback which some browsers allow more reliably.
    let played = false;
    try {
      await vid.play();
      played = !vid.paused;
    } catch (err) {
      console.warn('Initial play failed, will try muted fallback', err);
      played = false;
    }
    if (!played) {
      try {
        vid.muted = true;
        await vid.play();
        played = !vid.paused;
        console.log('Muted fallback play succeeded=', played);
      } catch (err) {
        console.error('Muted fallback also failed', err);
      }
    }

    try { if (vid.requestFullscreen) await vid.requestFullscreen(); } catch(e) {}

    vid.addEventListener('ended', async () => {
      try {
        // hide the video overlay and exit fullscreen
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden','true');
        try { if (document.fullscreenElement) await document.exitFullscreen(); } catch(e) {}
        // Hide any other video overlays that might still be visible
        try {
          document.querySelectorAll('.me-video-overlay').forEach(el => { el.classList.add('hidden'); el.style.display = 'none'; });
        } catch(e) {}
        try { const fv = document.getElementById('fullVideoOverlay'); if (fv) { fv.classList.add('hidden'); fv.style.display = 'none'; } } catch(e) {}
        try { const adv = document.getElementById('advanceOverlay'); if (adv) { adv.style.opacity = '0'; adv.style.display = 'none'; adv.style.pointerEvents = 'none'; } } catch(e) {}

        // Hide all 'screen' elements so only the starfield and floating hearts remain
        try { screens.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; }); } catch(e) { console.warn(e); }

        // Ensure the page background and starfield are visible
        try { document.body.style.background = 'black'; } catch(e) {}
        try { const sf = document.getElementById('starfield'); if (sf) { sf.style.display = 'block'; sf.style.zIndex = '1'; } } catch(e) {}

        // Show the letter in the middle of the viewport (keeps a translucent white card)
        try {
          const letter = document.getElementById('giftLetter');
          if (letter) {
            letter.classList.remove('hidden');
            letter.setAttribute('aria-hidden','false');
            letter.style.zIndex = '5000';
          }
        } catch (e) { console.warn('Could not show gift letter', e); }

        // Ensure back and music buttons are visible and on top
        try { const back = document.getElementById('backBtn'); if (back) { back.style.display = ''; back.style.zIndex = '6000'; } } catch(e) {}
        try { const mt = document.getElementById('musicToggle'); if (mt) { mt.style.display = ''; mt.style.zIndex = '6000'; } } catch(e) {}
      } catch (e) { console.error('Gift video end handler error', e); }
    }, { once: true });

  } catch (err) {
    console.error('Failed to play gift video', err);
    // fallback to showing the letter
    try { document.getElementById('giftLetter').classList.remove('hidden'); } catch(e){}
  }
};


function resetFlame() {
  flame.style.display = "block";
  blowing = false;
}

initMic();

// ---------------- Gesture (2-hand heart) + Smile detection ----------------
// Uses MediaPipe Hands + FaceMesh via the added CDN scripts in index.html.
let mpHands = null;
let mpFace = null;
let mpCamera = null;
let lastHands = null;
let lastFace = null;
let gestureActive = false;
let gestureTriggered = false;
let gestureHitCount = 0;

function normDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function isSmile(faceLandmarks) {
  if (!faceLandmarks) return false;
  // mouth corner landmarks (MediaPipe FaceMesh): 61 (left), 291 (right)
  const left = faceLandmarks[61];
  const right = faceLandmarks[291];
  if (!left || !right) return false;
  const mouthWidth = normDist(left, right);
  // estimate face width from landmark bbox
  let minX = 1, maxX = 0;
  for (const lm of faceLandmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
  }
  const faceWidth = Math.max(0.0001, maxX - minX);
  const ratio = mouthWidth / faceWidth;
  // Heuristic: smile makes mouth wider relative to face width
  return ratio > 0.42; // tuned heuristic, adjust if needed
}

function isTwoHandHeart(handsLandmarks, handsInfo) {
  if (!handsLandmarks || handsLandmarks.length < 2) return false;
  // Use handedness to pick left/right
  let leftIdx = -1, rightIdx = -1;
  if (handsInfo && handsInfo.length === handsLandmarks.length) {
    for (let i=0;i<handsInfo.length;i++) {
      const label = handsInfo[i].label || (handsInfo[i].classification && handsInfo[i].classification[0] && handsInfo[i].classification[0].label);
      if (label && label.toLowerCase().includes('left')) leftIdx = i;
      if (label && label.toLowerCase().includes('right')) rightIdx = i;
    }
  }
  // fallback: just pick first two
  if (leftIdx === -1 || rightIdx === -1) {
    leftIdx = 0; rightIdx = 1;
  }
  const left = handsLandmarks[leftIdx];
  const right = handsLandmarks[rightIdx];
  if (!left || !right) return false;
  // index fingertip is landmark 8, thumb tip is 4
  const li = left[8];
  const ri = right[8];
  const lt = left[4];
  const rt = right[4];
  if (!li || !ri || !lt || !rt) return false;
  // distances in normalized coordinates
  const idxDist = normDist(li, ri);
  const thumbDist = normDist(lt, rt);
  // require both fingertips and thumbs be fairly close
  return idxDist < 0.18 && thumbDist < 0.22;
}

function evaluateGestureAndSmile() {
  if (gestureTriggered) return;

  const hands = lastHands;
  const heart = isTwoHandHeart(
    hands ? hands.multiHandLandmarks : null,
    hands ? hands.multiHandedness : null
  );

  if (heart) {
    gestureHitCount++;
  } else {
    gestureHitCount = 0;
  }

  // require sustained heart gesture for stability
  if (gestureHitCount >= 6) {
    gestureTriggered = true;
    try {
      showScreen('cakeScreen');
      extinguishFlame();
    } catch (e) {
      console.error('Gesture trigger error', e);
    }
    stopGestureDetection();
  }
}


function startGestureDetection() {
  if (gestureActive) return;
  gestureActive = true;
  gestureTriggered = false;
  gestureHitCount = 0;

  const video = document.getElementById('gestureVideo');
  if (!video) return;

  // Initialize MediaPipe Hands if available
  try {
    mpHands = mpHands || new Hands({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    mpHands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    mpHands.onResults((results) => {
      // store for evaluation
      lastHands = results;
      evaluateGestureAndSmile();
    });
  } catch (e) { console.warn('MediaPipe Hands not available', e); }

  // Initialize FaceMesh
  try {
    mpFace = mpFace || new FaceMesh({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});
    mpFace.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    mpFace.onResults((results) => {
      lastFace = results.multiFaceLandmarks && results.multiFaceLandmarks[0] ? results.multiFaceLandmarks[0] : null;
      evaluateGestureAndSmile();
    });
  } catch (e) { console.warn('MediaPipe FaceMesh not available', e); }

  // Start the camera util to feed frames
  try {
    mpCamera = new Camera(video, {
      onFrame: async () => {
        try {
          if (mpHands) await mpHands.send({image: video});
          if (mpFace) await mpFace.send({image: video});
        } catch (e) { /* ignore per-frame errors */ }
      },
      width: 640,
      height: 480
    });
    mpCamera.start();
  } catch (e) { console.error('Failed to start Camera for gesture detection', e); }
}

function stopGestureDetection() {
  try {
    if (mpCamera && mpCamera.stop) mpCamera.stop();
  } catch (e) {}
  try { lastHands = null; lastFace = null; } catch(e){}
  gestureActive = false;
}

// Hook detection to showScreen: start when entering cakeScreen, stop when leaving
{
  const originalShow = showScreen;
  window.showScreen = function(id) {
    originalShow(id);
    try {
      if (id === 'cakeScreen') startGestureDetection();
      else stopGestureDetection();
    } catch (e) {}
  };
}

const giftLetterVideo = document.getElementById("giftLetterVideo");

let letterLoops = 0;
const MAX_LOOPS = 10;

giftLetterVideo.addEventListener("ended", () => {
  letterLoops++;

  if (letterLoops < MAX_LOOPS) {
    giftLetterVideo.currentTime = 0;
    giftLetterVideo.play();
  }
});


// --- ME button / Sanji video behavior ---
const meButton = document.getElementById('meButton');
const meOverlay = document.getElementById('meVideoOverlay');
const meVideo = document.getElementById('meVideo');
let introWasPlaying = false;
let bgWasPlaying = false;

if (meButton && meOverlay && meVideo) {
  meButton.addEventListener('click', async () => {
    try {
      // record which music was playing
      introWasPlaying = !!(intro && !intro.paused && !intro.ended);
      bgWasPlaying = !!(music && !music.paused && !music.ended);

      // pause both audio sources so video is the only sound
      try { if (intro && !intro.paused) { intro.pause(); } } catch (e) {}
      try { if (music && !music.paused) { music.pause(); } } catch (e) {}

      // show overlay and play video
      meOverlay.classList.remove('hidden');
      meOverlay.setAttribute('aria-hidden','false');
      meVideo.currentTime = 0;
      await meVideo.play();
    } catch (err) {
      console.error('Failed to play ME video', err);
    }
  });

  // When video ends, hide overlay and resume previously playing audio
  meVideo.addEventListener('ended', async () => {
    meOverlay.classList.add('hidden');
    meOverlay.setAttribute('aria-hidden','true');
    try {
      if (introWasPlaying) {
        await intro.play();
        toggle.textContent = '🔈';
      } else if (bgWasPlaying) {
        await music.play();
        toggle.textContent = '🔈';
      }
    } catch (e) {
      console.error('Failed to resume audio after ME video', e);
      toggle.textContent = '🔊';
    }
  });

  // also allow clicking overlay to stop video early
  meOverlay.addEventListener('click', () => {
    try { meVideo.pause(); } catch (e) {}
    meOverlay.classList.add('hidden');
  });
}

// --- Advance overlay behavior for Cake button ---
const advanceOverlay = document.getElementById('advanceOverlay');
let advanceLevel = 0; // 0..1 proportion of screen filled
let advanceClicks = 0;

document.getElementById('cakeBtn').addEventListener('click', () => {
  // If already filled, do nothing here (navigation handled by guarded handler)
  if (advanceLevel >= 1) return;

  advanceClicks += 1;
  // scale growth accelerates with more clicks
  const scaleIncrement = 0.22 + Math.min(1.2, advanceClicks * 0.12);

  // Ensure a persistent central ADVANCE element exists
  let advanceMain = document.getElementById('advanceMain');
  if (!advanceMain) {
    advanceMain = document.createElement('div');
    advanceMain.id = 'advanceMain';
    advanceMain.className = 'advance-popup';
    advanceMain.textContent = 'ADVANCE';
    // base styles
    advanceMain.style.position = 'fixed';
    advanceMain.style.left = '50%';
    advanceMain.style.top = '50%';
    advanceMain.style.transform = 'translate(-50%, -50%) scale(0.6) rotate(0deg)';
    advanceMain.style.fontSize = '10vw';
    advanceMain.style.color = 'white';
    advanceMain.style.zIndex = '141';
    advanceMain.style.pointerEvents = 'none';
    advanceMain.style.transition = 'transform 0.45s cubic-bezier(.2,.9,.2,1), opacity 0.4s ease';
    document.body.appendChild(advanceMain);
  }

  // compute new scale based on clicks
  const prevScale = advanceMain._scale || 0.6;
  let newScale = prevScale + (scaleIncrement * 0.6);
  // cap scale to a large value
  newScale = Math.min(newScale, 40);
  advanceMain._scale = newScale;

  // rotate randomly influenced by clicks
  const rot = (Math.random() * 80 - 40) + advanceClicks * 8;
  advanceMain.style.transform = `translate(-50%, -50%) scale(${newScale}) rotate(${rot}deg)`;

  // update advanceLevel by measuring coverage: if element's rect exceeds viewport
  const rect = advanceMain.getBoundingClientRect();
  const coversHoriz = rect.width >= window.innerWidth * 1.05;
  const coversVert = rect.height >= window.innerHeight * 1.05;
  if (coversHoriz || coversVert) {
    advanceLevel = 1;
  } else {
    // approximate level by ratio of max dimension
    const ratio = Math.max(rect.width / window.innerWidth, rect.height / window.innerHeight);
    advanceLevel = Math.min(0.999, Math.max(advanceLevel, (ratio - 0.2) / 1.8));
  }

  

  if (advanceOverlay) {
    // ease overlay to new opacity
    advanceOverlay.style.transition = 'opacity 0.45s ease';
    advanceOverlay.style.opacity = advanceLevel;
    advanceOverlay.style.pointerEvents = advanceLevel >= 1 ? 'auto' : 'none';
  }

  // If fully filled, finalize: keep white screen and make ADVANCE white (so it blends)
  if (advanceLevel >= 1) {
    try {
      // make sure overlay is fully white and visible
      if (advanceOverlay) advanceOverlay.style.opacity = '1';
      // set ADVANCE to white and full-screen scale
      advanceMain.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
      advanceMain.style.transform = `translate(-50%, -50%) scale(${Math.max(newScale, 50)}) rotate(${rot + 90}deg)`;
      advanceMain.style.color = 'white';
      // optionally hide interactive elements by setting pointer-events none on root
      document.body.style.pointerEvents = 'none';
      // leave the white screen in place (do not reset)

      // Show and play the fullscreen MP4 when ADVANCE fills the screen
      try {
        const fullOverlay = document.getElementById('fullVideoOverlay');
        const fullVid = document.getElementById('fullVideo');

        // pause any audio for safety
        try { if (intro && !intro.paused) intro.pause(); } catch(e){}
        try { if (music && !music.paused) music.pause(); } catch(e){}

        if (fullOverlay && fullVid) {
          // hide the white advance overlay so the video is visible
          try {
            if (advanceOverlay) {
              advanceOverlay.style.transition = 'opacity 0.25s linear';
              advanceOverlay.style.opacity = '0';
              advanceOverlay.style.display = 'none';
              advanceOverlay.style.pointerEvents = 'none';
            }
          } catch (e) {}

          // ensure body allows interaction with the video
          try { document.body.style.pointerEvents = ''; } catch(e){}

          // elevate the video overlay
          try { fullOverlay.style.zIndex = '9999'; } catch(e){}

          fullOverlay.classList.remove('hidden');
          fullOverlay.setAttribute('aria-hidden','false');
          fullVid.currentTime = 0;

          // ensure no native controls
          try { fullVid.controls = false; fullVid.disablePictureInPicture = true; } catch(e){}

          // play (user just clicked to grow ADVANCE so playback is allowed)
          fullVid.play().then(async () => {
            // try to enter fullscreen for the video element
            try {
              if (fullVid.requestFullscreen) await fullVid.requestFullscreen();
              else if (fullVid.webkitRequestFullscreen) fullVid.webkitRequestFullscreen();
              else if (fullVid.mozRequestFullScreen) fullVid.mozRequestFullScreen();
            } catch (fsErr) { console.warn('Fullscreen request failed:', fsErr); }

            // when video ends, exit fullscreen (if any), hide overlay and go to cake screen
            fullVid.addEventListener('ended', async () => {
              try {
                fullOverlay.classList.add('hidden');
                fullOverlay.setAttribute('aria-hidden','true');
                document.body.style.pointerEvents = '';
                // remove the ADVANCE text element so it does not remain on screen
                try {
                  const advEl = document.getElementById('advanceMain');
                  if (advEl && advEl.parentNode) advEl.parentNode.removeChild(advEl);
                } catch (remErr) { console.warn('Failed to remove advanceMain', remErr); }
                try {
                  if (advanceOverlay) {
                    advanceOverlay.style.display = 'none';
                    advanceOverlay.style.opacity = '0';
                    advanceOverlay.style.pointerEvents = 'none';
                  }
                } catch (e) {}
                try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
                try { showScreen('cakeScreen'); } catch (e) {}
              } catch (e) { console.error('fullVid ended handler error', e); }
            }, { once: true });

          }).catch((err) => {
            console.warn('Could not play full video:', err);
            // fallback: hide overlay and go to cake screen
            try { fullOverlay.classList.add('hidden'); fullOverlay.setAttribute('aria-hidden','true'); } catch(e){}
            document.body.style.pointerEvents = '';
            try { showScreen('cakeScreen'); } catch(e){}
          });
        } else {
          // no full video found — just proceed
          document.body.style.pointerEvents = '';
          try { showScreen('cakeScreen'); } catch (e) {}
        }
      } catch (e) { console.error('Error showing full video', e); }
    } catch (e) { console.error(e); }
  }
});
