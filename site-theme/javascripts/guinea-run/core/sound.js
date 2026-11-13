/*
 * The sounds of Guinea Run.
 *
 * The guinea pig is a real one: short recordings from Wikimedia Commons, all
 * in the public domain (see sounds/CREDITS.txt), loaded with the first sound.
 * Everything else is played by the browser: soft bells and marimba notes, with
 * a little room around them. Until the recordings are in, the guinea pig is
 * quiet and the rest still plays.
 *
 * The audio context is created on the first sound, which always follows a
 * click or a key press, so the browser allows it. M mutes, and the choice is
 * remembered in the browser.
 */
import { savedLocally } from "./save-signal.js";

const MUTE_KEY = "guinea-run-muted";
// The wheeks of a jump, never the same twice in a row: one per file in sounds/
const WHEEKS = ["wheek-1", "wheek-2", "wheek-3", "wheek-4", "wheek-5", "wheek-7", "wheek-11", "wheek-12"];
const CLIPS = [...WHEEKS, "hungry", "happy", "scared", "annoyed", "chirp"];
// A wheek on every jump would be too much: at most one this often
const WHEEK_GAP_S = 0.45;
// C major pentatonic, two octaves up: any two of them sound good together
const PENTATONIC = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];

// What brings a suspended audio back: a gesture, or the page shown again
const WAKE_EVENTS = ["pointerdown", "touchend", "keydown", "visibilitychange"];

