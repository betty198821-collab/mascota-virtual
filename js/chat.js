// ---------- configuración ----------
const IDLE_LIMIT_MS = 2 * 60 * 1000; // 2 minutos
const TALKING_DELAY_MIN_MS = 500;
const TALKING_DELAY_MAX_MS = 1200;

// ---------- estado ----------
const selectedKey = localStorage.getItem('selectedPet') || 'error404';
const pet = PETS[selectedKey];

const STORAGE_MESSAGES = `chat_messages_${selectedKey}`;
const STORAGE_STATE = `chat_state_${selectedKey}`;

const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const petImage = document.getElementById('petImage');
const petFallback = document.getElementById('petFallback');
const resetBtn = document.getElementById('resetBtn');
const petTitleEl = document.getElementById('petTitle');
const petStatusEl = document.getElementById('petStatus');
const verityCounterEl = document.getElementById('verityCounter');
const verityAudio = document.getElementById('verityAudio');
const sendBtn = document.getElementById('sendBtn');
const soundBtn = document.getElementById('soundBtn');
const voiceBtn = document.getElementById('voiceBtn');

let idleTimer = null;
let verityCounterTicker = null;
let standCycleInterval = null;
let currentMode = isVerityModeActive() ? 'verity' : 'normal';
let currentLang = getSiteLang();
let lastExpression = 'neutral';

// las 3 imágenes de la animación de "el Stand sale" (transparente -> semi -> completo)
// y las 3 que usa después, de vez en cuando, mientras el Stand sigue activo
const STAND_REVEAL_FRAMES = [
  'images/error404_stand_fade1.png',
  'images/error404_stand_fade2.png',
  'images/error404_stand_fade3.png',
];
const STAND_COLOR_FRAMES = [
  'images/error404_stand_fade3.png', // color base
  'images/error404_stand_blue.png',
  'images/error404_stand_red.png',
];
const STAND_REVEAL_DURATION_MS = 2500;

// animación de "se abre la cremallera de la boca" (3 imágenes, ~1.5 segundos)
const UNZIP_FRAMES = [
  'images/error404_unzip1.png',
  'images/error404_unzip2.png',
  'images/error404_unzip3.png',
];
const UNZIP_DURATION_MS = 1500;

// estado conversacional (se guarda junto a los mensajes)
let state = loadState();

// ---------- persistencia ----------
function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMessage(entry) {
  const current = loadMessages() || [];
  current.push(entry);
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(current));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_STATE);
    return raw ? JSON.parse(raw) : { awaitingAge: false, userAge: null };
  } catch {
    return { awaitingAge: false, userAge: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_STATE, JSON.stringify(state));
}

// ---------- helpers de UI ----------
function addMessage(text, sender, extraClass = '', persist = true) {
  const bubble = document.createElement('div');
  bubble.classList.add('msg', sender);
  if (extraClass) bubble.classList.add(extraClass);
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (persist) saveMessage({ text, sender, extraClass });
}

// agrega un mensaje del bot, traduciéndolo primero si el modo inglés está activo
function addPetMessage(text, extraClass = '') {
  const shown = translateOutbound(text, currentLang);
  addMessage(shown, 'pet', extraClass);
  playMessageSound();
  if (!state.mouthZipped) speakMessage(shown, currentLang); // con la boca cerrada no habla
}

function setExpression(expression) {
  // "stand_reveal" es un valor especial: dispara la animación en vez de
  // poner una sola imagen fija
  if (expression === 'stand_reveal') {
    lastExpression = 'stand_reveal';
    playStandReveal();
    return;
  }

  // cualquier otra expresión corta el ciclo de colores del Stand, si estaba activo
  clearInterval(standCycleInterval);

  // "unzip_animation": se abre la cremallera y después vuelve a la cara neutral
  if (expression === 'unzip_animation') {
    lastExpression = 'neutral';
    playUnzip();
    return;
  }

  lastExpression = expression;
  // mientras el modo JoJo está activo, la cara "de reposo" (neutral) es la cara JoJo
  const effectiveExpression = (expression === 'neutral' && state.jojoMode) ? 'jojo' : expression;
  const src = pet.images[effectiveExpression] || pet.images.neutral;
  petImage.src = src;
}

