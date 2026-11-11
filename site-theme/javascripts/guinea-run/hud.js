/*
 * What Guinea Run shows over the 3D view, in plain HTML so it stays sharp at
 * any resolution, styled after the Lightning Design System:
 * - the map of the worlds, with their stars, best scores and lab links
 * - the card of a world before it starts, and its result after
 * - the top bar (world, score, attempts, badges), sound, pause and close
 * - toasts, the chat of the cast, Victor's notes, the log ticker
 * - the pads at the bottom of the screen
 * - the level-complete animation with the Cloudity logo and the badge
 * - the Hall of Fame: the boards, and sending one's scores
 * - the bonuses (Pipeline Pinball, Org-Man): their cards on the map, their teaser, their start and end cards
 *
 * A world draws its own HTML in `layer`, between the 3D view and this HUD.
 * Buttons carry data-action, which input.js turns into actions; pads carry
 * data-pad and react on pointerdown.
 */
import { WORLDS, MODES, BONUSES } from "./core/story.js";
import { SPECIAL_THANKS, CONTACT_URLS } from "./credits.js";
import { GAME_ROWS } from "./core/hof.js";
import { COATS, COAT_FILTERS, NAME_MAX, cleanName, nameProblem } from "./core/online.js";

/**
 * The guinea pig of the cards: a picture of the 3D model
 * (scripts/blender/guinea-pig.py with GUINEA_PORTRAIT=1), set by guinea-run.css.
 */
const GUINEA_ART = '<span class="gr-pig" aria-hidden="true"></span>';

/**
 * How long a text stays on screen so a player can read it while playing:
 * a fixed time to notice it, then so much per character (about 17 characters
 * a second for a line worth reading, faster for a short call), capped. The
 * worlds use it for their own bubbles too.
 */
export function readingMs(text, kind) {
  const length = String(text || "").length;
  if (kind === "call") {
    return Math.min(6000, 1200 + length * 45);
  }
  return Math.min(12000, 1600 + length * 60);
}

/** Runs fn once the current changes are painted (two frames later). */
function afterPaint(fn) {
  window.requestAnimationFrame(() => window.requestAnimationFrame(fn));
}

/**
 * Keeps a character's lines readable, in real time whatever the pace of the
 * world: say(text, reaction, show) runs show() now, or once the line on
 * screen has been read (only the newest waiting line is kept), or never for a
 * reaction (a quip at a hit) while a line is still being read.
 */
export function lineKeeper() {
  let readUntil = 0;
  let pending = 0;
  return {
    say(text, reaction, show) {
      const wait = readUntil - performance.now();
      if (wait > 0) {
        if (reaction) {
          return;
        }
        window.clearTimeout(pending);
        pending = window.setTimeout(() => {
          readUntil = 0;
          this.say(text, reaction, show);
        }, wait);
        return;
      }
      readUntil = reaction ? 0 : performance.now() + readingMs(text);
      show();
    },
    /** The seconds a line should stay, at least, in real time. */
    seconds(text) {
      return readingMs(text) / 1000;
    },
    clear() {
      window.clearTimeout(pending);
      readUntil = 0;
    }
  };
}

export const BADGE_NAMES = {
  1: "sfdx-hardis Contributor Basics",
  2: "sfdx-hardis Contributor Advanced",
  3: "sfdx-hardis Release Manager"
};

const CAST = {
  // face: a cartoon portrait in theme/images, set by guinea-run.css
  mariia: { name: "Mariia Pyvovarchuk", initials: "MP", color: "#9050E9", face: true },
  romain: { name: "Romain Panda", initials: "RP", color: "#06A59A", face: true },
  victor: { name: "Victor Squeeker", initials: "VS", color: "#DD7A01" },
  you: { name: "You", initials: "US", color: "#0176D3" }
};

const CELEBRATION_MS = 3800;
const FLY_MS = 650;

function element(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined && text !== null) {
    node.textContent = text;
  }
  if (parent) {
    parent.appendChild(node);
  }
  return node;
}

function button(parent, action, label, className, content) {
  const node = element("button", "gr-button " + (className || ""), parent, content === undefined ? label : content);
  node.type = "button";
  node.setAttribute("data-action", action);
  node.setAttribute("aria-label", label);
  return node;
}

function image(parent, className, src, alt) {
  const node = element("img", className, parent);
  node.src = src;
  node.alt = alt || "";
  node.decoding = "async";
  node.draggable = false;
  return node;
}

function starsText(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
}

/**
 * options: logoUrl, badgeUrl(level), labs (the lab links of the page
 * language: { "1.4": { url, title } }).
 */
