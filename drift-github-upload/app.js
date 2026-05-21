const canvas = document.querySelector("#stars");
const ctx = canvas.getContext("2d");
const pressureOrb = document.querySelector("#pressure-orb");
const orbBlobPath = document.querySelector("#orb-blob-path");
const orbBlobHighlight = document.querySelector("#orb-blob-highlight");
const orbContactShadow = document.querySelector("#orb-contact-shadow");
const orbOppositeGlow = document.querySelector("#orb-opposite-glow");
const orbReleaseRipple = document.querySelector("#orb-release-ripple");
const orbMessage = document.querySelector("#orb-message");
const supportChoice = document.querySelector("#support-choice");
const supportButtons = document.querySelectorAll("[data-support]");
const formInput = document.querySelector("#thought");
const driftButton = document.querySelector("#drift-button");
const journalExitButton = document.querySelector("#journal-exit");
const homeButton = document.querySelector("#home-button");
const sitReturnButton = document.querySelector("#sit-return");
const sitNewThoughtButton = document.querySelector("#sit-new-thought");
const groundStars = document.querySelectorAll(".ground-star");
const groundMessage = document.querySelector("#ground-message");
const groundNewThoughtButton = document.querySelector("#ground-new-thought");
const groundExitButton = document.querySelector("#ground-exit");
const savedReturnButton = document.querySelector("#saved-return");
const savedNewThoughtButton = document.querySelector("#saved-new-thought");
const savedCard = document.querySelector("#saved-card");
const entries = document.querySelector("#entries");
const template = document.querySelector("#entry-template");
const releaseLayer = document.querySelector("#release-layer");
const aftercareButtons = document.querySelectorAll("[data-aftercare]");
const aftercareMessage = document.querySelector("#aftercare-message");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const reflectionParts = {
  Heavy: [
    "That sounds like a lot.",
    "No wonder this feels heavy.",
    "You can set this down for now.",
    "This does not need an answer tonight.",
    "It makes sense that this feels loud.",
    "You do not have to fix it here.",
    "This is a hard thing to hold.",
    "Let it be outside your head for a bit.",
  ],
  Practical: [
    "This can wait until you are ready.",
    "One thing at a time is enough.",
    "You do not need the whole plan now.",
    "This can be handled later.",
    "For now, it is just named.",
    "No need to rush the next part.",
    "A small return can be enough.",
    "Let it sit here for a while.",
  ],
  Unclear: [
    "It is okay if this is messy.",
    "You do not need clear words yet.",
    "This can stay unfinished.",
    "Hard to explain still counts.",
    "Let it be unclear for now.",
    "You can stop sorting it tonight.",
    "This may take time.",
    "No clean answer needed.",
  ],
  "Can Wait": [
    "This can wait.",
    "You can come back later.",
    "Not now is a fair answer.",
    "This does not need you tonight.",
    "You can leave it here.",
    "Later is allowed.",
    "This can be parked for now.",
    "Enough for tonight.",
  ],
  "Needs Care": [
    "This feels important.",
    "Be easy with yourself here.",
    "No need to push through this.",
    "Go slowly with this one.",
    "This deserves a softer pace.",
    "You can be careful here.",
    "Give this a little time.",
    "Stay kind to yourself.",
  ],
};

const labelText = {
  Heavy: "Feels heavy",
  Practical: "For later",
  Unclear: "Not clear yet",
  "Can Wait": "Can wait",
  "Needs Care": "Be gentle",
};

const savedEntries = [];
const usedReflections = new Set();
const connectionMessages = [
  "You are not alone in this.",
  "It can be heavy and still pass.",
  "You are allowed to need someone.",
  "This does not make you too much.",
  "You can text someone safe.",
];
let stars = [];
let warmParticles = [];
let residueParticles = [];
let pressureParticles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
let releaseStartedAt = 0;
let releaseDuration = 2800;
let releaseFocus = { x: 0, y: 0 };
let isReleasing = false;
let isSitting = false;
let currentEntry = null;
let ambientMood = "neutral";
let aftercareMode = "none";
let movementTouch = { active: false, x: 0, y: 0, lastSeen: 0 };
let isHoldingPressure = false;
let isReboundingPressure = false;
let pressureStartedAt = 0;
let pressureDepth = 0;
let holdBreath = 0;
let orbTouch = { x: 0, y: 0, targetX: 0, targetY: 0, wobbleX: 0, wobbleY: 0, screenX: 0, screenY: 0 };
let exhaleStartedAt = 0;
let hapticInterval = null;
let hapticTimeout = null;
let supportChoiceTimer = null;
let orbMessageTimer = null;
let touchedGroundStars = 0;

function buildOrbCirclePath(radius = 38) {
  return [
    `M 50 ${(50 - radius).toFixed(2)}`,
    `A ${radius} ${radius} 0 1 1 50 ${(50 + radius).toFixed(2)}`,
    `A ${radius} ${radius} 0 1 1 50 ${(50 - radius).toFixed(2)}`,
    "Z",
  ].join(" ");
}