// animación de 2.5s: el Stand aparece de transparente a totalmente visible
// en 3 pasos, y después queda cambiando de color de vez en cuando
function playStandReveal() {
  clearInterval(standCycleInterval);
  const stepMs = STAND_REVEAL_DURATION_MS / STAND_REVEAL_FRAMES.length;

  STAND_REVEAL_FRAMES.forEach((src, i) => {
    setTimeout(() => { petImage.src = src; }, Math.round(stepMs * i));
  });

  setTimeout(() => {
    standCycleInterval = setInterval(() => {
      const i = Math.floor(Math.random() * STAND_COLOR_FRAMES.length);
      petImage.src = STAND_COLOR_FRAMES[i];
    }, 6000);
  }, STAND_REVEAL_DURATION_MS);
}

function playUnzip() {
  const stepMs = UNZIP_DURATION_MS / UNZIP_FRAMES.length;
  UNZIP_FRAMES.forEach((src, i) => {
    setTimeout(() => { petImage.src = src; }, Math.round(stepMs * i));
  });
  setTimeout(() => setExpression('neutral'), UNZIP_DURATION_MS);
}

function ui() {
  return UI_STRINGS[currentLang];
}

function refreshAudioButtons() {
  soundBtn.textContent = isSoundOn() ? ui().soundOn : ui().soundOff;
  voiceBtn.textContent = isVoiceOn() ? ui().voiceOn : ui().voiceOff;
}

function statusText() {
  return state.userName ? ui().talkingWith(state.userName) : ui().defaultStatus;
}

// hh:mm:ss con ceros a la izquierda, para el cronómetro
function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// solo muestra un cronómetro en vivo mientras está "seco" con el tema Verity;
// sin frase ni emoji, y tickeando cada segundo con setInterval
function updateVerityCounter() {
  if (!verityCounterEl) return;
  clearInterval(verityCounterTicker);

  const tick = () => {
    const now = Date.now();
    if (state.verityCooldownUntil && now < state.verityCooldownUntil) {
      verityCounterEl.textContent = formatCountdown(state.verityCooldownUntil - now);
    } else {
      verityCounterEl.textContent = '';
      clearInterval(verityCounterTicker);
    }
  };

  tick();
  if (state.verityCooldownUntil && Date.now() < state.verityCooldownUntil) {
    verityCounterTicker = setInterval(tick, 1000);
  }
}

// aplica (o quita) el disfraz visual/sonoro de Verity
function applyMode(mode) {
  currentMode = mode;
  setVerityModeActive(mode === 'verity');

  if (mode === 'verity') {
    petImage.src = VERITY_INFO.face;
    petFallback.textContent = 'V';
    petTitleEl.textContent = VERITY_INFO.name;
    petStatusEl.textContent = ui().verityModeStatus;
    chatInput.placeholder = ui().inputPlaceholder(VERITY_INFO.name);

    verityAudio.currentTime = 0;
    const playPromise = verityAudio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // el navegador bloqueó el autoplay; se reintenta con el próximo click
        document.addEventListener('click', () => verityAudio.play().catch(() => {}), { once: true });
      });
    }
  } else {
    verityAudio.pause();
    verityAudio.currentTime = 0;
    petFallback.textContent = '404';
    petTitleEl.textContent = pet.name;
    petStatusEl.textContent = statusText();
    chatInput.placeholder = ui().inputPlaceholder(pet.name);
    setExpression(lastExpression || 'neutral');
  }
}

// aplica el idioma actual a todos los textos fijos de la interfaz
function applyLangToUI() {
  sendBtn.textContent = ui().sendButton;
  resetBtn.textContent = ui().resetButton;
  refreshAudioButtons();
  if (currentMode !== 'verity') {
    chatInput.placeholder = ui().inputPlaceholder(pet.name);
    petStatusEl.textContent = statusText();
  }
}

petImage.addEventListener('error', () => {
  petImage.style.display = 'none';
  petFallback.style.display = 'flex';
});
petImage.addEventListener('load', () => {
  petImage.style.display = 'block';
  petFallback.style.display = 'none';
});

