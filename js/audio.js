const AUDIO_PREF_SOUND = 'petSoundOn';
const AUDIO_PREF_VOICE = 'petVoiceOn';

function isSoundOn() { return localStorage.getItem(AUDIO_PREF_SOUND) !== 'false'; } // por defecto: sí
function isVoiceOn() { return localStorage.getItem(AUDIO_PREF_VOICE) === 'true'; }   // por defecto: no
function setSoundOn(on) { localStorage.setItem(AUDIO_PREF_SOUND, on ? 'true' : 'false'); }
function setVoiceOn(on) {
  localStorage.setItem(AUDIO_PREF_VOICE, on ? 'true' : 'false');
  if (!on && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

let _audioCtx = null;
function playMessageSound() {
  if (!isSoundOn()) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const t = _audioCtx.currentTime;
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.08);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch (e) {
    // el navegador bloqueó el audio (todavía no hubo interacción): no pasa nada
  }
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'en') return voices.find(v => /^en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
  return voices.find(v => /^es[-_](CO|MX|US|419)/i.test(v.lang))
    || voices.find(v => /^es/i.test(v.lang)) || null;
}

function speakMessage(text, lang) {
  if (!isVoiceOn() || !('speechSynthesis' in window)) return;
  const clean = text.replace(/https?:\/\/\S+/g, '').replace(/[«»"]/g, '').trim();
  if (!clean) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang === 'en' ? 'en-US' : 'es-ES';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.pitch = 0.7;  // grave
    u.rate = 0.92;  // un poco lento
    window.speechSynthesis.speak(u);
  } catch (e) {
    // sin voces disponibles: se ignora
  }
}

// Dice una frase de prueba aunque la voz esté desactivada (botón "Probar voz" del menú).
// En inglés usa una voz en inglés: así se comprueba que el audio también cambia de idioma.
function speakSample(text, lang) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'es-ES';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.pitch = 0.7;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