function updateOrbBlob(releaseRipple = 0) {
  if (!orbBlobPath || !orbBlobHighlight) {
    return;
  }

  const touchX = orbTouch.x + orbTouch.wobbleX;
  const touchY = orbTouch.y + orbTouch.wobbleY;
  const fogShiftX = touchX * pressureDepth * 2.2;
  const fogShiftY = touchY * pressureDepth * 2.2;
  const fillCx = 39 + fogShiftX;
  const fillCy = 31 + fogShiftY;
  const surfaceCx = 35 - fogShiftX * 0.65;
  const surfaceCy = 25 - fogShiftY * 0.65;

  orbBlobPath.setAttribute("d", buildOrbCirclePath(38));
  orbBlobHighlight.setAttribute("d", buildOrbCirclePath(27));

  const fillGradient = document.querySelector("#orb-fill");
  const surfaceGradient = document.querySelector("#orb-surface");

  if (fillGradient) {
    fillGradient.setAttribute("cx", `${fillCx.toFixed(1)}%`);
    fillGradient.setAttribute("cy", `${fillCy.toFixed(1)}%`);
  }

  if (surfaceGradient) {
    surfaceGradient.setAttribute("cx", `${surfaceCx.toFixed(1)}%`);
    surfaceGradient.setAttribute("cy", `${surfaceCy.toFixed(1)}%`);
  }

  if (orbContactShadow) {
    orbContactShadow.style.opacity = "0";
  }

  if (orbOppositeGlow) {
    orbOppositeGlow.style.opacity = "0";
  }

  if (orbReleaseRipple) {
    orbReleaseRipple.setAttribute("r", (16 + releaseRipple * 35).toFixed(2));
    orbReleaseRipple.style.opacity = (releaseRipple * 0.18).toFixed(3);
  }
}

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const starCount = Math.round(Math.min(130, Math.max(58, width * height * 0.00012)));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.45 + 0.45,
    alpha: Math.random() * 0.5 + 0.22,
    drift: Math.random() * 0.18 + 0.025,
    pulse: Math.random() * Math.PI * 2,
    glint: Math.random() > 0.82,
    halo: Math.random() > 0.68,
  }));

  const warmCount = Math.round(Math.min(24, Math.max(10, width * height * 0.000022)));
  warmParticles = Array.from({ length: warmCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.4 + 1.2,
    alpha: Math.random() * 0.08 + 0.035,
    drift: Math.random() * 0.08 + 0.025,
    pulse: Math.random() * Math.PI * 2,
  }));

  const pressureParticleCount = Math.round(Math.min(124, Math.max(64, width * height * 0.00011)));
  pressureParticles = Array.from({ length: pressureParticleCount }, () => createPressureParticle());
}

function createPressureParticle() {
  const edge = Math.floor(Math.random() * 4);
  let x = Math.random() * width;
  let y = Math.random() * height;

  if (edge === 0) {
    y = -24;
  } else if (edge === 1) {
    x = width + 24;
  } else if (edge === 2) {
    y = height + 24;
  } else {
    x = -24;
  }

  return {
    x,
    y,
    radius: Math.random() * 1.8 + 0.45,
    alpha: Math.random() * 0.38 + 0.16,
    speed: Math.random() * 0.88 + 0.42,
    wobble: Math.random() * Math.PI * 2,
    orbit: Math.random() * 42 + 28,
    clusterAngle: Math.random() * Math.PI * 2,
    clusterRadius: Math.random() * 34 + 8,
  };
}