export function createSound() {
  let context = null;
  let master = null;
  let room = null;
  let muted = false;
  let lastWheek = -10;
  let lastWheekName = "";
  const buffers = {};
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }

  function audio() {
    if (context) {
      return context;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }
    try {
      context = new Context();
      // A limiter last, so stacked sounds never crackle
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.ratio.value = 8;
      limiter.connect(context.destination);
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(limiter);
      room = createRoom(context);
      room.output.connect(limiter);
      loadClips();
      // A phone suspends the audio on a notification, a call or a dimmed
      // screen, and never brings it back by itself: the next touch, key or
      // return to the page does
      context.addEventListener("statechange", wake);
      for (const type of WAKE_EVENTS) {
        document.addEventListener(type, wake, { capture: true, passive: true });
      }
    } catch {
      context = null;
    }
    return context;
  }

  function wake() {
    if (!context || context.state === "running" || context.state === "closed" || document.hidden) {
      return;
    }
    try {
      context.resume().catch(() => {});
    } catch {
      // Tried again at the next touch
    }
  }

  /** A short, soft room: noise that fades out, used as a reverb. */
  function createRoom(ctx) {
    const length = Math.floor(ctx.sampleRate * 0.9);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    const input = ctx.createGain();
    input.gain.value = 0.22;
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    input.connect(convolver);
    return { input, output: convolver };
  }

  function loadClips() {
    for (const name of CLIPS) {
      const url = new URL("../sounds/" + name + ".mp3", import.meta.url);
      fetch(url)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
        .then((data) => new Promise((resolve, reject) => context.decodeAudioData(data, resolve, reject)))
        .then((buffer) => {
          buffers[name] = buffer;
        })
        .catch(() => {
          // A missing recording only makes the guinea pig quiet
        });
    }
  }

  function connect(node, wet) {
    node.connect(master);
    if (wet) {
      node.connect(room.input);
    }
  }

  /** A recording, at a slightly different pitch each time so repeats do not sound canned. */
  function clip(name, volume, delay, rate) {
    const ctx = audio();
    const buffer = buffers[name];
    if (!ctx || !buffer) {
      return;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate || 0.94 + Math.random() * 0.14;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    connect(gain, true);
    source.start(ctx.currentTime + (delay || 0));
  }

  /**
   * A bell or a marimba bar: a sine with a quieter partial above it, a fast
   * attack and a natural decay.
   */
  function bell(frequency, delay, volume, decay, partial) {
    const ctx = audio();
    if (!ctx) {
      return;
    }
    const start = ctx.currentTime + (delay || 0);
    const length = decay || 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    connect(gain, true);
    [
      [1, 1],
      [partial || 4, 0.18],
      [2.01, 0.12]
    ].forEach(([ratio, level]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency * ratio;
      const partialGain = ctx.createGain();
      partialGain.gain.value = level;
      osc.connect(partialGain);
      partialGain.connect(gain);
      osc.start(start);
      osc.stop(start + length + 0.05);
    });
  }

  /** A soft low thump, felt more than heard. */
  function thump(delay, volume) {
    const ctx = audio();
    if (!ctx) {
      return;
    }
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, start);
    osc.frequency.exponentialRampToValueAtTime(55, start + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain);
    connect(gain, false);
    osc.start(start);
    osc.stop(start + 0.3);
  }

  /** A breath of filtered noise that rises: the swish of a power-up. */
  function swish(delay, volume, from, to) {
    const ctx = audio();
    if (!ctx) {
      return;
    }
    const start = ctx.currentTime + (delay || 0);
    const length = 0.35;
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter);
    filter.connect(gain);
    connect(gain, true);
    source.start(start);
  }

  // One short noise buffer for every clack, made once
  let clackNoise = null;

  /**
   * A solenoid, a coil slamming a plunger: a short burst of band-passed noise.
   * freq: the colour of the metal, decay: how fast it dies.
   */
  function clack(delay, volume, freq, decay) {
    const ctx = audio();
    if (!ctx) {
      return;
    }
    if (!clackNoise) {
      clackNoise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
      const data = clackNoise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const start = ctx.currentTime + (delay || 0);
    const source = ctx.createBufferSource();
    source.buffer = clackNoise;
    source.playbackRate.value = 0.9 + Math.random() * 0.2;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    source.connect(filter);
    filter.connect(gain);
    connect(gain, false);
    source.start(start);
    source.stop(start + decay + 0.02);
  }

  // The three chimes of an old score unit: tens, hundreds, thousands
  const CHIMES = [523.3, 659.3, 784];

  /** One chime struck: a bell bar with a long ring. which: 0 low, 1 middle, 2 high. */
  function chime(which, delay) {
    clack(delay, 0.08, 3000, 0.012);
    bell(CHIMES[which] * 2, delay, 0.07, 1.1, 2.76);
  }

  /** The knocker: a hammer on the inside of the cabinet. */
  function knock(delay) {
    clack(delay, 0.9, 260, 0.12);
    thump(delay, 0.3);
  }

  /** Score reels turning: quick ticks. */
  function reel(delay, ticks) {
    for (let i = 0; i < ticks; i++) {
      clack((delay || 0) + i * 0.045, 0.12, 2600, 0.015);
    }
  }

  /** The buzz of a tilt: a low square wave. */
  function buzz(delay, volume, length) {
    const ctx = audio();
    if (!ctx) {
      return;
    }
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 110;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.setValueAtTime(volume, start + length - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    connect(gain, false);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  const SOUNDS = {
    // A jump: the guinea pig's own wheek, now and then
    wheek() {
      const now = context ? context.currentTime : 0;
      if (now - lastWheek < WHEEK_GAP_S) {
        return;
      }
      lastWheek = now;
      // Any of them but the last one heard
      const choices = WHEEKS.filter((name) => name !== lastWheekName);
      lastWheekName = pick(choices);
      clip(lastWheekName, 0.42);
    },
    // A long wheek, as when the fridge opens: a world starts
    hungry() {
      clip("hungry", 0.5);
    },
    pickup() {
      bell(pick(PENTATONIC), 0, 0.22, 0.35);
    },
    combo() {
      [0, 2, 4].forEach((step, i) => bell(PENTATONIC[step + 1], i * 0.07, 0.2, 0.4));
    },
    // A lost attempt: a grumble from the guinea pig, and a low two-note "no"
    hit() {
      clip("annoyed", 0.45);
      bell(392, 0, 0.16, 0.35, 2.5);
      bell(329.6, 0.12, 0.16, 0.5, 2.5);
    },
    power() {
      swish(0, 0.25, 600, 4000);
      [0, 2, 4, 5].forEach((step, i) => bell(PENTATONIC[step], 0.05 + i * 0.05, 0.14, 0.5));
    },
    gate() {
      bell(784, 0, 0.2, 0.7, 3);
      bell(1174.7, 0.09, 0.18, 0.9, 3);
    },
    click() {
      bell(1760, 0, 0.06, 0.08);
    },
    // Something went wrong that costs no attempt: a frightened squeak over a soft thump
    wrong() {
      thump(0, 0.5);
      clip("scared", 0.55, 0.02);
    },
    // A world done: the guinea pig purrs
    happy() {
      clip("happy", 0.5, 0.15);
      [0, 2, 4].forEach((step, i) => bell(PENTATONIC[step], i * 0.09, 0.18, 0.8));
    },
    fanfare() {
      clip("happy", 0.45, 0.5);
      clip("hungry", 0.35, 1.3, 1.05);
      const chord = [523.3, 659.3, 784, 1046.5, 1318.5];
      chord.forEach((frequency, i) => bell(frequency, i * 0.08, 0.2, 1.4, 3));
      chord.forEach((frequency) => bell(frequency * 2, 0.55, 0.08, 1.6, 3));
    },
    // A mushroom eaten: a quick rising run of notes over a swish, and a happy wheek on top
    grow() {
      swish(0, 0.22, 300, 3000);
      const run = [261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5, 1318.5, 1568];
      run.forEach((frequency, i) => bell(frequency, i * 0.055, 0.16, 0.35, 3));
      bell(2093, run.length * 0.055, 0.12, 0.9);
      clip("happy", 0.4, 0.35, 1.08);
    },
    // Back to normal size: the same run, falling
    shrink() {
      [1568, 1174.7, 784, 587.3, 392, 293.7].forEach((frequency, i) => bell(frequency, i * 0.06, 0.13, 0.3, 2.5));
    },
    // A validation rule broken by a giant: a thump and a bright crack
    smash() {
      thump(0, 0.6);
      swish(0, 0.2, 3000, 500);
      bell(523.3, 0.02, 0.16, 0.25, 2.5);
      bell(1046.5, 0.06, 0.14, 0.35, 3);
    },
    // World 1's castle: the admin throws a Flow, a fiery whoosh and a low crackle
    fireFlow() {
      swish(0, 0.16, 500, 2600);
      swish(0.06, 0.08, 3200, 900);
      bell(220, 0.01, 0.08, 0.2, 2.5);
    },
    // He lands on the bridge: a heavy wooden thump
    bridgeStomp() {
      thump(0, 0.7);
      bell(98, 0, 0.12, 0.3, 2.2);
    },
    // The axe: a bright clang, the chain let go
    bridgeAxe() {
      bell(1318.5, 0, 0.22, 0.9, 5.4);
      bell(1975.5, 0.01, 0.12, 0.7, 3.3);
      swish(0.05, 0.12, 2500, 600);
    },
    // A segment of the bridge drops: a short knock, quiet, it repeats
    bridgeDrop() {
      thump(0, 0.22);
      bell(pick([196, 220, 246.9]), 0, 0.05, 0.12, 2.5);
    },
    // He falls: a voice that screams all the way down, a falling whistle under it
    bridgeScream() {
      const ctx = audio();
      if (!ctx) {
        return;
      }
      const start = ctx.currentTime;
      const length = 2.1;
      const voice = ctx.createOscillator();
      voice.type = "sawtooth";
      voice.frequency.setValueAtTime(640, start);
      voice.frequency.exponentialRampToValueAtTime(430, start + 0.5);
      voice.frequency.exponentialRampToValueAtTime(160, start + length);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 7;
      const depth = ctx.createGain();
      depth.gain.value = 22;
      vibrato.connect(depth);
      depth.connect(voice.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.06);
      gain.gain.setValueAtTime(0.4, start + length - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      // Three formants: a wide-open "aaah"
      [
        [800, 5, 1],
        [1250, 7, 0.6],
        [2600, 9, 0.25]
      ].forEach(([frequency, q, level]) => {
        const formant = ctx.createBiquadFilter();
        formant.type = "bandpass";
        formant.frequency.value = frequency;
        formant.Q.value = q;
        const formantGain = ctx.createGain();
        formantGain.gain.value = level;
        voice.connect(formant);
        formant.connect(formantGain);
        formantGain.connect(gain);
      });
      connect(gain, true);
      voice.start(start);
      vibrato.start(start);
      voice.stop(start + length + 0.05);
      vibrato.stop(start + length + 0.05);
      const whistle = ctx.createOscillator();
      whistle.type = "sine";
      whistle.frequency.setValueAtTime(1700, start + 0.1);
      whistle.frequency.exponentialRampToValueAtTime(260, start + 1.9);
      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.0001, start + 0.1);
      whistleGain.gain.exponentialRampToValueAtTime(0.05, start + 0.2);
      whistleGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.95);
      whistle.connect(whistleGain);
      connect(whistleGain, true);
      whistle.start(start + 0.1);
      whistle.stop(start + 2);
    },
    // Into the lava: a deep plop and a hiss
    lavaSplash() {
      thump(0, 0.6);
      swish(0.02, 0.22, 1800, 200);
      swish(0.2, 0.1, 4000, 2000);
    },
    // Victor's note: a little chirp and a chime
    note() {
      clip("chirp", 0.35, 0, 1);
      bell(2093, 0.05, 0.14, 0.6);
      bell(2637, 0.15, 0.12, 0.8);
    },
    // World 7: a vegetable on a tester's face, a wet thump and a squelch falling away
    adminSplat() {
      thump(0, 0.35);
      swish(0, 0.16, 2400, 300);
      bell(pick(PENTATONIC) / 2, 0.02, 0.05, 0.14, 3);
    },
    // A tester who coughs his way to sick leave: two short rough bursts, falling
    adminCough() {
      swish(0, 0.22, 900, 260);
      thump(0.02, 0.25);
      swish(0.2, 0.18, 800, 240);
      thump(0.22, 0.2);
    },
    // A vegetable thrown: a soft whoosh and a tiny pluck, quiet, it repeats
    throw() {
      swish(0, 0.07, 1200, 3200);
      bell(pick(PENTATONIC) / 2, 0.01, 0.04, 0.12);
    },
    // World 9: an admin whacked back into his hole, a thump and a bright pop
    moleBonk() {
      thump(0, 0.45);
      bell(pick(PENTATONIC), 0.01, 0.12, 0.18, 3);
    },
    // World 3: the admin snatches a card out of the Pull Request, a paper swish and a low pluck
    w3Grab() {
      swish(0, 0.16, 3200, 700);
      bell(196, 0.04, 0.1, 0.25, 2.5);
    },
    // His "manual step" timer in its last seconds: a dry clock tick
    w3Tick() {
      thump(0, 0.12);
      bell(2637, 0, 0.05, 0.04, 2);
    },
    // World 8's boss rises: a long swish up and three low bells climbing
    bossIn() {
      swish(0, 0.24, 200, 2400);
      [196, 246.9, 293.7].forEach((frequency, i) => bell(frequency, 0.1 + i * 0.12, 0.18, 0.7, 2.5));
    },
    // It throws an error: a swish that falls and a low "boing"
    bossThrow() {
      swish(0, 0.1, 2600, 500);
      bell(146.8, 0.02, 0.12, 0.25, 2.5);
    },
    // A vegetable lands on it: a short bonk, quiet, it comes twice a beat
    bossHit() {
      thump(0, 0.18);
      bell(pick(PENTATONIC) * 1.5, 0, 0.06, 0.1, 3);
    },
    // It has no life left: bells falling, a deep thump
    bossDown() {
      swish(0, 0.2, 3000, 250);
      [784, 659.3, 523.3, 392, 293.7, 196].forEach((frequency, i) => bell(frequency, i * 0.09, 0.15, 0.4, 2.5));
      thump(0.6, 0.6);
    },
    // World 5: the admin clicks Accept Current Change, two dry mouse clicks and a line swept away
    adminClick() {
      bell(2637, 0, 0.09, 0.05, 2);
      bell(2349.3, 0.07, 0.08, 0.05, 2);
      swish(0.08, 0.12, 2200, 400);
      bell(220, 0.1, 0.1, 0.3, 2.5);
    },
    // His git push --force meets the branch protection: a heavy lock and a low two-note buzz
    pushRejected() {
      thump(0, 0.7);
      bell(110, 0.02, 0.2, 0.5, 1.5);
      bell(103.8, 0.3, 0.2, 0.7, 1.5);
      bell(1568, 0.05, 0.1, 0.4, 3);
    },
    // World 0: the admin throws a block, a swish and a low "access denied" buzz, twice
    w0Denied() {
      swish(0, 0.12, 2600, 700);
      bell(233.1, 0.03, 0.12, 0.16, 1.5);
      bell(233.1, 0.2, 0.12, 0.2, 1.5);
    },
    // A tool lands on his laptop: a soft knock and an install chime going up
    w0Install() {
      thump(0, 0.2);
      [0, 2, 4].forEach((step, i) => bell(PENTATONIC[step] / 2, 0.02 + i * 0.06, 0.14, 0.35));
    },
    // World 4: the Dev types a line of i++, three dry key clicks and a swish
    w4Type() {
      [0, 0.05, 0.1].forEach((at) => bell(2093, at, 0.03, 0.03, 2));
      swish(0.1, 0.1, 2400, 900);
    },
    // A line of i++ stopped: a short pop going down
    w4Squash() {
      thump(0, 0.12);
      bell(880, 0, 0.06, 0.08, 3);
      bell(659.3, 0.04, 0.06, 0.1, 3);
    },
    // Pipeline Pinball, an electromechanical table: solenoid clacks, chimes, the knocker
    pbFlipper() {
      clack(0, 0.5, 1800, 0.05);
      thump(0, 0.16);
    },
    pbFlipperDown() {
      clack(0, 0.18, 1200, 0.035);
    },
    pbBumper() {
      clack(0, 0.55, 900, 0.06);
      thump(0, 0.14);
      chime(2, 0.012);
    },
    pbSling() {
      clack(0, 0.4, 1400, 0.045);
      thump(0, 0.08);
    },
    pbDrop() {
      clack(0, 0.3, 700, 0.07);
      chime(1, 0.02);
    },
    pbTarget() {
      clack(0, 0.22, 2400, 0.03);
      chime(2, 0.01);
    },
    pbLane() {
      chime(2, 0);
    },
    pbSpin() {
      clack(0, 0.12, 3200, 0.018);
    },
    pbRamp() {
      chime(2, 0);
      chime(1, 0.12);
      chime(0, 0.24);
    },
    pbOrbit() {
      swish(0, 0.06, 900, 2600);
      chime(1, 0.05);
    },
    pbKick() {
      clack(0, 0.45, 600, 0.08);
      thump(0, 0.16);
    },
    pbLock() {
      clack(0, 0.4, 500, 0.09);
      chime(0, 0.1);
      chime(1, 0.22);
    },
    pbGate() {
      [2, 1, 0, 2, 1, 0].forEach((c, i) => chime(c, i * 0.09));
    },
    pbMission() {
      [0, 1, 2].forEach((c, i) => chime(c, i * 0.12));
    },
    pbCombo() {
      chime(1, 0);
      chime(2, 0.08);
    },
    pbJackpot() {
      [0, 1, 2, 0, 1, 2, 2, 2].forEach((c, i) => chime(c, i * 0.075));
      reel(0.1, 10);
    },
    pbMultiball() {
      [0, 1, 2, 2, 1, 0, 0, 1, 2].forEach((c, i) => chime(c, i * 0.09));
      swish(0.2, 0.08, 400, 3000);
    },
    // The knocker of a free game: one hard knock on the cabinet, then the chimes
    pbExtra() {
      knock(0);
      clip("happy", 0.5, 0.25);
      [0, 1, 2].forEach((c, i) => chime(c, 0.3 + i * 0.1));
    },
    pbSave() {
      chime(1, 0);
      chime(2, 0.1);
    },
    pbTiltWarn() {
      buzz(0, 0.08, 0.25);
    },
    pbTilt() {
      buzz(0, 0.12, 0.9);
      thump(0, 0.2);
    },
    pbDrain() {
      clip("scared", 0.45);
      chime(0, 0.1);
    },
    // Score reels turning over, for a big award
    pbReel() {
      reel(0, 6);
    },
    // World 6: the Dev deploys a component from his sandbox, a terminal beep and a swish
    w6Deploy() {
      bell(1318.5, 0, 0.06, 0.06, 2);
      bell(1760, 0.06, 0.06, 0.06, 2);
      swish(0.08, 0.12, 2400, 600);
    }
  };

  return {
    get muted() {
      return muted;
    },
    /** The audio context and the master output, for the music of a world: null when the browser has no audio. */
    audio() {
      return audio() ? { context, master } : null;
    },
    play(name) {
      if (muted || !SOUNDS[name]) {
        return;
      }
      try {
        if (audio()) {
          wake();
          SOUNDS[name]();
        }
      } catch {
        // A sound is never worth an error
      }
    },
    toggle() {
      muted = !muted;
      try {
        window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
        savedLocally();
      } catch {
        // Not remembered, still applied
      }
      return muted;
    },
    dispose() {
      for (const type of WAKE_EVENTS) {
        document.removeEventListener(type, wake, { capture: true });
      }
      if (context) {
        context.removeEventListener("statechange", wake);
        context.close().catch(() => {});
        context = null;
      }
    }
  };
}
