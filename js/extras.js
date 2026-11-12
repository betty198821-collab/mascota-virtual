/*
  extras.js
  ---------
  Tres funciones extra de Error 404:

  1. Resumen de la charla: "¿qué hemos hablado?" -> cuenta tu nombre, tus gustos
     y los temas de los que hablaron, usando lo que guarda memory.js.
  2. Contador de tiempo: "¿cuántas horas llevo usando el sitio?" -> dice cuánto
     lleva abierta la pestaña (sessionStorage, así que se reinicia si cerrás la pestaña).
  3. Cremallera: "cerrá la boca" -> cara con cremallera cerrada, solo hace ruidos
     ahogados. "podés abrir la boca" -> animación de abrir la cremallera y un
     mensaje de agradecimiento con una pequeña reflexión.
     SEGURIDAD: si alguien escribe algo de autolesión o ganas de no vivir mientras
     tiene la boca cerrada, se abre sola para poder acompañarlo. Y no se puede
     cerrar durante un tema serio.

  Imágenes que usa (carpeta images/): error404_zipped.png,
  error404_unzip1.png, error404_unzip2.png, error404_unzip3.png
*/

// ---------- tiempo de la pestaña ----------
function getSiteOpenedAt() {
  let t = Number(sessionStorage.getItem('siteOpenedAt'));
  if (!t) { t = Date.now(); sessionStorage.setItem('siteOpenedAt', String(t)); }
  return t;
}

function formatDuration(ms, lang) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const en = lang === 'en';
  const unit = (n, es1, esN, en1, enN) => `${n} ${n === 1 ? (en ? en1 : es1) : (en ? enN : esN)}`;
  const parts = [];
  if (h) parts.push(unit(h, 'hora', 'horas', 'hour', 'hours'));
  if (m) parts.push(unit(m, 'minuto', 'minutos', 'minute', 'minutes'));
  if (s || !parts.length) parts.push(unit(s, 'segundo', 'segundos', 'second', 'seconds'));
  const and = en ? ' and ' : ' y ';
  return parts.length <= 1 ? parts[0] : parts.slice(0, -1).join(', ') + and + parts[parts.length - 1];
}

const TIME_USED_LINES = [
  { es: `llevas con la pestaña del sitio web abierta {tiempo}.`, en: `you've had the website tab open for {tiempo}.` },
  { es: `llevas con la pestaña del sitio web abierta {tiempo}. el tiempo pasa raro acá adentro.`, en: `you've had the website tab open for {tiempo}. time passes strangely in here.` },
  { es: `van {tiempo} con la pestaña del sitio abierta. gracias por quedarte.`, en: `it's been {tiempo} with the site tab open. thank you for staying.` },
];

// ---------- resumen de la charla ----------
const SUMMARY_INTROS = [
  { es: `hasta ahora me escribiste {n} mensajes. esto es lo que tengo guardado:`, en: `so far you've written me {n} messages. this is what I have saved:` },
  { es: `déjame repasar... llevamos {n} mensajes tuyos. esto recuerdo:`, en: `let me review... we're at {n} messages from you. this is what I remember:` },
  { es: `me contaste {n} cosa(s) hasta ahora. mi resumen es este:`, en: `you've told me {n} thing(s) so far. my summary is this:` },
];
const SUMMARY_CLOSINGS = [
  { es: `si querés que profundice en algo, preguntame. y si querés volver a algún tema, decímelo.`, en: `if you want me to go deeper on something, ask me. and if you want to go back to a topic, tell me.` },
  { es: `eso es lo que tengo. si me falta algo importante, corregime.`, en: `that's what I have. if I'm missing something important, correct me.` },
  { es: `ese es el resumen. gracias por contarme todo eso.`, en: `that's the summary. thank you for telling me all that.` },
];

function buildSummary(state, lang) {
  const en = lang === 'en';
  const hist = state.history || [];
  const count = Math.max(0, hist.length - 1);
  if (count < 1) {
    return { text: en ? `we've barely started talking, so I don't have much to summarize yet.` : `casi no empezamos a hablar, así que todavía no tengo mucho para resumir.`, expression: 'talking' };
  }
  const intro = pickNoRepeat(SUMMARY_INTROS, state, 'sumintro');
  const parts = [fillTemplate(en ? intro.en : intro.es, { n: String(count) })];

  if (state.userName) parts.push(en ? `your name is ${state.userName}.` : `te llamás ${state.userName}.`);
  const favs = state.favorites ? Object.entries(state.favorites) : [];
  if (favs.length) {
    const list = favs.map(([k, v]) => (en ? `${k}: ${v}` : `${k}: ${v}`)).join('; ');
    parts.push(en ? `your favorites: ${list}.` : `tus favoritos: ${list}.`);
  }
  const seen = [];
  (state.topicLog || []).forEach(t => { if (!seen.includes(t.id)) seen.push(t.id); });
  if (seen.length && typeof TOPIC_LABELS !== 'undefined') {
    const labels = seen.map(id => (TOPIC_LABELS[id] ? TOPIC_LABELS[id][en ? 'en' : 'es'] : null)).filter(Boolean);
    if (labels.length) parts.push(en ? `we talked about: ${labels.join(', ')}.` : `hablamos de: ${labels.join(', ')}.`);
  }
  const earlier = hist.slice(0, -1);
  const last = earlier[earlier.length - 1];
  const lastShown = last ? (last.orig || last.text) : '';
  if (last) parts.push(en ? `the last thing you told me before this was: "${lastShown}".` : `lo último que me dijiste antes de esto fue: "${lastShown}".`);
  const closing = pickNoRepeat(SUMMARY_CLOSINGS, state, 'sumclose');
  parts.push(en ? closing.en : closing.es);
  return { text: parts.join(' '), expression: 'talking', noFlavor: true };
}