function drawStars(time = 0) {
  ctx.clearRect(0, 0, width, height);
  const releaseAge = releaseStartedAt ? time - releaseStartedAt : releaseDuration;
  const releaseProgress = Math.min(Math.max(releaseAge / releaseDuration, 0), 1);
  const releaseIntensity =
    releaseAge < releaseDuration ? Math.sin(releaseProgress * Math.PI) : 0;
  const exhaleDuration = 5000;
  const exhaleAge = exhaleStartedAt ? time - exhaleStartedAt : exhaleDuration;
  const exhaleProgress = Math.min(Math.max(exhaleAge / exhaleDuration, 0), 1);
  const exhaleIntensity =
    exhaleAge < exhaleDuration ? Math.sin(exhaleProgress * Math.PI) : 0;
  const exhaleBloomProgress = Math.min(Math.max(exhaleAge / 1900, 0), 1);
  const exhaleBloom =
    exhaleAge < 1900 ? Math.sin(exhaleBloomProgress * Math.PI) : 0;
  const heldFor = isHoldingPressure ? time - pressureStartedAt : 0;
  const pressureTarget = isHoldingPressure
    ? 1 - Math.exp(-heldFor / 1900)
    : 0;
  pressureDepth = isHoldingPressure
    ? pressureDepth * 0.82 + Math.min(pressureTarget, 1) * 0.18
    : Math.max(pressureDepth * (isReboundingPressure ? 0.94 : 0.91), 0);
  holdBreath = isHoldingPressure
    ? Math.sin(time * 0.0027) * pressureDepth
    : holdBreath * 0.9;
  const touchEase = isHoldingPressure ? 0.12 : isReboundingPressure ? 0.16 : 0.08;
  orbTouch.x += (orbTouch.targetX - orbTouch.x) * touchEase;
  orbTouch.y += (orbTouch.targetY - orbTouch.y) * touchEase;
  orbTouch.wobbleX *= isReboundingPressure ? 0.78 : 0.88;
  orbTouch.wobbleY *= isReboundingPressure ? 0.78 : 0.88;
  document.documentElement.style.setProperty("--pressure-depth", pressureDepth.toFixed(3));
  document.documentElement.style.setProperty("--hold-breath", holdBreath.toFixed(3));
  document.documentElement.style.setProperty("--orb-touch-x", (orbTouch.x + orbTouch.wobbleX).toFixed(3));
  document.documentElement.style.setProperty("--orb-touch-y", (orbTouch.y + orbTouch.wobbleY).toFixed(3));
  document.documentElement.style.setProperty("--orb-press-x", ((orbTouch.x + orbTouch.wobbleX) * pressureDepth).toFixed(3));
  document.documentElement.style.setProperty("--orb-press-y", ((orbTouch.y + orbTouch.wobbleY) * pressureDepth).toFixed(3));
  document.documentElement.style.setProperty("--orb-abs-x", Math.abs((orbTouch.x + orbTouch.wobbleX) * pressureDepth).toFixed(3));
  document.documentElement.style.setProperty("--orb-abs-y", Math.abs((orbTouch.y + orbTouch.wobbleY) * pressureDepth).toFixed(3));
  updateOrbBlob(exhaleBloom);
  const pressureIntensity = pressureDepth;
  const sitIntensity = isSitting ? 1 : 0;
  const aftercareDriftScale =
    aftercareMode === "quiet" ? 0.52 : aftercareMode === "movement" ? 1.12 : 1;
  const moodDriftScale =
    ambientMood === "heavy" ? 0.72 : ambientMood === "practical" ? 1.22 : 1;
  const driftScale = (isSitting ? 0.24 : 1) * moodDriftScale * aftercareDriftScale;
  const careIntensity = ambientMood === "care" && aftercareMode !== "quiet" ? 1 : 0;
  const practicalMovement = ambientMood === "practical" ? 0.03 : 0;
  const aftercareMovement = aftercareMode === "movement" ? 0.025 : 0;
  const movementTouchActive =
    aftercareMode === "movement" && movementTouch.active && time - movementTouch.lastSeen < 1400;
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const touchGatherStrength =
    isHoldingPressure && orbTouch.screenX && orbTouch.screenY
      ? Math.min(1, pressureIntensity * 1.15 + 0.08)
      : 0;
  const gatherX = centerX + ((orbTouch.screenX || centerX) - centerX) * touchGatherStrength;
  const gatherY = centerY + ((orbTouch.screenY || centerY) - centerY) * touchGatherStrength;

  const haze = ctx.createRadialGradient(width * 0.72, height * 0.2, 0, width * 0.72, height * 0.2, width * 0.72);
  haze.addColorStop(0, `rgba(174, 184, 214, ${0.12 + releaseIntensity * 0.12 + sitIntensity * 0.08 + careIntensity * 0.03 + pressureIntensity * 0.08 + exhaleIntensity * 0.12 + exhaleBloom * 0.12})`);
  haze.addColorStop(0.5, `rgba(88, 135, 152, ${0.045 + releaseIntensity * 0.08 + sitIntensity * 0.04 + pressureIntensity * 0.04 + exhaleIntensity * 0.08 + exhaleBloom * 0.07})`);
  haze.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  if (exhaleBloom) {
    const waveRadius = Math.min(width, height) * (0.18 + exhaleBloomProgress * 0.95);
    const wave = ctx.createRadialGradient(centerX, centerY, waveRadius * 0.48, centerX, centerY, waveRadius);
    wave.addColorStop(0, "rgba(220, 228, 241, 0)");
    wave.addColorStop(0.72, `rgba(220, 228, 241, ${0.035 * exhaleBloom})`);
    wave.addColorStop(1, "rgba(220, 228, 241, 0)");
    ctx.fillStyle = wave;
    ctx.fillRect(0, 0, width, height);
  }

  if (pressureIntensity > 0.02 || exhaleBloom > 0.02) {
    pressureParticles.forEach((particle, index) => {
      const clusterDrift = particle.clusterAngle + Math.sin(time * 0.00018 + particle.wobble) * 0.45;
      const clusterRadius = particle.clusterRadius * (0.25 + pressureIntensity * 0.75);
      const targetX = gatherX + Math.cos(clusterDrift) * clusterRadius;
      const targetY = gatherY + Math.sin(clusterDrift) * clusterRadius;
      const dx = targetX - particle.x;
      const dy = targetY - particle.y;
      const gatherDx = gatherX - particle.x;
      const gatherDy = gatherY - particle.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const distanceFromGather = Math.max(Math.hypot(gatherDx, gatherDy), 1);
      const nearCenter = Math.max(0, 1 - distanceFromGather / Math.max(width, height) * 1.7);
      const pull = pressureIntensity * particle.speed * (1.25 + nearCenter * 1.75);
      const swirl = Math.sin(time * 0.001 + particle.wobble) * pressureIntensity * (0.42 + nearCenter * 0.42);
      const tangentX = -dy / distance;
      const tangentY = dx / distance;
      const captured = distanceFromGather < particle.orbit * (1.25 + pressureIntensity * 0.75);

      particle.x += (dx / distance) * pull * (captured ? 0.22 : 1) + tangentX * swirl;
      particle.y += (dy / distance) * pull * (captured ? 0.22 : 1) + tangentY * swirl;

      if (exhaleBloom > 0.02) {
        particle.x -= (gatherDx / distanceFromGather) * exhaleBloom * particle.speed * 6.4;
        particle.y -= (gatherDy / distanceFromGather) * exhaleBloom * particle.speed * 5.3;
      }

      const tooClose = distanceFromGather < 9;
      const outOfView = particle.x < -80 || particle.x > width + 80 || particle.y < -80 || particle.y > height + 80;

      if ((isHoldingPressure && tooClose && Math.random() < 0.006) || outOfView) {
        pressureParticles[index] = createPressureParticle();
        return;
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(232, 235, 246, ${particle.alpha * pressureIntensity * (captured ? 0.72 : 1) + exhaleBloom * 0.12})`;
      ctx.arc(particle.x, particle.y, particle.radius * (1 + pressureIntensity * 0.7 + nearCenter * 0.42 + exhaleBloom * 0.9), 0, Math.PI * 2);
      ctx.fill();
    });

    const gatherGlow = ctx.createRadialGradient(gatherX, gatherY, 0, gatherX, gatherY, Math.min(width, height) * 0.28);
    gatherGlow.addColorStop(0, `rgba(224, 231, 242, ${pressureIntensity * 0.14 + exhaleBloom * 0.07})`);
    gatherGlow.addColorStop(0.45, `rgba(135, 160, 196, ${pressureIntensity * 0.07})`);
    gatherGlow.addColorStop(1, "rgba(135, 160, 196, 0)");
    ctx.fillStyle = gatherGlow;
    ctx.fillRect(0, 0, width, height);
  }

  stars.forEach((star) => {
    const focusX = releaseFocus.x || width * 0.5;
    const focusY = releaseFocus.y || height * 0.5;
    const distance = Math.hypot(star.x - focusX, star.y - focusY);
    const nearRelease = Math.max(0, 1 - distance / Math.max(width, height) * 1.6);
    const releaseLift = releaseIntensity * nearRelease;
    const pressureDistance = Math.hypot(star.x - gatherX, star.y - gatherY);
    const pressureNear = Math.max(0, 1 - pressureDistance / Math.max(width, height) * 1.45);
    const touchDistance = movementTouchActive
      ? Math.hypot(star.x - movementTouch.x, star.y - movementTouch.y)
      : Infinity;
    const touchNear = movementTouchActive ? Math.max(0, 1 - touchDistance / 220) : 0;

    star.y -= star.drift * driftScale * (1 + releaseLift * 7);
    star.x +=
      Math.sin(time * 0.00008 + star.pulse) * (0.018 + practicalMovement + aftercareMovement + releaseIntensity * 0.08 + sitIntensity * 0.012 + exhaleBloom * 0.035) +
      ((star.x - focusX) / Math.max(width, 1)) * releaseLift * 0.9 +
      ((star.x - centerX) / Math.max(width, 1)) * (exhaleIntensity * 3.45 + exhaleBloom * 3.1) * pressureNear +
      ((star.x - movementTouch.x) / Math.max(width, 1)) * touchNear * 0.7;
    star.y +=
      ((star.y - centerY) / Math.max(height, 1)) * (exhaleIntensity * 2.85 + exhaleBloom * 2.5) * pressureNear +
      ((star.y - movementTouch.y) / Math.max(height, 1)) * touchNear * 0.55;

    if (star.y < -4) {
      star.y = height + 4;
      star.x = Math.random() * width;
    }

    const quietAlpha = aftercareMode === "quiet" ? -0.06 : 0;
    const twinkle = Math.sin(time * 0.0007 + star.pulse) * 0.12;
    const starAlpha = Math.max(0.06, star.alpha + quietAlpha + twinkle + releaseLift * 0.35 + touchNear * 0.08 + exhaleBloom * pressureNear * 0.18);
    const starSize = star.radius * (1 + releaseLift * 0.85 + exhaleBloom * pressureNear * 0.65);

    if (star.halo) {
      const halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, starSize * 5.8);
      halo.addColorStop(0, `rgba(220, 228, 245, ${starAlpha * 0.16})`);
      halo.addColorStop(0.58, `rgba(174, 197, 218, ${starAlpha * 0.045})`);
      halo.addColorStop(1, "rgba(174, 197, 218, 0)");
      ctx.beginPath();
      ctx.fillStyle = halo;
      ctx.arc(star.x, star.y, starSize * 5.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(238, 238, 248, ${starAlpha})`;
    ctx.arc(star.x, star.y, starSize, 0, Math.PI * 2);
    ctx.fill();

    if (star.glint && starAlpha > 0.22) {
      const glintLength = starSize * 3.2;
      ctx.save();
      ctx.globalAlpha = Math.min(0.32, starAlpha * 0.45);
      ctx.strokeStyle = "rgba(238, 242, 250, 0.8)";
      ctx.lineWidth = Math.max(0.35, starSize * 0.24);
      ctx.beginPath();
      ctx.moveTo(star.x - glintLength, star.y);
      ctx.lineTo(star.x + glintLength, star.y);
      ctx.moveTo(star.x, star.y - glintLength * 0.72);
      ctx.lineTo(star.x, star.y + glintLength * 0.72);
      ctx.stroke();
      ctx.restore();
    }
  });

  if (careIntensity) {
    warmParticles.forEach((particle) => {
      particle.y -= particle.drift * (isSitting ? 0.4 : 1);
      particle.x += Math.sin(time * 0.00016 + particle.pulse) * 0.045;

      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }

      const pulse = Math.sin(time * 0.00055 + particle.pulse) * 0.025;
      ctx.beginPath();
      ctx.fillStyle = `rgba(226, 170, 154, ${particle.alpha + pulse})`;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (pressureIntensity || exhaleIntensity) {
    warmParticles.forEach((particle) => {
      const dx = centerX - particle.x;
      const dy = centerY - particle.y;
      particle.x += dx * (0.0035 + pressureIntensity * 0.0025) * pressureIntensity;
      particle.y += dy * (0.0035 + pressureIntensity * 0.0025) * pressureIntensity;
      particle.x -= dx * (0.0065 * exhaleIntensity + 0.012 * exhaleBloom);
      particle.y -= dy * (0.0065 * exhaleIntensity + 0.012 * exhaleBloom);

      const pulse = Math.sin(time * 0.0005 + particle.pulse) * 0.02;
      ctx.beginPath();
      ctx.fillStyle = `rgba(216, 225, 238, ${0.045 + pulse + pressureIntensity * 0.035 + exhaleIntensity * 0.04 + exhaleBloom * 0.08})`;
      ctx.arc(particle.x, particle.y, particle.radius * (0.75 + pressureIntensity * 0.25 + exhaleBloom * 0.75), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (residueParticles.length) {
    residueParticles = residueParticles.filter((particle) => {
      const age = time - particle.createdAt;
      const progress = Math.min(age / particle.life, 1);

      if (progress >= 1) {
        return false;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.994;
      particle.vy *= 0.995;

      const opacity = particle.alpha * (1 - progress) * (0.8 + Math.sin(time * 0.0007 + particle.pulse) * 0.2);
      ctx.beginPath();
      ctx.fillStyle = `rgba(214, 224, 238, ${Math.max(0, opacity)})`;
      ctx.arc(particle.x, particle.y, particle.radius * (1 + progress * 0.75), 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }

  requestAnimationFrame(drawStars);
}

function categorizeThought(text) {
  const lower = text.toLowerCase();
  const has = (words) => words.some((word) => lower.includes(word));

  if (has(["grief", "loss", "afraid", "scared", "panic", "alone", "hurt", "hopeless", "exhausted"])) {
    return "Needs Care";
  }

  if (has(["deadline", "email", "call", "pay", "appointment", "rent", "work", "meeting", "finish", "plan"])) {
    return "Practical";
  }

  if (has(["someday", "later", "eventually", "not now", "maybe tomorrow", "can wait"])) {
    return "Can Wait";
  }

  if (text.length > 170 || has(["too much", "everything", "overwhelmed", "heavy", "burned out", "burnt out"])) {
    return "Heavy";
  }

  return "Unclear";
}

function pickReflection(label, text) {
  const options = reflectionParts[label];
  const seed = [...text].reduce((sum, char) => sum + char.charCodeAt(0), label.length);
  let reflection = "";

  for (let offset = 0; offset < options.length; offset += 1) {
    const index = (seed + offset + savedEntries.length) % options.length;
    reflection = options[index];

    if (!usedReflections.has(reflection)) {
      break;
    }
  }

  usedReflections.add(reflection);
  return reflection;
}

function createEntry(text) {
  const label = categorizeThought(text);
  const entry = {
    id: crypto.randomUUID(),
    text,
    label,
    reflection: pickReflection(label, text),
    createdAt: new Date(),
    saved: false,
    released: false,
  };

  savedEntries.unshift(entry);
  currentEntry = entry;
  setAftercareMode("none");
  setAmbientMood(entry.label);
  document.body.classList.add("has-interacted");
  renderEntry(entry);
  document.body.classList.add("reflection-mode");
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function setAftercareMode(mode) {
  aftercareMode = mode;
  document.body.classList.remove("aftercare-quiet", "aftercare-movement", "aftercare-connection");

  if (mode !== "none") {
    document.body.classList.add(`aftercare-${mode}`);
  }

  aftercareButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.aftercare === mode);
  });

  if (mode === "quiet") {
    if (aftercareMessage) {
      aftercareMessage.textContent = "Let it get quiet.";
    }
    movementTouch.active = false;
    return;
  }

  if (mode === "movement") {
    if (aftercareMessage) {
      aftercareMessage.textContent = "Move a little.";
    }
    return;
  }

  if (mode === "connection") {
    const index = savedEntries.length % connectionMessages.length;
    if (aftercareMessage) {
      aftercareMessage.textContent = connectionMessages[index];
    }
    movementTouch.active = false;
    return;
  }

  if (aftercareMessage) {
    aftercareMessage.textContent = "";
  }
  movementTouch.active = false;
}

function setAmbientMood(label) {
  document.body.classList.remove("mood-heavy", "mood-care", "mood-practical");

  if (label === "Heavy") {
    ambientMood = "heavy";
    document.body.classList.add("mood-heavy");
    return;
  }

  if (label === "Needs Care") {
    ambientMood = "care";
    document.body.classList.add("mood-care");
    return;
  }

  if (label === "Practical") {
    ambientMood = "practical";
    document.body.classList.add("mood-practical");
    return;
  }

  ambientMood = "neutral";
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function releaseThought(text) {
  isReleasing = true;
  driftButton.disabled = true;
  driftButton.textContent = "Letting it drift";
  document.body.classList.add("is-releasing");

  const inputRect = formInput.getBoundingClientRect();
  releaseFocus = {
    x: inputRect.left + inputRect.width / 2,
    y: inputRect.top + inputRect.height / 2,
  };
  releaseStartedAt = performance.now();

  const driftingThought = document.createElement("p");
  driftingThought.className = "drifting-thought";
  driftingThought.textContent = text;
  releaseLayer.append(driftingThought);

  await wait(reduceMotion.matches ? 450 : releaseDuration);

  driftingThought.remove();
  document.body.classList.remove("is-releasing");
  releaseStartedAt = 0;
  isReleasing = false;
  driftButton.disabled = false;
  driftButton.textContent = "Let it drift";
}

function renderEntry(entry) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".thought-card");
  const label = fragment.querySelector(".label");
  const time = fragment.querySelector("time");
  const thoughtText = fragment.querySelector(".thought-text");
  const reflection = fragment.querySelector(".reflection");
  const actionButtons = fragment.querySelectorAll(".actions button");

  card.dataset.id = entry.id;
  label.textContent = labelText[entry.label] || entry.label;
  thoughtText.textContent = entry.text;
  reflection.textContent = entry.reflection;
  time.textContent = entry.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => handleSoftAction(button.textContent, entry, card, button));
  });

  entries.replaceChildren();
  entries.prepend(fragment);
}

function handleSoftAction(action, entry, card, button) {
  if (action === "Pause") {
    enterSitMode();
    return;
  }

  if (action === "Leave it here") {
    leaveAmongStars(entry, card, button);
    return;
  }

  if (action === "Let it drift") {
    releaseEntry(entry, card, button);
    return;
  }

  if (action === "Keep it") {
    saveEntry(entry, card, button);
    return;
  }

  if (action === "One small thing") {
    card.querySelector(".reflection").textContent =
      "Choose the easiest next thing.";
    return;
  }

  card.querySelector(".reflection").textContent =
    "Take a breath. No rush.";
}

function appendStatusMessage(card, text) {
  const existingMessage = card.querySelector(".status-message");

  if (existingMessage) {
    existingMessage.textContent = text;
    return existingMessage;
  }

  const message = document.createElement("p");
  message.className = "status-message";
  message.textContent = text;
  card.append(message);
  return message;
}

function saveEntry(entry, card, button) {
  entry.saved = true;
  card.classList.add("saved");
  button.textContent = "Kept";
  appendStatusMessage(card, "Kept here for later.");
  showSavedView(entry);
}

function releaseEntry(entry, card, button) {
  if (entry.released) {
    return;
  }

  entry.released = true;
  card.classList.add("released");
  button.textContent = "Drifting";
  button.disabled = true;
  appendStatusMessage(card, "Done for now.");
}

function showSavedView(entry) {
  currentEntry = entry;
  savedCard.textContent = entry.text;
  document.body.classList.remove("reflection-mode", "sit-mode");
  document.body.classList.add("saved-mode");
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function leaveAmongStars(entry, card, button) {
  if (entry.leftAmongStars) {
    return;
  }

  entry.leftAmongStars = true;
  button.textContent = "Left here";
  card.classList.add("left-among-stars");

  const cardRect = card.getBoundingClientRect();
  const driftingCopy = document.createElement("p");
  driftingCopy.className = "star-left-thought";
  driftingCopy.textContent = entry.text;
  driftingCopy.style.left = `${cardRect.left + cardRect.width / 2}px`;
  driftingCopy.style.top = `${cardRect.top + cardRect.height * 0.42}px`;
  releaseLayer.append(driftingCopy);

  const existingMessage = card.querySelector(".star-message");

  if (!existingMessage) {
    const message = document.createElement("p");
    message.className = "star-message";
    message.textContent = "You do not have to keep holding this.";
    card.append(message);
  }

  window.setTimeout(() => driftingCopy.remove(), 2700);
}

function enterSitMode() {
  isSitting = true;
  document.body.classList.remove("reflection-mode");
  document.body.classList.add("sit-mode");
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function returnToReflection() {
  isSitting = false;
  document.body.classList.remove("sit-mode", "saved-mode");
  document.body.classList.add("reflection-mode");
}

function resetToJournal() {
  isSitting = false;
  currentEntry = null;
  savedCard.textContent = "";
  formInput.value = "";
  formInput.style.height = "";
  setAftercareMode("none");
  document.body.classList.remove("reflection-mode", "sit-mode", "saved-mode", "words-mode", "ground-mode");
  groundMessage.textContent = "";
  groundNewThoughtButton.classList.remove("is-visible");
  groundStars.forEach((star) => star.classList.remove("touched"));
  entries.replaceChildren();
  resetPressureGateway();
}

function startPressureHold(event) {
  event.preventDefault();

  if (isHoldingPressure) {
    return;
  }

  updateOrbTouch(event, true);
  clearTimeout(supportChoiceTimer);
  supportChoice.classList.remove("is-visible");
  orbMessage.textContent = "";
  isHoldingPressure = true;
  isReboundingPressure = false;
  pressureStartedAt = performance.now();
  pressureDepth = 0;
  exhaleStartedAt = 0;
  document.body.classList.remove("pressure-released", "pressure-rebounding", "support-ready");
  document.body.classList.add("pressure-holding");
  pressureOrb.setPointerCapture?.(event.pointerId);
  startHaptics();
}

function updateOrbTouch(event, immediate = false) {
  const rect = pressureOrb.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const nextX = Math.max(-1, Math.min(1, (event.clientX - centerX) / (rect.width / 2)));
  const nextY = Math.max(-1, Math.min(1, (event.clientY - centerY) / (rect.height / 2)));
  const distance = Math.hypot(nextX, nextY);
  const limit = distance > 1 ? 1 / distance : 1;
  const limitedX = nextX * limit;
  const limitedY = nextY * limit;

  orbTouch.wobbleX += (limitedX - orbTouch.targetX) * 0.035;
  orbTouch.wobbleY += (limitedY - orbTouch.targetY) * 0.035;
  orbTouch.targetX = limitedX;
  orbTouch.targetY = limitedY;
  orbTouch.screenX = centerX + limitedX * rect.width * 0.46;
  orbTouch.screenY = centerY + limitedY * rect.height * 0.46;

  if (immediate) {
    orbTouch.x = limitedX * 0.55;
    orbTouch.y = limitedY * 0.55;
    orbTouch.wobbleX = 0;
    orbTouch.wobbleY = 0;
  }
}

function movePressureHold(event) {
  if (!isHoldingPressure) {
    return;
  }

  updateOrbTouch(event);
}

function endPressureHold(event) {
  if (!isHoldingPressure) {
    return;
  }

  isHoldingPressure = false;
  isReboundingPressure = true;
  const releaseTouchX = orbTouch.x;
  const releaseTouchY = orbTouch.y;
  orbTouch.targetX = releaseTouchX;
  orbTouch.targetY = releaseTouchY;
  orbTouch.wobbleX += releaseTouchX * 0.012;
  orbTouch.wobbleY += releaseTouchY * 0.012;
  pressureDepth = Math.max(pressureDepth, 0.42);
  stopHaptics();
  document.body.classList.remove("pressure-holding");
  document.body.classList.add("pressure-rebounding");
  pressureOrb.releasePointerCapture?.(event.pointerId);
  orbMessage.textContent = "";

  clearTimeout(orbMessageTimer);
  clearTimeout(supportChoiceTimer);

  window.setTimeout(() => {
    orbTouch.targetX = 0;
    orbTouch.targetY = 0;
    orbTouch.screenX = 0;
    orbTouch.screenY = 0;
    orbTouch.wobbleX -= releaseTouchX * 0.18;
    orbTouch.wobbleY -= releaseTouchY * 0.18;
  }, reduceMotion.matches ? 40 : 120);

  window.setTimeout(() => {
    isReboundingPressure = false;
    navigator.vibrate?.([18, 70, 10]);
    exhaleStartedAt = performance.now();
    createResidueParticles(exhaleStartedAt);
    document.body.classList.remove("pressure-rebounding");
    document.body.classList.add("pressure-released");
  }, reduceMotion.matches ? 80 : 560);

  orbMessageTimer = window.setTimeout(() => {
    orbMessage.textContent = "A little more room now.";
  }, reduceMotion.matches ? 450 : 1650);
  supportChoiceTimer = window.setTimeout(() => {
    document.body.classList.add("support-ready");
    supportChoice.classList.add("is-visible");
  }, reduceMotion.matches ? 900 : 2050);
}

function createResidueParticles(createdAt) {
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const residueCount = 58;
  const bloomCount = 34;

  residueParticles.push(
    ...Array.from({ length: residueCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.min(width, height) * 0.16;
      const slowDrift = Math.random() * 0.08 + 0.015;

      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: Math.cos(angle) * slowDrift + (Math.random() - 0.5) * 0.025,
        vy: Math.sin(angle) * slowDrift * 0.55 - Math.random() * 0.025,
        radius: Math.random() * 2.1 + 0.7,
        alpha: Math.random() * 0.05 + 0.03,
        life: Math.random() * 7000 + 16000,
        pulse: Math.random() * Math.PI * 2,
        createdAt,
      };
    }),
    ...Array.from({ length: bloomCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.min(width, height) * 0.08;
      const outward = Math.random() * 0.42 + 0.18;

      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: Math.cos(angle) * outward,
        vy: Math.sin(angle) * outward * 0.75,
        radius: Math.random() * 2.6 + 1.2,
        alpha: Math.random() * 0.075 + 0.05,
        life: Math.random() * 1800 + 2300,
        pulse: Math.random() * Math.PI * 2,
        createdAt,
      };
    }),
  );
}

function startHaptics() {
  if (!navigator.vibrate) {
    return;
  }

  const pulse = () => {
    if (!isHoldingPressure) {
      return;
    }

    const heldFor = performance.now() - pressureStartedAt;
    const depth = Math.min(1 - Math.exp(-heldFor / 2100), 1);
    const pulseLength = Math.round(16 + depth * 24);
    const quietLength = Math.round(240 + depth * 520);

    navigator.vibrate([pulseLength, quietLength, Math.round(pulseLength * 0.65)]);
    hapticTimeout = window.setTimeout(pulse, quietLength + 180);
  };

  pulse();
}

function stopHaptics() {
  if (hapticInterval) {
    window.clearInterval(hapticInterval);
    hapticInterval = null;
  }

  if (hapticTimeout) {
    window.clearTimeout(hapticTimeout);
    hapticTimeout = null;
  }

  navigator.vibrate?.(0);
}

function revealWords() {
  setAftercareMode("none");
  stopHaptics();
  isHoldingPressure = false;
  isReboundingPressure = false;
  pressureDepth = 0;
  document.body.classList.remove("pressure-holding", "pressure-released", "pressure-rebounding", "support-ready");
  document.body.classList.add("words-mode", "has-interacted");
  clearTimeout(orbMessageTimer);
  supportChoice.classList.remove("is-visible");
  orbMessage.textContent = "";
  formInput.focus();
}

function openQuietSupport() {
  isSitting = true;
  setAftercareMode("quiet");
  stopHaptics();
  document.body.classList.remove("pressure-holding", "pressure-released", "words-mode", "reflection-mode", "saved-mode", "ground-mode");
  document.body.classList.add("sit-mode", "has-interacted");
  supportChoice.classList.remove("is-visible");
  orbMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function openGroundMode() {
  setAftercareMode("none");
  stopHaptics();
  isHoldingPressure = false;
  pressureDepth = 0;
  touchedGroundStars = 0;
  groundMessage.textContent = "";
  groundNewThoughtButton.classList.remove("is-visible");
  groundStars.forEach((star) => star.classList.remove("touched"));
  document.body.classList.remove("pressure-holding", "pressure-released", "words-mode", "reflection-mode", "sit-mode", "saved-mode");
  document.body.classList.add("ground-mode", "has-interacted");
  supportChoice.classList.remove("is-visible");
  orbMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function handleSupportChoice(choice) {
  if (choice === "quiet") {
    openQuietSupport();
    return;
  }

  if (choice === "ground") {
    openGroundMode();
    return;
  }

  revealWords();
}

function resetPressureGateway() {
  stopHaptics();
  isHoldingPressure = false;
  pressureDepth = 0;
  orbTouch = { x: 0, y: 0, targetX: 0, targetY: 0, wobbleX: 0, wobbleY: 0, screenX: 0, screenY: 0 };
  exhaleStartedAt = 0;
  residueParticles = [];
  pressureParticles = pressureParticles.map(() => createPressureParticle());
  clearTimeout(orbMessageTimer);
  clearTimeout(supportChoiceTimer);
  supportChoice.classList.remove("is-visible");
  orbMessage.textContent = "";
  document.body.classList.remove("pressure-holding", "pressure-released", "pressure-rebounding", "support-ready");
}

function touchGroundStar(star) {
  if (star.classList.contains("touched")) {
    return;
  }

  star.classList.add("touched");
  touchedGroundStars += 1;
  navigator.vibrate?.(12);

  if (touchedGroundStars >= 5) {
    groundMessage.textContent = "You're here. Just this moment.";
    groundNewThoughtButton.classList.add("is-visible");
  }
}

async function submitThought() {
  if (isReleasing) {
    return;
  }

  const text = formInput.value.trim();

  if (!text) {
    formInput.focus();
    return;
  }

  formInput.value = "";
  formInput.style.height = "";
  await releaseThought(text);
  createEntry(text);
}

formInput.addEventListener("input", () => {
  formInput.style.height = "auto";
  formInput.style.height = `${Math.max(208, formInput.scrollHeight)}px`;
});

formInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    submitThought();
  }
});

driftButton.addEventListener("click", submitThought);
journalExitButton.addEventListener("click", resetToJournal);
pressureOrb.addEventListener("pointerdown", startPressureHold);
pressureOrb.addEventListener("pointermove", movePressureHold);
pressureOrb.addEventListener("pointerup", endPressureHold);
pressureOrb.addEventListener("pointercancel", endPressureHold);
pressureOrb.addEventListener("pointerleave", endPressureHold);
supportButtons.forEach((button) => {
  button.addEventListener("click", () => handleSupportChoice(button.dataset.support));
});
homeButton.addEventListener("click", resetToJournal);
sitReturnButton?.addEventListener("click", returnToReflection);
sitNewThoughtButton.addEventListener("click", resetToJournal);
groundStars.forEach((star) => {
  star.addEventListener("click", () => touchGroundStar(star));
});
groundNewThoughtButton.addEventListener("click", resetToJournal);
groundExitButton.addEventListener("click", resetToJournal);
savedReturnButton.addEventListener("click", returnToReflection);
savedNewThoughtButton.addEventListener("click", resetToJournal);
aftercareButtons.forEach((button) => {
  button.addEventListener("click", () => setAftercareMode(button.dataset.aftercare));
});
window.addEventListener("pointermove", (event) => {
  if (aftercareMode !== "movement") {
    return;
  }

  movementTouch = {
    active: true,
    x: event.clientX,
    y: event.clientY,
    lastSeen: performance.now(),
  };
});
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateOrbBlob();
requestAnimationFrame(drawStars);