export function createHud(t, options) {
  const overlay = element("div", "guinea-run");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", t("title"));
  overlay.setAttribute("data-state", "loading");
  overlay.tabIndex = -1;

  const canvas = element("canvas", "gr-canvas", overlay);
  canvas.setAttribute("aria-hidden", "true");
  const layer = element("div", "gr-layer", overlay);

  // The top bar
  const top = element("div", "gr-top", overlay);
  const path = element("ol", "gr-path", top);
  path.hidden = true;
  const bar = element("div", "gr-bar", top);
  const worldPill = element("div", "gr-pill gr-world", bar);
  const score = element("div", "gr-pill", bar);
  const attempts = element("div", "gr-pill gr-attempts", bar);
  attempts.setAttribute("aria-label", t("attempts"));
  const shelf = element("div", "gr-pill gr-shelf", bar);
  shelf.setAttribute("aria-label", t("badgesEarned"));
  const slots = [1, 2, 3].map((level) => {
    const slot = element("span", "gr-slot", shelf);
    slot.setAttribute("data-level", String(level));
    image(slot, "", options.badgeUrl(level), BADGE_NAMES[level]);
    return slot;
  });
  const extra = element("div", "gr-extra", top);
  // Where the top bar ends, for the messages that sit under it on a phone
  if (window.ResizeObserver) {
    const watch = new ResizeObserver(() => {
      const box = top.getBoundingClientRect();
      const frame = overlay.getBoundingClientRect();
      overlay.style.setProperty("--gr-top-end", Math.round(box.bottom - frame.top) + "px");
    });
    watch.observe(top);
  }
  // What to do right now, in one line that stays
  const goal = element("div", "gr-goal", top);
  goal.hidden = true;
  const goalText = element("span", "", goal);

  const corner = element("div", "gr-corner", overlay);
  const muteButton = button(corner, "mute", t("mute"), "gr-icon gr-mute", "♪");
  button(corner, "pause", t("btnPause"), "gr-icon gr-pause", "II");
  button(corner, "quit", t("close"), "gr-icon", "✕");

  // A big instruction in the middle, for the moments that matter
  const coach = element("div", "gr-coach", overlay);
  coach.setAttribute("aria-live", "assertive");
  let coachTimer = 0;
  let coachReadUntil = 0;
  let coachPending = 0;
  let coachLast = "";
  let coachSeq = 0;
  let pendingCoach = null;
  let coaching = false;
  let goalValue = "";
  const narrow = window.matchMedia ? window.matchMedia("(max-width: 600px)") : { matches: false };
  // Why a move was wrong, and what to do instead, right after a mistake
  const tipBar = element("div", "gr-tipbar", overlay);
  tipBar.setAttribute("aria-live", "polite");
  const tipTitle = element("strong", "", tipBar);
  const tipText = element("span", "", tipBar);
  let tipTimer = 0;
  let tipReadUntil = 0;
  let tipPending = 0;
  const toast = element("div", "gr-toast", overlay);
  toast.setAttribute("aria-live", "polite");
  let toastTimer = 0;
  let toastReadUntil = 0;
  let toastPending = 0;
  const chat = element("div", "gr-chat", overlay);
  // The chat bubbles waiting for the oldest one on screen to be read
  const chatQueue = [];

  /** who: a name of CAST, or a speaker outside it: { name, faceUrl, color }. */
  function showChat(who, text, life) {
    const person = typeof who === "object" && who ? who : CAST[who] || CAST.you;
    const bubble = element("div", "gr-bubble", chat);
    const avatar = element("span", "gr-avatar", bubble, person.face || person.faceUrl ? "" : person.initials);
    avatar.style.backgroundColor = person.color;
    if (person.faceUrl) {
      avatar.classList.add("gr-avatar--portrait");
      avatar.style.backgroundImage = 'url("' + person.faceUrl + '")';
    } else if (person.face) {
      avatar.classList.add("gr-avatar--" + who);
    }
    const content = element("div", "", bubble);
    element("strong", "", content, person === CAST.you ? t("castYou") : person.name);
    element("span", "", content, text);
    bubble.dataset.readUntil = String(performance.now() + Math.min(life, readingMs(text) + 250));
    while (chat.children.length > 2) {
      chat.firstChild.remove();
    }
    window.setTimeout(() => bubble.classList.add("is-leaving"), life - 400);
    window.setTimeout(() => {
      bubble.remove();
      if (chatQueue.length) {
        nextChat();
      }
    }, life);
  }

  function nextChat() {
    if (!chatQueue.length) {
      return;
    }
    const wait = chatWait();
    if (wait > 0) {
      window.setTimeout(nextChat, wait);
      return;
    }
    const queued = chatQueue.shift();
    showChat(queued[0], queued[1], chatLife(queued[1], queued[2]));
    if (chatQueue.length) {
      window.setTimeout(nextChat, Math.max(0, chatWait()));
    }
  }

  /** How long a bubble stays: its reading time, plus its slide in and fade out. */
  function chatLife(text, ms) {
    return Math.max(ms || 4500, readingMs(text) + 650);
  }

  /**
   * How long a new bubble must wait: two fit on a large screen (a third pushes
   * the oldest out), a phone shows only the newest (it would hide the last one).
   */
  function chatWait() {
    const room = narrow.matches ? 1 : 2;
    const hidden = narrow.matches ? chat.lastElementChild : chat.firstElementChild;
    if (chat.children.length < room || !hidden) {
      return 0;
    }
    return Number(hidden.dataset.readUntil || 0) - performance.now();
  }
  chat.setAttribute("aria-live", "polite");
  const ticker = element("div", "gr-ticker", overlay);
  ticker.setAttribute("aria-hidden", "true");

  const panel = element("div", "gr-panel", overlay);
  panel.hidden = true;

  const controls = element("div", "gr-controls", overlay);
  const pads = {};
  for (const [pad, label, glyph] of [
    ["left", "btnLeft", "◀"],
    ["duck", "btnDuck", "▼"],
    ["confirm", "btnOk", "OK"],
    ["jump", "btnJump", "▲"],
    ["right", "btnRight", "▶"]
  ]) {
    const node = element("button", "gr-button gr-pad", controls, glyph);
    node.type = "button";
    node.setAttribute("data-pad", pad);
    node.setAttribute("aria-label", t(label));
    pads[pad] = node;
  }

  const touch = Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const reduced = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  let showButtons = touch;
  overlay.classList.toggle("gr-show-buttons", showButtons);
  let celebration = null;
  let lastUpdate = "";

  // The pads of the world on screen: the keys list names only those
  let worldPads = null;
  function keysHelp(parent) {
    const list = element("ul", "gr-keys", parent);
    const uses = { keysMove: ["left", "right"], keysJump: ["jump"], keysDuck: ["duck"], keysConfirm: ["confirm"] };
    const all = touch ? ["keysTouch", "keysMove", "keysJump", "keysConfirm"] : ["keysMove", "keysJump", "keysDuck", "keysConfirm", "keysOther"];
    // The bonus table has flippers, a plunger and a nudge instead; the maze four ways to go
    const flippers = Boolean(worldPads && worldPads.includes("flippers"));
    const maze = Boolean(worldPads && worldPads.includes("maze"));
    const lines = flippers
      ? touch
        ? ["keysFlipTouch"]
        : ["keysFlip", "keysPlunger", "keysOther"]
      : maze
        ? touch
          ? ["keysMazeTouch"]
          : ["keysMaze", "keysOther"]
        : all.filter((key) => !worldPads || !uses[key] || uses[key].some((pad) => worldPads.includes(pad)));
    for (const key of lines) {
      element("li", "", list, t(key));
    }
    const label = element("label", "gr-toggle", parent);
    const box = element("input", "", label);
    box.type = "checkbox";
    box.checked = showButtons;
    box.addEventListener("change", () => {
      showButtons = box.checked;
      overlay.classList.toggle("gr-show-buttons", showButtons);
    });
    element("span", "", label, t("showButtons"));
  }

  /** A Lightning modal: a header, a body, and the buttons in the footer. */
  function screen(state, title, build, wide) {
    closeJoin();
    overlay.setAttribute("data-state", state);
    panel.replaceChildren();
    panel.hidden = false;
    panel.classList.toggle("gr-wide", Boolean(wide));
    panel.classList.remove("gr-roll-panel");
    const header = element("div", "gr-modal-header", panel);
    element("h2", "", header, title);
    const body = element("div", "gr-modal-body", panel);
    const footer = element("div", "gr-modal-footer", panel);
    build(body, footer, header);
    const primary = panel.querySelector(".gr-primary");
    if (primary) {
      primary.focus({ preventScroll: true });
    }
  }

  /* ---------- The Hall of Fame ---------- */

  /* ---------- The modes ---------- */

  function modeSwitch(body, current) {
    const box = element("div", "gr-modes", body);
    box.setAttribute("role", "radiogroup");
    box.setAttribute("aria-label", t("modeTitle"));
    element("span", "gr-small-title", box, t("modeTitle"));
    for (const mode of MODES) {
      const node = button(box, "mode", t("mode_" + mode.id), "gr-small" + (mode.id === current ? " is-active" : ""));
      node.setAttribute("data-mode", mode.id);
      node.setAttribute("role", "radio");
      node.setAttribute("aria-checked", String(mode.id === current));
    }
    element("span", "gr-muted gr-mode-hint", box, t("modeHint_" + current));
  }

  let hofDraft = null;

  // The words of each bonus, by its id
  const BONUS_TEXT = {
    pinball: { name: "bonusName", style: "style_pinball", pitch: "bonusPitch", rule: "bonusRule", one: "bonusOneDifficulty", tab: "hofPinballTab", title: "hofPinballTitle", see: "hofSeeBonus", play: "teaserPlay", glyph: "★" },
    orgman: { name: "orgName", style: "style_maze", pitch: "orgPitch", rule: "orgRule", one: "orgOneDifficulty", tab: "hofOrgmanTab", title: "hofOrgmanTitle", see: "hofSeeOrgman", play: "teaserPlayOrg", glyph: "◉" }
  };
  const bonusText = (id) => BONUS_TEXT[id] || BONUS_TEXT.pinball;

  function hofList(body, view) {
    const general = view.tab === "all";
    const bonus = view.tab === "pinball" || view.tab === "orgman";
    const list = view.list || [];
    if (!list.length) {
      element("p", "gr-muted", body, view.ok ? t("hofEmpty") : t("hofOffline"));
      return;
    }
    const rows = element("ol", "gr-hof-list", body);
    const mine = view.rank ? view.rank.rank : 0;
    list.slice(0, GAME_ROWS).forEach((p, i) => {
      const row = element("li", "gr-hof-row" + (mine === i + 1 ? " is-you" : ""), rows);
      element("span", "gr-hof-rank", row, String(i + 1));
      coatPicture(row, p.coat);
      element("span", "gr-hof-handle", row, p.name);
      if (bonus) {
        element("span", "gr-hof-stars", row, t(view.tab === "orgman" ? "hofMaze" : "hofLevel", { n: p.level }));
        element("span", "gr-hof-score", row, number(p.score));
        return;
      }
      const stars = element("span", "gr-hof-stars", row, general ? "★ " + p.stars : starsText(p.stars));
      stars.setAttribute("aria-label", t("starsLabel", { n: p.stars }));
      if (!general && p.bossMs !== null) {
        element("span", "gr-hof-time", row, t("hofBossTime", { s: (p.bossMs / 1000).toFixed(1) }));
      }
      if (!general && p.mode && p.mode !== "easy") {
        const tag = element("span", "gr-hof-mode gr-hof-mode--" + p.mode, row, t("mode_" + p.mode).charAt(0));
        tag.title = t("mode_" + p.mode);
        tag.setAttribute("aria-label", t("mode_" + p.mode));
      }
      element("span", "gr-hof-score", row, String(general ? p.total : p.score));
    });
    if (mine > GAME_ROWS) {
      element("p", "gr-muted", body, t("hofYou", { rank: mine, total: view.rank.players }));
    }
  }

  /** A guinea pig of a coat, the picture of a board row and of the coat picker. */
  function coatPicture(parent, coat) {
    const code = COATS.includes(coat) ? coat : COATS[0];
    const pic = element("span", "gr-coat gr-coat--" + code, parent);
    pic.style.filter = COAT_FILTERS[code];
    pic.setAttribute("aria-hidden", "true");
    return pic;
  }

  function number(n) {
    return Math.round(n).toLocaleString(options.lang === "fr" ? "fr-FR" : "en-US");
  }

  /** The card of a bonus on the map, under the worlds. bonus: { id, best, hasSave }. */
  function bonusCard(body, bonus) {
    const words = bonusText(bonus.id);
    const card = element("div", "gr-card gr-bonus-card", body);
    card.setAttribute("data-world", bonus.id);
    const head = element("div", "gr-card-head", card);
    element("span", "gr-card-number", head, words.glyph);
    const titles = element("div", "gr-card-titles", head);
    element("strong", "", titles, t(words.name));
    element("span", "gr-card-style", titles, t(words.style));
    element("p", "gr-card-pitch", card, t(words.pitch));
    const foot = element("div", "gr-card-foot", card);
    if (bonus.best > 0) {
      element("span", "gr-muted", foot, t("best") + ": " + number(bonus.best));
    }
    const play = button(foot, "bonus", t(words.name), "gr-primary gr-small", bonus.hasSave ? t("bonusResume") : t("play"));
    play.setAttribute("data-world", bonus.id);
    return play;
  }

  /**
   * The nickname and the guinea pig of the player: the profile box of the Hall
   * of Fame card, and the join box of an end card (compact). view: { profile,
   * online (the database answers), testLink (a test link: nothing is ever
   * sent), onSave(name, coat) -> Promise<"saved"|"later"|"refused">, onSkip?,
   * onForget? -> Promise<boolean>, and for the join modal: joinTitle?,
   * joinText?, joinLabel? (the words of the box), onDone?(outcome) (the box is
   * answered: "skipped", "saved" or "later"; a refused nickname stays in the box) }.
   */
  function profileForm(box, view, compact) {
    const joined = Boolean(view.profile && view.profile.id);
    const draft = hofDraft || { name: joined ? view.profile.name : "", coat: (view.profile && view.profile.coat) || COATS[0] };
    hofDraft = draft;
    // A form: Enter in the nickname box sends it, which the game's own keys never stop
    const form = element("form", "gr-hof-form", box);
    form.noValidate = true;
    element("p", compact ? "gr-hof-invite-title" : "gr-small-title", form, joined ? t("hofProfileTitle") : view.joinTitle || t("hofJoinTitle"));
    if (!joined) {
      element("p", "gr-hof-join-text", form, view.joinText || t("hofJoinText"));
    }
    const label = element("label", "gr-hof-field", form);
    element("span", "", label, t("hofName"));
    const input = element("input", "", label);
    input.type = "text";
    // What was typed survives a change of tab, which draws the card again
    input.value = draft.name;
    input.maxLength = NAME_MAX;
    input.autocomplete = "nickname";
    input.spellcheck = false;
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    const coats = element("div", "gr-coats", form);
    coats.setAttribute("role", "radiogroup");
    coats.setAttribute("aria-label", t("hofCoat"));
    element("span", "gr-coats-title", coats, t("hofCoat"));
    const choices = [];
    for (const coat of COATS) {
      const choice = element("button", "gr-coat-choice" + (coat === draft.coat ? " is-active" : ""), coats);
      choice.type = "button";
      choice.setAttribute("role", "radio");
      choice.setAttribute("aria-checked", String(coat === draft.coat));
      choice.setAttribute("aria-label", t("coat_" + coat));
      choice.title = t("coat_" + coat);
      choice.setAttribute("data-coat", coat);
      coatPicture(choice, coat);
      choices.push(choice);
      choice.addEventListener("click", () => {
        draft.coat = coat;
        for (const other of choices) {
          const on = other.getAttribute("data-coat") === coat;
          other.classList.toggle("is-active", on);
          other.setAttribute("aria-checked", String(on));
        }
      });
    }
    const actions = element("div", "gr-hof-actions", form);
    const save = element("button", "gr-button gr-primary gr-small gr-hof-save", actions, joined ? t("hofSave") : view.joinLabel || t("hofJoin"));
    save.type = "submit";
    if (!joined && view.onSkip) {
      const skip = element("button", "gr-button gr-small gr-hof-skip", actions, t("hofNoThanks"));
      skip.type = "button";
      skip.addEventListener("click", () => {
        hofDraft = null;
        view.onSkip();
        if (view.onDone) {
          view.onDone("skipped");
        } else {
          box.hidden = true;
        }
      });
    }
    const message = element("p", "gr-muted gr-hof-message", form);
    message.setAttribute("aria-live", "polite");
    element("p", "gr-muted gr-hof-privacy", form, t("hofPrivacy"));
    input.addEventListener("input", () => {
      draft.name = input.value;
      message.textContent = "";
    });
    let busy = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = cleanName(input.value);
      const problem = nameProblem(name);
      if (problem) {
        message.textContent = t(problem);
        input.focus();
        return;
      }
      if (busy) {
        return;
      }
      busy = true;
      message.textContent = "";
      const outcome = await view.onSave(name, draft.coat);
      busy = false;
      hofDraft = null;
      if (!box.isConnected) {
        return;
      }
      if (view.onDone && outcome !== "refused") {
        view.onDone(outcome);
        return;
      }
      message.textContent = outcome === "refused" ? t("hofNameRefused") : outcome === "later" ? t("hofLaterLine") : t(joined ? "hofSaved" : "hofJoined");
    });
    if (joined && view.onForget) {
      forgetLink(box, view);
    }
  }

  /** "Remove me from the Hall of Fame", then a confirmation. */
  function forgetLink(box, view) {
    const link = element("button", "gr-link gr-hof-forget", box, t("hofForget"));
    link.type = "button";
    link.addEventListener("click", () => {
      link.remove();
      const confirm = element("div", "gr-hof-confirm", box);
      element("p", "", confirm, t("hofForgetConfirm"));
      const yes = element("button", "gr-button gr-small", confirm, t("hofForgetYes"));
      yes.type = "button";
      const no = element("button", "gr-button gr-small", confirm, t("hofForgetNo"));
      no.type = "button";
      no.addEventListener("click", () => {
        confirm.remove();
        forgetLink(box, view);
      });
      yes.addEventListener("click", async () => {
        yes.disabled = true;
        const done = await view.onForget();
        if (confirm.isConnected) {
          confirm.textContent = "";
          element("p", "gr-muted", confirm, done ? t("hofForgotten") : t("hofOffline"));
        }
      });
    });
  }

  /** The profile box under the boards of the Hall of Fame card. */
  function hofProfile(body, view) {
    const box = element("div", "gr-hof-send", body);
    if (view.testLink) {
      element("p", "gr-muted", box, t("hofTestMode"));
      return;
    }
    if (!view.online) {
      element("p", "gr-muted", box, t("hofOff"));
      return;
    }
    profileForm(box, view, false);
  }

  // The Hall of Fame box of the end card on screen: a line once the player joined or a score is sent
  let hofBox = null;
  // The join modal over the end card, or null
  let joinModal = null;

  /** An empty Hall of Fame box on an end card, filled by joinOffer() or hofStatus(). */
  function hofPlace(body) {
    hofBox = element("div", "gr-hof-invite", body);
    hofBox.hidden = true;
    hofBox.setAttribute("aria-live", "polite");
  }

  /** The join modal goes away, and the end card behind it takes the keys again. */
  function closeJoin() {
    if (!joinModal) {
      return;
    }
    joinModal.remove();
    joinModal = null;
    const primary = panel.querySelector(".gr-modal-footer .gr-primary");
    if (primary && !panel.hidden) {
      primary.focus({ preventScroll: true });
    }
  }

  /** The join modal is answered: the end card says what became of the score. */
  function joinAnswered(outcome) {
    closeJoin();
    if (outcome === "skipped" || !hofBox || !hofBox.isConnected) {
      return;
    }
    hofBox.textContent = "";
    hofBox.hidden = false;
    // Keeps hofStatus() from writing over the welcome
    hofBox.classList.add("gr-hof-join");
    element("span", "gr-hof-status", hofBox, t(outcome === "later" ? "hofLaterLine" : "hofJoined"));
  }

  /**
   * On a phone, on the map and after a won world: add the game to the home
   * screen, it then plays offline. install: null or { kind, url }; null leaves
   * the box empty and hidden, so the map can fill it when the browser offers
   * the install later.
   */
  function installBox(body, install, className) {
    const box = element("div", "gr-rule gr-rule--info gr-install" + (className ? " " + className : ""), body);
    box.setAttribute("aria-live", "polite");
    fillInstall(box, install);
  }

  function fillInstall(box, install) {
    box.textContent = "";
    box.hidden = !install;
    if (!install) {
      return;
    }
    element("strong", "", box, t("installTitle"));
    element("span", "", box, t("install_" + install.kind));
    if (install.kind === "page") {
      const link = element("a", "gr-button gr-small gr-install-link", box, t("installOpenPage"));
      link.href = install.url;
      link.setAttribute("data-action", "install-page");
    } else if (install.kind === "prompt") {
      button(box, "install", t("installButton"), "gr-small gr-install-link");
    }
  }

  /* ---------- The end credits ---------- */

  let creditsArgs = null;
  let rollAnimation = null;
  // How fast the roll goes up: a name read at a glance, two columns of them
  // (one on a phone, faster, so the roll lasts as long)
  const ROLL_PX_PER_S = 34;
  const ROLL_PX_PER_S_PHONE = 52;

  function rollCredits() {
    screen("credits", t("rollAgain"), (body, footer) => {
      panel.classList.add("gr-roll-panel");
      const roll = element("div", "gr-roll", body);
      const track = element("div", "gr-roll-track", roll);
      const block = (title, lines, className) => {
        const section = element("section", "gr-roll-block" + (className ? " " + className : ""), track);
        if (title) {
          element("h3", "", section, title);
        }
        for (const line of lines) {
          element("p", "", section, line);
        }
        return section;
      };
      const top = block("", [], "gr-roll-top");
      element("div", "gr-logo gr-logo--happy", top).innerHTML = GUINEA_ART;
      element("p", "gr-roll-game", top, t("title"));
      element("p", "", top, t("rollSubtitle"));
      block(t("rollStarring"), [t("rollPig")]);
      block(t("rollTeam"), [CAST.mariia.name, CAST.romain.name, CAST.victor.name]);
      block("", [t("rollBosses"), t("rollSalesManager")]);
      const thanks = block(t("rollThanks"), [t("rollThanksText")]);
      const names = element("ul", "gr-roll-names", thanks);
      for (const name of SPECIAL_THANKS) {
        element("li", "", names, name);
      }
      block(t("rollMadeWith"), [t("rollTool1"), t("rollTool2"), t("rollTool3")]);
      const end = block("", [], "gr-roll-end");
      image(end, "gr-roll-logo", options.logoUrl, "Cloudity");
      element("p", "gr-roll-by", end, t("rollBy"));
      element("p", "", end, t("rollCta"));
      contactLink(end);
      element("p", "gr-roll-thanks", end, t("rollEnd"));
      const next = button(footer, "credits-card", t("rollSkip"), "gr-primary");
      startRoll(roll, track, end, next);
    }, true);
  }

  /** Up from below the box until the Cloudity block sits in it; held while pressed. */
  function startRoll(roll, track, end, next) {
    if (rollAnimation) {
      rollAnimation.cancel();
      rollAnimation = null;
    }
    const done = () => {
      next.textContent = t("rollContinue");
      next.setAttribute("aria-label", t("rollContinue"));
    };
    if (reduced || typeof track.animate !== "function") {
      // Read at one's own pace: the roll scrolls by hand
      roll.classList.add("is-still");
      done();
      return;
    }
    afterPaint(() => {
      if (!track.isConnected) {
        return;
      }
      const box = roll.clientHeight;
      const stop = -(end.offsetTop + end.offsetHeight / 2 - box / 2);
      const distance = box - stop;
      rollAnimation = track.animate([{ transform: "translateY(" + box + "px)" }, { transform: "translateY(" + stop + "px)" }], {
        duration: (distance / (narrow.matches ? ROLL_PX_PER_S_PHONE : ROLL_PX_PER_S)) * 1000,
        easing: "linear",
        fill: "forwards"
      });
      rollAnimation.onfinish = done;
      const hold = () => rollAnimation && rollAnimation.playState === "running" && rollAnimation.pause();
      const go = () => rollAnimation && rollAnimation.playState === "paused" && rollAnimation.play();
      roll.addEventListener("pointerdown", hold);
      roll.addEventListener("pointerup", go);
      roll.addEventListener("pointercancel", go);
      roll.addEventListener("pointerleave", go);
    });
  }

  function contactLink(parent) {
    const link = element("a", "gr-button gr-roll-contact", parent, t("rollContact"));
    link.href = CONTACT_URLS[options.lang === "fr" ? "fr" : "en"];
    link.target = "_blank";
    link.rel = "noopener";
    return link;
  }

  /** The final card: the last world's result, the badges, Cloudity. */
  function creditsCard(earned, result) {
    if (rollAnimation) {
      rollAnimation.cancel();
      rollAnimation = null;
    }
    panel.classList.remove("gr-roll-panel");
    screen("credits", t("creditsTitle"), (body, footer) => {
      element("div", "gr-logo gr-logo--happy", body).innerHTML = GUINEA_ART;
      // The result of the last world first, as any world shows it
      element("p", "gr-result-stars", body, starsText(result.stars));
      element("p", "gr-score", body, t("score") + ": " + result.score);
      element("p", "gr-muted", body, result.newBest ? t("newBest") : t("best") + ": " + result.best);
      if (result.missed) {
        const box = element("div", "gr-rule gr-rule--info", body);
        element("strong", "", box, t("goodToKnow"));
        element("span", "", box, result.missed);
      }
      const rule = element("div", "gr-rule", body);
      element("strong", "", rule, t("theRule"));
      element("span", "", rule, t("w" + result.world.id + "_rule"));
      element("p", "gr-small-title", body, t("labs"));
      labLinks(body, result.world.labs);
      element("p", "", body, t("creditsText"));
      badgesRow(body, earned);
      element("p", "gr-teaser", body, t("teaser"));
      // One more thing: the bonus table, open now
      const bonus = element("div", "gr-rule gr-rule--info gr-bonus-cta", body);
      element("strong", "", bonus, t("teaserTitle"));
      element("span", "", bonus, t("bonusesPitch"));
      for (const b of BONUSES) {
        button(bonus, "bonus", t(bonusText(b.id).play), "gr-small gr-primary").setAttribute("data-world", b.id);
      }
      const cloudity = element("div", "gr-rule gr-rule--info gr-roll-cta", body);
      element("span", "", cloudity, t("rollCta"));
      contactLink(cloudity);
      button(footer, "credits-roll", t("rollAgain"));
      button(footer, "start", t("replay"));
      button(footer, "map", t("backToMap"), "gr-primary");
    });
  }

  function labLinks(parent, labs) {
    const list = element("ul", "gr-labs", parent);
    for (const id of labs) {
      const lab = options.labs[id];
      const item = element("li", "", list);
      if (lab) {
        const link = element("a", "", item, "Lab " + id + " · " + lab.title);
        link.href = lab.url;
        link.target = "_blank";
        link.rel = "noopener";
      } else {
        item.textContent = "Lab " + id;
      }
    }
    return list;
  }

  function badgesRow(parent, earned) {
    const row = element("div", "gr-badges", parent);
    for (const level of [1, 2, 3]) {
      const cell = element("figure", "gr-badge" + (earned.includes(level) ? " is-earned" : ""), row);
      image(cell, "", options.badgeUrl(level), BADGE_NAMES[level]);
      element("figcaption", "", cell, BADGE_NAMES[level].replace("sfdx-hardis ", ""));
    }
  }

  function finishCelebration() {
    if (!celebration || celebration.leaving) {
      return;
    }
    celebration.leaving = true;
    window.clearTimeout(celebration.timer);
    const { node, badge, level, done } = celebration;
    const slot = slots[level - 1];
    const from = badge.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const land = () => {
      slot.classList.add("is-earned");
      node.remove();
      celebration = null;
      done();
    };
    if (reduced || !from.width || !to.width) {
      land();
      return;
    }
    // The badge flies to its place on the shelf
    const flyer = badge.cloneNode(true);
    flyer.className = "gr-flyer";
    Object.assign(flyer.style, { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px" });
    overlay.appendChild(flyer);
    node.classList.add("is-leaving");
    badge.style.visibility = "hidden";
    requestAnimationFrame(() => {
      const scale = to.width / from.width;
      flyer.style.transform =
        "translate(" + (to.left + to.width / 2 - (from.left + from.width / 2)) + "px," + (to.top + to.height / 2 - (from.top + from.height / 2)) + "px) scale(" + scale + ")";
    });
    window.setTimeout(() => {
      flyer.remove();
      land();
    }, FLY_MS);
  }

  const hud = {
    overlay,
    canvas,
    layer,
    touch,
    reduced,

    loading() {
      screen("loading", t("title"), (body) => {
        element("p", "gr-muted", body, t("loading"));
      });
    },

    message(text, retry) {
      screen("error", t("title"), (body, footer) => {
        element("p", "", body, text);
        button(footer, "quit", t("close"), retry ? "" : "gr-primary");
        if (retry) {
          button(footer, "retry-load", t("retry"), "gr-primary");
        }
      });
    },

    /**
     * The map of the worlds. progress: the progress store. bonuses: [{ id, open,
     * best, hasSave }], one per bonus. install: the home screen offer, or null.
     */
    map(progress, onReset, bonuses, install) {
      screen(
        "map",
        t("mapTitle"),
        (body, footer) => {
          // A world added after a player finished the game is not done yet
          const allDone = progress.finished && progress.world(WORLDS[WORLDS.length - 1].id).stars > 0;
          element("p", "gr-muted gr-map-hint", body, allDone ? t("allDone") : t(options.hostSave ? "mapHintVscode" : "mapHint"));
          modeSwitch(body, progress.mode);
          installBox(body, install || null, "gr-install--map");
          const grid = element("ol", "gr-map", body);
          let focus = null;
          for (const world of WORLDS) {
            const record = progress.world(world.id);
            const open = world.id <= progress.unlocked;
            const card = element("li", "gr-card" + (open ? "" : " is-locked") + (record.stars > 0 ? " is-done" : ""), grid);
            card.setAttribute("data-world", String(world.id));
            const head = element("div", "gr-card-head", card);
            element("span", "gr-card-number", head, String(world.id));
            const titles = element("div", "gr-card-titles", head);
            element("strong", "", titles, t("w" + world.id + "_name"));
            element("span", "gr-card-style", titles, t("style_" + world.style) + (world.badge ? " · " + BADGE_NAMES[world.badge].replace("sfdx-hardis ", "") : ""));
            element("p", "gr-card-pitch", card, t("w" + world.id + "_pitch"));
            const foot = element("div", "gr-card-foot", card);
            const stars = element("span", "gr-stars", foot, starsText(record.stars));
            stars.setAttribute("aria-label", t("starsLabel", { n: record.stars }));
            if (record.best > 0) {
              element("span", "gr-muted", foot, t("best") + ": " + record.best);
            }
            if (open) {
              const play = button(foot, "play", t("w" + world.id + "_name"), "gr-primary gr-small", record.stars > 0 ? t("replay") : t("play"));
              play.setAttribute("data-world", String(world.id));
              if (!focus && record.stars === 0) {
                focus = play;
              }
            } else {
              element("span", "gr-lock", foot, t("locked"));
            }
          }
          // The bonuses, once every world is done: nothing shows them before
          for (const bonus of bonuses || []) {
            if (bonus.open) {
              const play = bonusCard(body, bonus);
              if (!focus) {
                focus = play;
              }
            }
          }
          const meta = element("div", "gr-map-meta", body);
          badgesRow(meta, progress.badges);
          button(meta, "hof", t("hofButton"), "gr-small gr-hof-open");
          element("p", "gr-muted", meta, t("notesFound", { n: progress.notesFound(), total: WORLDS.length }));
          const reset = element("button", "gr-link", meta, t("resetProgress"));
          reset.type = "button";
          reset.addEventListener("click", () => {
            if (window.confirm(t("resetConfirm"))) {
              onReset();
            }
          });
          button(footer, "quit", t("close"));
          window.setTimeout(() => {
            const target = focus || panel.querySelector('[data-action="play"]') || footer.querySelector("button");
            if (target) {
              target.focus({ preventScroll: true });
            }
          }, 0);
        },
        true
      );
      for (const level of [1, 2, 3]) {
        slots[level - 1].classList.toggle("is-earned", progress.badges.includes(level));
      }
    },

    /** The card of a world, before it starts. */
    intro(world, record, story, how, pads, mode) {
      worldPads = pads || null;
      screen("intro", t("world", { n: world.id }) + " · " + t("w" + world.id + "_name"), (body, footer) => {
        element("p", "", body, story || t("w" + world.id + "_pitch"));
        if (mode && mode.id !== "easy") {
          element("p", "gr-mode-line", body, t("modeLine", { mode: t("mode_" + mode.id), speed: mode.speed, mult: mode.mult }));
        }
        if (how && how.length) {
          element("p", "gr-small-title", body, t("howToPlay"));
          const steps = element("ol", "gr-how", body);
          how.forEach((step) => element("li", "", steps, step));
        }
        const rule = element("div", "gr-rule", body);
        element("strong", "", rule, t("theRule"));
        element("span", "", rule, t("w" + world.id + "_rule"));
        const stars = element("ul", "gr-star-goals", body);
        ["starFinish", "starClean", "starNote"].forEach((key, i) => {
          element("li", record.stars > i ? "is-earned" : "", stars, "★ " + t(key));
        });
        keysHelp(body);
        element("p", "gr-small-title", body, t("labs"));
        labLinks(body, world.labs);
        button(body, "hof", t("hofSeeWorld"), "gr-small gr-hof-open").setAttribute("data-world", String(world.id));
        button(footer, "map", t("backToMap"));
        button(footer, "start", t("start"), "gr-primary");
      });
    },

    /** The card of a bonus before it starts. view: { id, story, how, best, hasSave }. */
    bonusIntro(view) {
      const words = bonusText(view.id);
      worldPads = view.id === "orgman" ? ["maze"] : ["flippers"];
      screen("intro", t(words.name), (body, footer) => {
        element("div", "gr-logo gr-logo--happy", body).innerHTML = GUINEA_ART;
        element("p", "", body, view.story);
        element("p", "gr-mode-line", body, t(words.one));
        if (view.how && view.how.length) {
          element("p", "gr-small-title", body, t("howToPlay"));
          const steps = element("ol", "gr-how", body);
          view.how.forEach((step) => element("li", "", steps, step));
        }
        const rule = element("div", "gr-rule", body);
        element("strong", "", rule, t("theRule"));
        element("span", "", rule, t(words.rule));
        if (view.id === "orgman") {
          keysHelp(body);
        }
        if (view.best > 0) {
          element("p", "gr-muted", body, t("best") + ": " + number(view.best));
        }
        button(body, "hof", t(words.see), "gr-small gr-hof-open").setAttribute("data-world", view.id);
        button(footer, "map", t("backToMap"));
        if (view.hasSave) {
          button(footer, "bonus-new", t("bonusNew"));
          button(footer, "bonus-resume", t("bonusResume"), "gr-primary");
        } else {
          button(footer, "bonus-new", t("start"), "gr-primary");
        }
      });
    },

    /** The end of a game of a bonus: result = { id, score, best, newBest, level, ms, and missions, notes (pinball) or admins (orgman) }. */
    bonusResult(result) {
      const words = bonusText(result.id);
      screen("done", t("bonusOverTitle"), (body, footer) => {
        element("div", "gr-logo gr-logo--happy", body).innerHTML = GUINEA_ART;
        element("p", "gr-score", body, t("score") + ": " + number(result.score));
        element("p", "gr-muted", body, result.newBest ? t("newBest") : t("best") + ": " + number(result.best));
        const list = element("ul", "gr-bonuses", body);
        const minutes = Math.max(1, Math.round(result.ms / 60000));
        if (result.id === "orgman") {
          element("li", "", list, t("orgLevelLine", { n: result.level, a: result.admins || 0, min: minutes }));
        } else {
          element("li", "", list, t("bonusLevelLine", { n: result.level, m: result.missions, min: minutes }));
        }
        if (result.notes > 0) {
          element("li", "", list, t("bonusNotesLine", { n: result.notes }));
        }
        hofPlace(body);
        const rule = element("div", "gr-rule", body);
        element("strong", "", rule, t("theRule"));
        element("span", "", rule, t(words.rule));
        button(body, "hof", t(words.see), "gr-small gr-hof-open").setAttribute("data-world", result.id);
        button(footer, "map", t("backToMap"));
        button(footer, "bonus-new", t("replay"), "gr-primary");
      });
    },

    /**
     * One more thing: bonuses are open. fromCredits: shown at the end of the
     * credits, else on the map. ids: the bonuses never shown before.
     */
    teaser(fromCredits, ids) {
      const list = ids && ids.length ? ids : ["pinball"];
      screen("credits", t("teaserTitle"), (body, footer) => {
        element("div", "gr-logo gr-logo--happy", body).innerHTML = GUINEA_ART;
        element("p", "gr-teaser", body, t(list.length > 1 ? "teaserBothBody" : list[0] === "orgman" ? "teaserOrgBody" : "teaserBody"));
        for (const id of list) {
          element("p", "gr-muted", body, t(bonusText(id).pitch));
        }
        button(footer, fromCredits ? "credits-card" : "map", t("teaserLater"));
        list.forEach((id, i) => {
          button(footer, "bonus", t(bonusText(id).play), i === list.length - 1 ? "gr-primary" : "").setAttribute("data-world", id);
        });
      });
    },

    /** The shared save of VS Code was edited by hand: everything starts again from zero. */
    saveRefused() {
      screen("credits", t("saveRefusedTitle"), (body, footer) => {
        element("div", "gr-logo gr-logo--sad", body).innerHTML = GUINEA_ART;
        element("p", "gr-teaser", body, t("saveRefusedBody"));
        button(footer, "map", t("saveRefusedOk"), "gr-primary");
      });
    },

    /** The pause card; drawing = { renderer, fps, tier } says how the game is drawn here. */
    paused(drawing) {
      screen("paused", t("paused"), (body, footer) => {
        keysHelp(body);
        if (drawing) {
          element("p", "gr-muted gr-drawing", body, t("drawnWith", { renderer: drawing.renderer, fps: drawing.fps, tier: t("tier" + drawing.tier) }));
        }
        button(footer, "map", t("backToMap"));
        button(footer, "resume", t("resume"), "gr-primary");
      });
    },

    /**
     * The first score of a player who never answered: a modal over the end
     * card, the score, a nickname and a guinea pig, then Join the Hall of Fame
     * or No thanks. view: as profileForm. score: the score just made.
     */
    joinOffer(view, score) {
      if (!hofBox || !hofBox.isConnected) {
        return;
      }
      closeJoin();
      const node = element("div", "gr-join", overlay);
      node.setAttribute("role", "dialog");
      node.setAttribute("aria-modal", "true");
      node.setAttribute("aria-labelledby", "gr-join-title");
      const card = element("div", "gr-join-card", node);
      element("div", "gr-logo gr-logo--happy", card).innerHTML = GUINEA_ART;
      element("h2", "gr-join-title", card, t("hofFirstScoreTitle")).id = "gr-join-title";
      if (score > 0) {
        const line = element("p", "gr-join-score", card);
        element("span", "gr-join-score-label", line, t("score"));
        element("strong", "", line, number(score));
      }
      const form = element("div", "gr-hof-invite gr-join-form", card);
      profileForm(
        form,
        Object.assign({}, view, {
          joinTitle: t("hofJoinCallTitle"),
          joinText: t("hofJoinCallText"),
          joinLabel: t("hofJoinCta"),
          onDone: joinAnswered
        }),
        true
      );
      joinModal = node;
      // A phone keeps its keyboard down until the player taps the box: it would hide the card
      const first = touch ? form.querySelector(".gr-hof-save") : form.querySelector(".gr-hof-field input");
      if (first) {
        first.focus({ preventScroll: true });
      }
    },

    /** True while the join modal is on screen. */
    joinOpen() {
      return Boolean(joinModal);
    },

    /** Escape on the join modal: No thanks. */
    skipJoin() {
      const skip = joinModal && joinModal.querySelector(".gr-hof-skip");
      if (skip) {
        skip.click();
      } else {
        closeJoin();
      }
    },

    /** One line on the end card on screen: "sent" (the score is on the board) or "later" (it waits for the network). */
    hofStatus(kind) {
      if (!hofBox || !hofBox.isConnected || hofBox.classList.contains("gr-hof-join")) {
        return;
      }
      hofBox.textContent = "";
      hofBox.hidden = false;
      element("span", "gr-hof-status", hofBox, t(kind === "sent" ? "hofSentLine" : "hofLaterLine"));
    },

    /** True while the map or an end card shows the install box. */
    hasInstallBox() {
      return !panel.hidden && Boolean(panel.querySelector(".gr-install"));
    },

    /** The install offer changed (the browser offered it late, the box was answered, the game got installed). */
    refreshInstall(install) {
      const box = panel.querySelector(".gr-install");
      if (box) {
        fillInstall(box, install);
      }
    },

    /** After a world: result = { ok, world, score, best, newBest, stars, tip, hasNext }. */
    result(result) {
      const world = result.world;
      screen(result.ok ? "done" : "failed", result.ok ? t("worldDone") : t("worldFailed"), (body, footer) => {
        element("div", "gr-logo" + (result.ok ? " gr-logo--happy" : " gr-logo--sad"), body).innerHTML = GUINEA_ART;
        if (result.ok) {
          element("p", "gr-result-stars", body, starsText(result.stars));
          element("p", "gr-score", body, t("score") + ": " + result.score);
          if (result.bonuses && result.bonuses.length) {
            const list = element("ul", "gr-bonuses", body);
            for (const bonus of result.bonuses) {
              element("li", bonus.key === "speedLine" ? "gr-speed" : "", list, t(bonus.key, bonus));
            }
          }
          element("p", "gr-muted", body, result.newBest ? t("newBest") : t("best") + ": " + result.best);
          if (result.missed) {
            const missed = element("div", "gr-rule gr-rule--info", body);
            element("strong", "", missed, t("goodToKnow"));
            element("span", "", missed, result.missed);
          }
          hofPlace(body);
          button(body, "hof", t("hofSeeWorld"), "gr-small gr-hof-open").setAttribute("data-world", String(world.id));
          if (result.install) {
            installBox(body, result.install);
          }
          const rule = element("div", "gr-rule", body);
          element("strong", "", rule, t("theRule"));
          element("span", "", rule, t("w" + world.id + "_rule"));
        } else if (result.tip) {
          const tip = element("div", "gr-rule gr-rule--tip", body);
          element("strong", "", tip, t("inRealLife"));
          element("span", "", tip, result.tip);
        }
        element("p", "gr-small-title", body, t("labs"));
        labLinks(body, world.labs);
        button(footer, "map", t("backToMap"));
        if (result.ok && result.hasNext) {
          button(footer, "next", t("nextWorld"), "gr-primary");
        } else {
          button(footer, "start", result.ok ? t("replay") : t("retry"), "gr-primary");
        }
      });
    },

    /**
     * The Hall of Fame. view: { tab ("all", a world id, "pinball" or "orgman"),
     * from (the world whose card opened it, or null), loading, list (the
     * board, best first), ok, rank ({ rank, players } of the player on it, or
     * null), online, testLink, profile, onSave, onForget (see profileForm) }.
     */
    hallOfFame(view) {
      screen(
        "hof",
        t("hofTitle"),
        (body, footer) => {
          const tabs = element("div", "gr-hof-tabs gr-scroll", body);
          tabs.setAttribute("role", "tablist");
          for (const tab of ["all"].concat(WORLDS.map((w) => w.id), BONUSES.map((b) => b.id))) {
            const bonus = BONUS_TEXT[tab];
            const label = tab === "all" ? t("hofGeneral") : bonus ? t(bonus.name) : t("w" + tab + "_name");
            const short = tab === "all" ? t("hofAllTab") : bonus ? t(bonus.tab) : String(tab);
            const node = button(tabs, "hof-tab", label, "gr-small" + (tab === view.tab ? " is-active" : ""), short);
            node.setAttribute("data-tab", String(tab));
            node.setAttribute("role", "tab");
            node.setAttribute("aria-selected", String(tab === view.tab));
          }
          element("p", "gr-small-title", body, view.tab === "all" ? t("hofGeneralTitle") : BONUS_TEXT[view.tab] ? t(BONUS_TEXT[view.tab].title) : t("world", { n: view.tab }) + " · " + t("w" + view.tab + "_name"));
          if (view.loading) {
            element("p", "gr-muted", body, t("hofLoading"));
          } else {
            hofList(body, view);
          }
          hofProfile(body, view);
          if (view.from === null || view.from === undefined) {
            button(footer, "map", t("backToMap"), "gr-primary");
          } else {
            button(footer, "map", t("backToMap"));
            button(footer, "play", t("hofBackToWorld"), "gr-primary").setAttribute("data-world", String(view.from));
          }
        },
        true
      );
      const active = panel.querySelector(".gr-hof-tabs .is-active");
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    },

    /** The end of the game, after the last world: the credits roll, then the final card. */
    credits(earned, result) {
      creditsArgs = [earned, result];
      rollCredits();
    },

    /** The credits roll again, from the final card. */
    creditsRoll() {
      if (creditsArgs) {
        rollCredits();
      }
    },

    /** From the roll to the final card: Skip, Continue. */
    creditsCard() {
      if (creditsArgs) {
        creditsCard(creditsArgs[0], creditsArgs[1]);
      }
    },

    playing() {
      overlay.setAttribute("data-state", "playing");
      panel.hidden = true;
      panel.replaceChildren();
      overlay.focus({ preventScroll: true });
      if (pendingCoach) {
        const [text, ms] = pendingCoach;
        pendingCoach = null;
        hud.coach(text, ms);
      }
    },

    /** Which pads a world uses, e.g. ["left", "right", "jump", "duck"]. */
    setPads(list) {
      for (const [name, node] of Object.entries(pads)) {
        node.hidden = !list.includes(name);
      }
    },

    /** The branches of a runner, as a Path: steps and the current index. */
    setPath(steps, current) {
      path.replaceChildren();
      path.hidden = !steps || !steps.length;
      (steps || []).forEach((name, i) => {
        const step = element("li", i < current ? "is-done" : i === current ? "is-current" : "", path);
        element("span", "", step, name);
      });
    },

    /** Free HTML under the top bar, for a world's own meter or checklist. */
    get extra() {
      return extra;
    },

    update(state) {
      const key = [state.world, state.score, state.attempts, state.maxAttempts, state.label].join("|");
      if (key === lastUpdate) {
        return;
      }
      lastUpdate = key;
      worldPill.textContent = state.world;
      score.textContent = t("score") + ": " + state.score;
      // The bonus table counts balls, not hearts
      attempts.textContent = state.label !== undefined ? state.label : "❤".repeat(Math.max(state.attempts, 0)) + "♡".repeat(Math.max((state.maxAttempts || 3) - state.attempts, 0));
    },

    setBadges(earned) {
      for (const level of [1, 2, 3]) {
        slots[level - 1].classList.toggle("is-earned", earned.includes(level));
      }
    },

    setMuted(muted) {
      muteButton.textContent = muted ? "✕" : "♪";
      muteButton.classList.toggle("is-muted", muted);
      muteButton.setAttribute("aria-label", muted ? t("unmute") : t("mute"));
      muteButton.title = muted ? t("unmute") : t("mute");
    },

    toast(text, tone) {
      // A short reward ("Both kept x3") never pushes out a longer toast still being
      // read; anything else waits its turn (the newest only). A short toast
      // holds for a second, a longer one for its reading time.
      const now = performance.now();
      const long = String(text).length >= 36;
      const current = String(toast.textContent);
      if (now < toastReadUntil && current !== text) {
        if (!long && current.length >= 36) {
          return;
        }
        window.clearTimeout(toastPending);
        toastPending = window.setTimeout(() => {
          toastReadUntil = 0;
          hud.toast(text, tone);
        }, toastReadUntil - now);
        return;
      }
      toastReadUntil = now + (long ? readingMs(text, "call") : Math.min(readingMs(text, "call"), 1000));
      toast.textContent = text;
      toast.className = "gr-toast gr-toast--show" + (tone ? " gr-toast--" + tone : "");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.className = "gr-toast";
      }, Math.max(1800, readingMs(text, "call")));
    },

    /** The goal line under the top bar; an empty text hides it. */
    goal(text) {
      goalValue = text || "";
      if (coaching) {
        return;
      }
      goalText.textContent = goalValue;
      goal.hidden = !text;
      if (text && !reduced) {
        goal.classList.remove("is-new");
        void goal.offsetWidth;
        goal.classList.add("is-new");
      }
    },

    /** Why that was wrong: a tip box for a few seconds, after a mistake. */
    tip(text, ms, heading) {
      const wait = tipReadUntil - performance.now();
      if (wait > 0 && tipBar.classList.contains("is-shown") && tipText.textContent !== text) {
        window.clearTimeout(tipPending);
        tipPending = window.setTimeout(() => hud.tip(text, ms, heading), wait);
        return;
      }
      window.clearTimeout(tipTimer);
      // On a phone the toast hides behind the tip: the tip says what went wrong
      tipTitle.textContent = narrow.matches && heading ? heading : t("tipTitle");
      tipText.textContent = text;
      tipBar.classList.add("is-shown");
      const read = Math.max(4000, readingMs(text));
      tipReadUntil = performance.now() + Math.min(read, 11000);
      tipTimer = window.setTimeout(() => tipBar.classList.remove("is-shown"), Math.max(ms || 0, read));
    },

    /** A good move: the tip of the last mistake is no longer the point, once it had time to be read. */
    hideTip() {
      window.clearTimeout(tipTimer);
      const left = tipReadUntil - performance.now();
      if (left > 0) {
        tipTimer = window.setTimeout(() => tipBar.classList.remove("is-shown"), left);
        return;
      }
      tipBar.classList.remove("is-shown");
    },

    /** A big instruction in the middle of the screen, for a few seconds. */
    coach(text, ms) {
      // Said before the world starts: kept for the moment it does
      if (overlay.getAttribute("data-state") !== "playing") {
        pendingCoach = [text, ms];
        return;
      }
      // The line on screen is read first: the newest line waits, older waiting ones are dropped
      const wait = coachReadUntil - performance.now();
      if (wait > 0 && coachLast !== text) {
        window.clearTimeout(coachPending);
        coachPending = window.setTimeout(() => hud.coach(text, ms), wait);
        return;
      }
      coachLast = text;
      // Until painted, at most the longest guard (the paint refreshes it)
      coachReadUntil = performance.now() + 3900;
      window.clearTimeout(coachTimer);
      // A phone keeps the middle of the screen for what is coming: the coach
      // speaks in the goal line for a moment, then the goal comes back
      if (narrow.matches) {
        coaching = true;
        goal.hidden = false;
        goal.classList.add("is-coach");
        goalText.textContent = text;
        const seq = ++coachSeq;
        afterPaint(() => {
          if (seq !== coachSeq) {
            return;
          }
          coachReadUntil = performance.now() + Math.min(readingMs(text, "call"), 3400);
          coachTimer = window.setTimeout(() => {
            coaching = false;
            goal.classList.remove("is-coach");
            goalText.textContent = goalValue;
            goal.hidden = !goalValue;
          }, Math.max(ms || 2200, readingMs(text, "call")));
        });
        return;
      }
      coach.textContent = text;
      coach.classList.remove("is-shown");
      void coach.offsetWidth;
      coach.classList.add("is-shown");
      // The time to read starts once the line is on screen: the first frames of a world can stall
      const seq = ++coachSeq;
      afterPaint(() => {
        if (seq !== coachSeq) {
          return;
        }
        coachReadUntil = performance.now() + Math.min(readingMs(text, "call"), 3400);
        coachTimer = window.setTimeout(() => coach.classList.remove("is-shown"), Math.max(ms || 2000, readingMs(text, "call")));
      });
    },

    /**
     * A message from the cast, as a Lightning chat bubble. Two at most on
     * screen: a third one waits until the oldest has been read. who: a name
     * of the cast, or { name, faceUrl, color } for someone outside it.
     */
    chat(who, text, ms) {
      const life = chatLife(text, ms);
      // Lines already waiting go first
      if (chatQueue.length) {
        if (chatQueue.length >= 4) {
          chatQueue.shift();
        }
        chatQueue.push([who, text, ms]);
        return;
      }
      const wait = chatWait();
      if (wait > 0) {
        chatQueue.push([who, text, ms]);
        window.setTimeout(nextChat, wait);
        return;
      }
      showChat(who, text, life);
    },


    /** Victor's note, found: a sticky note that pops up for a moment. */
    note(text) {
      const card = element("div", "gr-note", overlay);
      element("strong", "", card, t("noteFoundTitle"));
      element("span", "", card, text);
      const life = Math.max(4000, readingMs(text));
      window.setTimeout(() => card.classList.add("is-leaving"), life - 400);
      window.setTimeout(() => card.remove(), life);
    },

    /** One line of a deployment log, at the bottom left. */
    tick(line) {
      const row = element("div", "gr-tick", ticker, line);
      while (ticker.children.length > 4) {
        ticker.firstChild.remove();
      }
      // A log line fades after a while, so it never covers a world for good
      window.setTimeout(() => row.classList.add("is-leaving"), 7600);
      window.setTimeout(() => row.remove(), 8000);
    },

    clearTicker() {
      ticker.replaceChildren();
    },

    clearWorldUi() {
      layer.replaceChildren();
      extra.replaceChildren();
      ticker.replaceChildren();
      chat.replaceChildren();
      chatQueue.length = 0;
      tipReadUntil = 0;
      window.clearTimeout(tipPending);
      window.clearTimeout(coachPending);
      coachReadUntil = 0;
      coachLast = "";
      coachSeq++;
      toastReadUntil = 0;
      window.clearTimeout(toastPending);
      hud.goal("");
      coach.classList.remove("is-shown");
      pendingCoach = null;
      window.clearTimeout(coachTimer);
      coaching = false;
      goal.classList.remove("is-coach");
      goalText.textContent = "";
      goal.hidden = true;
      tipBar.classList.remove("is-shown");
      hud.setPath([], 0);
      lastUpdate = "";
    },

    /** A level is done: the Cloudity logo, then its badge spins in and flies to the shelf. */
    celebrate(level, done) {
      overlay.setAttribute("data-state", "celebrating");
      const node = element("div", "gr-celebrate", overlay);
      node.setAttribute("data-action", "skip");
      node.setAttribute("role", "status");
      if (!reduced) {
        const confetti = element("div", "gr-confetti", node);
        const colors = ["#0176D3", "#9050E9", "#2E844A", "#FE9339", "#FFB020", "#EA001E", "#06A59A"];
        for (let i = 0; i < 44; i++) {
          const piece = element("i", "", confetti);
          piece.style.left = Math.random() * 100 + "%";
          piece.style.background = colors[i % colors.length];
          piece.style.animationDelay = Math.random() * 0.8 + "s";
          piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
          piece.style.setProperty("--gr-drift", (Math.random() - 0.5) * 160 + "px");
          piece.style.setProperty("--gr-spin", Math.random() * 900 + "deg");
        }
      }
      const card = element("div", "gr-cel-card", node);
      const brand = element("div", "gr-cel-brand", card);
      image(brand, "gr-cel-logo", options.logoUrl, "Cloudity");
      element("p", "gr-cel-level", card, t("levelComplete", { level }));
      const holder = element("div", "gr-cel-badge", card);
      const badge = image(holder, "", options.badgeUrl(level), BADGE_NAMES[level]);
      element("span", "gr-shine", holder);
      element("p", "gr-cel-earned", card, t("badgeEarned"));
      element("p", "gr-cel-name", card, BADGE_NAMES[level]);
      element("p", "gr-cel-hint", card, touch ? t("tapToContinue") : t("pressToContinue"));
      celebration = { node, badge, level, done, leaving: false, timer: window.setTimeout(finishCelebration, CELEBRATION_MS) };
    },

    skipCelebration() {
      finishCelebration();
    },

    dispose() {
      closeJoin();
      window.clearTimeout(toastTimer);
      if (celebration) {
        window.clearTimeout(celebration.timer);
      }
      overlay.remove();
    }
  };
  return hud;
}
