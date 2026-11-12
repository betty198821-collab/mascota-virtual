/*
  menu.js
  -------
  El menú principal (index.html): botón "Empezar" -> select.html, botón
  "Configuración" -> panel con el idioma y las voces.

  Las dos opciones se guardan en el navegador (localStorage) y las usa TODO el sitio:
    - Idioma: getSiteLang() / setSiteLang()   (translate.js, clave 'siteLanguage')
    - Voces:  isVoiceOn()   / setVoiceOn()    (audio.js,     clave 'petVoiceOn')
  Son claves separadas, por eso la voz funciona igual en español y en inglés.
*/

const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const overlay = document.getElementById('settingsOverlay');
const closeBtn = document.getElementById('closeSettingsBtn');

function uiText() { return UI_STRINGS[getSiteLang()]; }

// ---------- textos según el idioma ----------
function applyMenuLang() {
  const u = uiText();
  document.documentElement.lang = getSiteLang();
  startBtn.textContent = u.menuStart;
  settingsBtn.textContent = u.menuSettings;
  document.getElementById('settingsTitle').textContent = u.settingsTitle;
  document.getElementById('langLabel').textContent = u.settingsLanguage;
  document.getElementById('langNote').textContent = u.settingsLanguageNote;
  document.getElementById('voiceLabel').textContent = u.settingsVoices;
  document.getElementById('voiceOnBtn').textContent = u.voicesOnBtn;
  document.getElementById('voiceOffBtn').textContent = u.voicesOffBtn;
  document.getElementById('voiceNote').textContent = u.voiceNote;
  closeBtn.textContent = u.settingsClose;
  document.getElementById('soundLabel').textContent = u.settingsSound;
  document.getElementById('soundOnBtn').textContent = u.soundOnBtn;
  document.getElementById('soundOffBtn').textContent = u.soundOffBtn;
  document.getElementById('testVoiceBtn').textContent = u.testVoice;
  refreshSettingButtons();
}

// marca cuál opción está activa
function refreshSettingButtons() {
  const lang = getSiteLang();
  document.querySelectorAll('[data-lang]').forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  const voice = isVoiceOn();
  document.querySelectorAll('[data-voice]').forEach(b => {
    const on = (b.dataset.voice === 'on') === voice;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  const sound = isSoundOn();
  document.querySelectorAll('[data-sound]').forEach(b => {
    const on = (b.dataset.sound === 'on') === sound;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
}

// ---------- abrir / cerrar el panel ----------
function openSettings() {
  overlay.hidden = false;
  refreshSettingButtons();
  closeBtn.focus();
}
function closeSettings() {
  overlay.hidden = true;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  settingsBtn.focus();
}

settingsBtn.addEventListener('click', openSettings);
closeBtn.addEventListener('click', closeSettings);
overlay.addEventListener('click', e => { if (e.target === overlay) closeSettings(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeSettings(); });

// ---------- idioma ----------
document.querySelectorAll('[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    setSiteLang(btn.dataset.lang);
    applyMenuLang();
    // si las voces están activadas, se escucha un ejemplo en el idioma nuevo
    if (isVoiceOn()) speakMessage(uiText().voiceSample, getSiteLang());
  });
});

// ---------- voces ----------
document.querySelectorAll('[data-voice]').forEach(btn => {
  btn.addEventListener('click', () => {
    setVoiceOn(btn.dataset.voice === 'on');
    refreshSettingButtons();
    if (isVoiceOn()) speakMessage(uiText().voiceSample, getSiteLang());
  });
});

// ---------- sonido de mensajes ----------
document.querySelectorAll('[data-sound]').forEach(btn => {
  btn.addEventListener('click', () => {
    setSoundOn(btn.dataset.sound === 'on');
    refreshSettingButtons();
    if (isSoundOn()) playMessageSound();
  });
});

// ---------- probar voz (suena aunque las voces estén desactivadas) ----------
document.getElementById('testVoiceBtn').addEventListener('click', () => speakSample(uiText().testVoiceText, getSiteLang()));

// ---------- empezar ----------
startBtn.addEventListener('click', () => { window.location.href = 'select.html'; });

// ---------- fondo: si todavía no pusiste la imagen, se muestra un título de respaldo ----------
(function checkBackground() {
  const candidates = ['images/menu_background.png', 'images/menu_banner.png', 'images/menu_background.jpg', 'images/menu_background.webp'];
  let pending = candidates.length;
  let found = false;
  candidates.forEach(src => {
    const img = new Image();
    img.onload = () => { found = true; pending--; };
    img.onerror = () => { pending--; if (pending === 0 && !found) document.body.classList.add('menu-no-bg'); };
    img.src = src;
  });
})();

applyMenuLang();
