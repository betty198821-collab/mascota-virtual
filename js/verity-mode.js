/*
  verity-mode.js
  --------------
  Modo especial: cuando está activo, la cara/nombre/descripción de
  Error 404 se reemplazan por los de Verity en todo el sitio (chat y
  menú de selección), no responde nada en el chat, y suena música de
  fondo. Se activa/desactiva escribiendo en el chat.

  Guardá tu música en audio/verity_theme.mp3 (el nombre exacto que
  aparece abajo en VERITY_INFO.music). Si no ponés el archivo, el
  modo funciona igual mudo, no rompe nada.
*/

const VERITY_MODE_KEY = 'verityModeActive'; // localStorage: 'true' o ausente

const VERITY_INFO = {
  name: 'Verity',
  description: 'Verity es una esfera flotante de color amarillo con una sonrisa misteriosa.',
  descriptionEn: 'Verity is a floating yellow sphere with a mysterious smile.',
  face: 'images/verity_face.png',
  music: 'audio/verity_theme.mp3',
};

function isVerityModeActive() {
  return localStorage.getItem(VERITY_MODE_KEY) === 'true';
}

function setVerityModeActive(active) {
  localStorage.setItem(VERITY_MODE_KEY, active ? 'true' : 'false');
}

// Analiza un mensaje del chat y devuelve 'verity', 'normal', 'toggle' o null.
// Importante: decir solo "modo" NO activa nada. Hace falta nombrar el modo
// (verity / normal) o decir "cambia de modo". Los mensajes sobre el modo JoJo
// los maneja el cerebro (pet-brain.js), por eso acá se ignoran.
function detectModeCommand(rawText) {
  const t = rawText.toLowerCase();
  if (!t.includes('modo')) return null;
  if (t.includes('jojo')) return null;

  const mentionsVerity = t.includes('verity');
  const mentionsNormal = t.includes('normal') || t.includes('error 404') || t.includes('error404');
  const negation = /(^|\s)(sal|sali|salí|salir|desactiva|quita|apaga|fuera|termina)(\s|$)/.test(t);

  if (mentionsVerity && !negation) return 'verity';
  if (mentionsNormal || (mentionsVerity && negation)) return 'normal';
  if (/cambia(r)? de modo|otro modo/.test(t)) return 'toggle';
  return null;
}