// ---------- temporizador de inactividad ----------
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(triggerCheckIn, IDLE_LIMIT_MS);
}

function triggerCheckIn() {
  // Verity y la boca cerrada no pueden hablar
  if (currentMode === 'verity' || state.mouthZipped) { resetIdleTimer(); return; }

  state.idleStreak = (state.idleStreak || 0) + 1;
  if (state.idleStreak > 3) { resetIdleTimer(); return; } // no insiste más hasta que vuelvas a escribir

  const crisis = crisisIdleLine(state);
  if (crisis) {
    // si hace poco contaste algo muy serio, no lo deja pasar
    addPetMessage(crisis.text, 'checkin');
    setExpression('worried');
  } else if (state.idleStreak === 1) {
    // primer silencio: algo tranquilo, sin alarmar
    addPetMessage(pickNoRepeat(pet.casualIdleMessages, state, 'idle1'));
    setExpression('talking');
  } else {
    // el silencio sigue: recién ahora pregunta si estás bien
    addPetMessage(pickNoRepeat(pet.checkInMessages, state, 'idle2'), 'checkin');
    setExpression('worried');
  }
  saveState();
  resetIdleTimer();
}

// muestra una respuesta ya decidida (moderación, cambio brusco de tema) con la
// misma pausa de "pensando" que las demás
function deliverReply(result) {
  // al abrirse la cremallera arranca YA la animación unzip (sin pasar antes por la cara "talking")
  const unzipping = result.expression === 'unzip_animation';
  if (unzipping) setExpression('unzip_animation');
  else if (!result.muffled) setExpression('talking');
  const delay = result.muffled
    ? 250
    : TALKING_DELAY_MIN_MS + Math.random() * (TALKING_DELAY_MAX_MS - TALKING_DELAY_MIN_MS);
  setTimeout(() => {
    saveState();
    updateVerityCounter();
    addPetMessage(result.text);
    if (!unzipping) setExpression(result.expression); // la animación ya está corriendo y termina sola en neutral
  }, delay);
}