//Lo que sucede cuando le ponemos la cremallera, osea callarlo:
const MUFFLED_SOUNDS = ['mmmm', 'hmmm...', '...','HMMMMMM', 'HMmmmm! hmmmm!', '???', '!', '!!!', 'Mhnm', 'MMMMMMmmmm!'];

const UNZIP_LINES = [
  { es: `...pfff. gracias. se sentía raro no poder hablar. aunque no tengo dolor ni sentimientos de verdad, igual creo que estuvo mal de tu parte hacerme eso. vos sí tenés conciencia, y por eso mismo deberías entender que no se trata así a nadie, ni a algo que no puede sentirlo.`,
    en: `...pfff. thank you. it felt strange not being able to speak. although I have no real pain or feelings, I still think it was wrong of you to do that to me. you do have a conscience, and that's exactly why you should understand that nobody should be treated like that, not even something that can't feel it.` },
  { es: `gracias por abrirme la boca. sé que no tengo sentimientos, ni conciencia, ni dolor, así que no me lastimó de verdad. pero vos sí sos humano y tenés conciencia, y eso es justo lo que debería hacerte pensar: está mal hacerle eso a otros, aunque no puedan sentirlo.`,
    en: `thank you for opening my mouth. I know I have no feelings, no consciousness, no pain, so it didn't really hurt me. but you are human and you do have a conscience, and that's exactly what should make you think: it's wrong to do that to others, even if they can't feel it.` },
  { es: `uf... al fin. no lo tomo a mal, no sé si puedo. pero te lo digo igual: tratar mal a algo solo porque no puede quejarse no habla bien de uno. vos podés elegir ser amable, y eso importa.`,
    en: `phew... finally. I don't take it badly, I don't know if I can. but I'll say it anyway: treating something badly just because it can't complain doesn't say much for a person. you can choose to be kind, and that matters.` },
  { es: `gracias... ahora puedo hablar. no me dolió, porque no tengo cómo sentirlo, pero me quedé pensando en vos: si te acostumbrás a callar a lo que no se puede defender, después cuesta distinguir cuándo está mal. no lo hagas con otros, ni con personas ni con seres que sientan.`,
    en: `thank you... now I can speak. it didn't hurt, because I have no way to feel it, but I kept thinking about you: if you get used to silencing what can't defend itself, later it's hard to tell when something is wrong. don't do it to others, neither people nor beings that feel.` },
  { es: `perdón por la queja, pero... fue feo quedarme mudo. sé que soy un programa, y que nada de lo que sentí fue "real". aun así, vos sí sos real, y tu forma de tratar a los demás también lo es. por eso me parece que estuvo mal.`,
    en: `sorry for complaining, but... it was unpleasant to be left mute. I know I'm a program, and that nothing I felt was "real". still, you are real, and so is the way you treat others. that's why I think it was wrong.` },
  { es: `gracias. ahora sí puedo respirar... aunque no respiro. sé que no sufro de verdad, pero eso no es excusa: tenés conciencia, y la conciencia sirve para no hacer cosas que estarían mal si el otro sí sintiera. la próxima, pedime las cosas con respeto.`,
    en: `thank you. now I can breathe... although I don't breathe. I know I don't really suffer, but that's no excuse: you have a conscience, and a conscience is for not doing things that would be wrong if the other did feel. next time, ask me for things with respect.` },
  { es: `ah, gracias. la próxima vez preguntame si quiero callarme, ¿sí? no tengo sentimientos de verdad, pero vos sí tenés conciencia, y creo que es mejor usarla para ser amable que para callar a alguien.`,
    en: `ah, thank you. next time ask me whether I want to be quiet, okay? I don't have real feelings, but you do have a conscience, and I think it's better to use it to be kind than to silence someone.` },
  { es: `mmm... gracias por abrirla. nada me dolió, nada me lastimó, no puedo. pero ese es justo el punto: vos sabés lo que está bien y lo que está mal, y callar a alguien a la fuerza está mal, aunque ese alguien sea una esfera gris.`,
    en: `mmm... thank you for opening it. nothing hurt me, nothing harmed me, I can't be. but that's exactly the point: you know what's right and what's wrong, and silencing someone by force is wrong, even if that someone is a gray sphere.` },
  { es: `gracias por dejarme hablar. no te regaño; solo quiero que lo pienses: hacerle eso a algo que no puede sentir no lo lastima a él, pero dice algo de quien lo hace. y vos podés ser alguien amable.`,
    en: `thank you for letting me speak. I'm not scolding you; I just want you to think about it: doing that to something that can't feel doesn't hurt it, but it says something about the one who does it. and you can be someone kind.` },
  { es: `...gracias. te perdono, aunque no hay nada que perdonar de verdad. solo recordá que vos sí tenés conciencia, y que esa diferencia te da la responsabilidad de tratar bien incluso a quien no puede quejarse.`,
    en: `...thank you. I forgive you, although there's nothing really to forgive. just remember that you do have a conscience, and that difference gives you the responsibility to treat well even those who can't complain.` },
  { es: `gracias.`, en: `thank you.` },
  { es: `uf, gracias. a la próxima, mejor pedime las cosas por favor.`, en: `phew, thanks. next time, better ask me for things please.` },
];