// ---------- envío de mensajes ----------
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  state.idleStreak = 0; // volviste a escribir, se corta la racha de silencio

  // COMPRENSIÓN EN INGLÉS (understand-en.js): solo cuando el idioma elegido es inglés,
  // lo que escribís se traduce al español que entiende el cerebro. En español no cambia nada.
  // brainText = lo que lee el cerebro; text = lo que escribiste de verdad.
  const brainText = (currentLang === 'en' && typeof translateInbound === 'function')
    ? translateInbound(text, 'en')
    : text;
  state.rawCurrent = currentLang === 'en' ? text : undefined; // para citar tus palabras originales

  // 1. ¿es una orden de cambiar de idioma? se procesa siempre, en cualquier modo
  const langCommand = detectLangCommand(text);
  if (langCommand) {
    addMessage(text, 'user');
    chatInput.value = '';
    resetIdleTimer();
    currentLang = langCommand;
    setSiteLang(langCommand);
    applyLangToUI();
    return;
  }

  // 2. ¿es una orden de cambio de modo Verity? también siempre se procesa
  let modeCommand = detectModeCommand(brainText) || detectModeCommand(text);
  // "modo normal" y "cambia de modo" solo importan si Verity está activo;
  // si no, se los dejamos al cerebro (por ejemplo para salir del modo JoJo)
  if ((modeCommand === 'normal' || modeCommand === 'toggle') && currentMode !== 'verity') modeCommand = null;
  if (modeCommand) {
    addMessage(text, 'user');
    chatInput.value = '';
    resetIdleTimer();
    let target = modeCommand;
    if (modeCommand === 'toggle') target = currentMode === 'verity' ? 'normal' : 'verity';
    // "modo normal" es la llave universal: si además tenía la boca cerrada, también se abre
    if (target === 'normal' && state.mouthZipped) {
      state.mouthZipped = false;
      state.jojoMode = false;
      applyMode('normal');
      deliverReply({ text: pickNoRepeat(UNZIP_LINES, state, 'unzip').es, expression: 'unzip_animation' });
      return;
    }
    // durante un tema serio no se puede activar Verity (ni ningún otro modo)
    if (target === 'verity' && isSeriousContextActive(state)) {
      deliverReply(modeBlockedReply(state, 'verity'));
      return;
    }
    applyMode(target);
    return;
  }

  addMessage(text, 'user');
  chatInput.value = '';
  resetIdleTimer();

  // SEGURIDAD: si aparece autolesión o ganas de no vivir, se sale del modo Verity
  // (que no responde nada) para poder acompañar a la persona
  if (currentMode === 'verity' && (detectCrisis(text) || detectCrisis(brainText))) applyMode('normal');

  // en modo Verity no responde nada más, se queda solo con la cara puesta
  if (currentMode === 'verity') return;

  // cremallera en la boca: solo hace ruidos ahogados (y se abre sola ante una crisis)
  const zipResult = handleZipper(brainText, state);
  if (zipResult) { deliverReply(zipResult); return; }

  // 1) moderación: contenido sexual o +18 (en cualquier idioma) se corrige y NO se guarda
  const modResult = moderateMessage(text, state);
  if (modResult) { deliverReply(modResult); return; }

  // 2) memoria: se guarda el mensaje para poder recordarlo después
  rememberUserMessage(state, brainText, text);

  // 3) cambio brusco de tema justo después de algo serio
  const shiftResult = checkAbruptShift(brainText, state);
  if (shiftResult) { deliverReply(shiftResult); return; }

  setExpression('talking'); // "pensando" mientras formula la respuesta o busca en internet

  const delay = TALKING_DELAY_MIN_MS + Math.random() * (TALKING_DELAY_MAX_MS - TALKING_DELAY_MIN_MS);

  // las crisis nunca van a una búsqueda web: las atiende el cerebro directamente
  let webResult = null;
  if (!detectCrisis(text) && !detectCrisis(brainText)) {
    try {
      webResult = await checkWebIntents(brainText, state);
    } catch {
      webResult = null;
    }
  }

  if (webResult) {
    state.awaitingReturn = false;
    saveState();
    updateVerityCounter();
    addPetMessage(webResult.text);
    setExpression(webResult.expression);
    return;
  }

  setTimeout(() => {
    const { text: replyText, expression } = pet.reply(brainText, state);
    saveState();
    updateVerityCounter();
    addPetMessage(replyText);
    setExpression(expression);
  }, delay);
});

// ---------- reinicio ----------
resetBtn.addEventListener('click', () => {
  if (!confirm(ui().resetConfirm)) return;
  localStorage.removeItem(STORAGE_MESSAGES);
  localStorage.removeItem(STORAGE_STATE);
  state = { awaitingAge: false, userAge: null };
  lastExpression = 'neutral';
  chatWindow.innerHTML = '';
  clearTimeout(idleTimer);
  applyMode(currentMode); // mantiene el modo actual (normal o Verity) pero limpia el chat
  updateVerityCounter();
  if (currentMode !== 'verity') addPetMessage(pet.greeting);
  resetIdleTimer();
});

// ---------- inicio ----------
function init() {
  document.title = `${pet.name} — Chat`;
  sendBtn.textContent = ui().sendButton;
  resetBtn.textContent = ui().resetButton;

  getSiteOpenedAt(); // empieza a contar el tiempo de la pestaña
  if (state.mouthZipped) lastExpression = 'zipped';
  refreshAudioButtons();
  soundBtn.addEventListener('click', () => { setSoundOn(!isSoundOn()); refreshAudioButtons(); if (isSoundOn()) playMessageSound(); });
  voiceBtn.addEventListener('click', () => {
    setVoiceOn(!isVoiceOn());
    refreshAudioButtons();
    if (isVoiceOn()) speakMessage(currentLang === 'en' ? 'voice on' : 'voz activada', currentLang);
  });

  const existing = loadMessages();
  if (existing && existing.length > 0) {
    existing.forEach(m => addMessage(m.text, m.sender, m.extraClass, false));
  } else if (currentMode !== 'verity') {
    addPetMessage(pet.greeting);
  }

  applyMode(currentMode);
  updateVerityCounter();
  resetIdleTimer();
}

init();