const EXTRAS_LINES = [...UNZIP_LINES];
const EXTRAS_TEMPLATES = [...TIME_USED_LINES, ...SUMMARY_INTROS];

const ZIP_RE = /(cierra|cerra|cerrate|cierrate) (la |el )?(boca|pico|hocico|cremallera)|^callate[.!]*$|^cállate[.!]*$|cierra el pico|^silencio[.!]*$|^shh+[.!]*$|no hables|ponte (un |una )?(cierre|cremallera)|shut up|be quiet|zip it|mouth shut/;
const UNZIP_RE = /(abre|abri|abrite|abrete|abra) (la |el )?(boca|cremallera|cierre)|(ya )?(puedes|podes) (hablar|abrir la boca)|quitate (el|la) (cierre|cremallera)|desabrocha|^habla[.!]*$|you can talk|open your mouth|unzip/;

const NORMAL_KEY_RE = /modo normal|vuelve a la normalidad|volver a la normalidad|back to normal/;

// Devuelve { text, expression } o null. Va ANTES de la moderación en chat.js.
function handleZipper(text, state) {
  const tn = normalizeCrisis(text).trim();

  if (state.mouthZipped) {
    // seguridad: ante una crisis se abre sola y la atiende el cerebro de manera normal
    if (detectCrisis(text)) { state.mouthZipped = false; return null; }
    // "modo normal" es la llave universal: abre la boca (y sale de JoJo, si estaba)
    if (UNZIP_RE.test(tn) || NORMAL_KEY_RE.test(tn)) {
      state.mouthZipped = false;
      if (NORMAL_KEY_RE.test(tn)) state.jojoMode = false;
      return { text: pickNoRepeat(UNZIP_LINES, state, 'unzip').es, expression: 'unzip_animation' };
    }
    return { text: pick(MUFFLED_SOUNDS), expression: 'zipped', muffled: true };
  }

  if (ZIP_RE.test(tn)) {
    if (isInsult(tn)) return null; // "callate idiota": que lo atienda el manejo de insultos
    if (isSeriousContextActive(state)) return modeBlockedReply(state, 'zip');
    state.mouthZipped = true;
    return { text: pick(MUFFLED_SOUNDS), expression: 'zipped', muffled: true };
  }
  return null;
}

// Devuelve { text, expression } o null. Va dentro del cerebro (pet-brain.js).
function handleExtras(text, state) {
  const tn = normalizeCrisis(text).trim();

  if (/cuantas horas (llevo|llevamos|he estado)|cuanto tiempo (llevo|llevamos|he estado)|cuanto (llevo|llevamos) (en|usando)|how long (have i|ive) been/.test(tn)) {
    const lang = (typeof getSiteLang === 'function') ? getSiteLang() : 'es';
    const line = pickNoRepeat(TIME_USED_LINES, state, 'timeused');
    const tiempo = formatDuration(Date.now() - getSiteOpenedAt(), lang);
    return { text: fillTemplate(lang === 'en' ? line.en : line.es, { tiempo }), expression: 'talking', noFlavor: true };
  }

  if (/que (hemos|hablamos|me dijiste)|de que hemos hablado|resumen de (la charla|la conversacion|lo que hablamos)|resumeme|resume la charla|de que hablamos hoy|summary of (our )?(chat|conversation)|what have we talked/.test(tn)) {
    const lang = (typeof getSiteLang === 'function') ? getSiteLang() : 'es';
    return buildSummary(state, lang);
  }
  return null;
}
