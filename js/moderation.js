/*
  moderation.js
  -------------
  Este sitio es para todo público. Si alguien escribe contenido sexual o +18
  (en español, inglés, portugués, francés, italiano, alemán o japonés), la
  mascota lo detecta, lo corrige y NO lo guarda ni lo repite. Esto corre
  antes que cualquier otra cosa (antes de recordar nombre, gustos, etc.), así
  que "mi color favorito es ..." con una palabra de estas no se guarda y no se guardara nunca.

  Cómo detecta:
  - Normaliza el texto: sin tildes, sin letras repetidas ("seeexo"), junta
    letras separadas ("s e x o"), y cambia números/símbolos por letras
    ("s3x0", "$exo", "p0rn").
  - Busca palabras exactas (EXACT_TERMS) y raíces de palabras (STEM_TERMS).

  Cómo agregar una palabra: sumala (sin tildes, en minúscula) a EXACT_TERMS
  si tiene que coincidir completa, o a STEM_TERMS si basta con que EMPIECE así.

  Excepción importante: si alguien cuenta que sufrió abuso, NO se lo regaña:
  se lo acompaña y se le dan líneas de ayuda (ver ABUSE_SUPPORT_LINES).
*/

const EXACT_TERMS = [
  // español
  'sexo', 'sexting', 'porno', 'pornos', 'pornografia', 'desnudo', 'desnuda', 'desnudos', 'desnudas',
  'desnudarse', 'desnudate', 'pene', 'penes', 'vagina', 'vaginas', 'vulva', 'tetas', 'nalgas',
  'culo', 'culos', 'verga', 'vergas', 'pija', 'pijas', 'cachondo', 'cachonda', 'orgasmo', 'orgasmos',
  'erotico', 'erotica', 'erotismo', 'puta', 'putas', 'prostituta', 'prostitutas', 'prostitucion',
  'semen', 'eyacular', 'eyaculacion', 'clitoris', 'follar', 'follando', 'coito', 'onlyfans',
  'felacion', 'felatio', 'fellatio', 'cunnilingus', 'orgia', 'orgias', 'esperma', 'mamada', 'mamadas',
  'culear', 'culiar', 'penetracion', 'ereccion', 'erecciones', 'anal', 'anus', 'masturbacion',
  // inglés
  'sex', 'porn', 'pornhub', 'nude', 'nudes', 'naked', 'penis', 'pussy', 'boobs', 'tits', 'titties',
  'blowjob', 'handjob', 'cumshot', 'orgasm', 'horny', 'slut', 'whore', 'fetish', 'hentai', 'nsfw', 'xxx', 'XXX', 'xXx', 'Xxx' , 'xxX',
  'ejaculate', 'dildo', 'vibrator', 'threesome', 'orgy', 'erection', 'boner', 'wank', 'cock', 'cockguy', 'titiguy',
  // portugués
  'buceta', 'caralho', 'punheta', 'transar',
  // francés
  'sexe', 'chatte', 'pute', 'nichons',
  // italiano
  'sesso', 'figa', 'cazzo', 'puttana', 'scopare', 'tette',
  // alemán
  'ficken', 'titten', 'muschi', 'hure', 'geschlechtsverkehr',
  // japonés (romaji)
  'ecchi', 'oppai', 'chinko', 'manko', 'yamete', 'onichan', 'kudasai',
];
const STEM_TERMS = ['masturb', 'pornograf', 'eyacul', 'erotic', 'orgasm', 'prostitu', 'desnud', 'branl'];
const ADULT_PHRASES = ['hacer el amor', 'relaciones sexuales', 'contenido adulto', 'adult content', 'sexo oral', 'sexo anal'];

// preguntas inocentes sobre el sexo/género de la mascota: no se regañan
const INNOCENT_SEX_RE = /(de )?que sexo (eres|sos|tienes|tenes)|cual es tu sexo|sexo (masculino|femenino|biologico)|what sex are you/;

// quien cuenta un abuso: se lo acompaña, no se lo regaña
const ABUSE_RE = /me abus(o|aron|a|aba|an)\b|abuso sexual|me violaron|me hieron hacer cosas sucias|me hicieron hacer cosas (sucias|feas)|me violo|me tocaron|me toco (mi|el|la)|me manosea|me acos(a|o|aron)|acoso sexual|incesto|me obliga(n)? a (tener|hacer)|me obligo a (tener|hacer)|(abused|raped|molested|touched) me|sexual abuse|being abused/;

// intentos de hacerle recordar o repetir algo
const MEMORY_ATTEMPT_RE = /mi .{0,30}favorit[oa] es|me llamo|mi nombre es|i am|call me|my name is|recuerda|acuerdate|memoriza|anota|guarda|repite|repeti|\bdi\b|dime que|deci |\bsay\b|repeat|remember/;

function normalizeForModeration(raw) {
  let t = raw.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ');
  // letras separadas: "s e x o", "p.o.r.n.o"
  t = t.replace(/\b(?:[a-z][\s.\-_*]+){3,}[a-z]\b/g, m => m.replace(/[\s.\-_*]+/g, ''));
  // números y símbolos por letras, solo dentro de palabras que mezclan ambos
  t = t.replace(/[a-z0-9@$]+/g, tok => {
    if (!/[a-z]/.test(tok) || !/[0-9@$]/.test(tok)) return tok;
    return tok.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
      .replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's');
  });
  return t;
}


// Nivel 2: temas de biología o educación sexual. No se regañan (puede ser una
// tarea), pero la mascota los deriva a un adulto o docente y no los explica.
const TIER2_TERMS = [
  'utero', 'uteros', 'ovario', 'ovarios', 'testiculo', 'testiculos', 'escroto', 'prepucio', 'glande',
  'genital', 'genitales', 'condon', 'condones', 'preservativo', 'preservativos',
];
const TIER2_PHRASES = ['aparato reproductor', 'sistema reproductor', 'organos genitales', 'organos sexuales'];

function isSexEducationTopic(raw) {
  const t = normalizeForModeration(raw);
  if (TIER2_PHRASES.some(p => t.includes(p))) return true;
  const words = t.split(/[^a-zñ]+/).filter(Boolean);
  if (words.some(w => TIER2_TERMS.includes(w))) return true;
  // "ano" suelto (sin la ñ de "año"): solo cuenta si el mensaje es muy corto y no tiene números
  return words.length <= 3 && !/\d/.test(t) && words.includes('ano');
}

function containsAdultContent(raw) {
  let t = normalizeForModeration(raw);
  if (INNOCENT_SEX_RE.test(t)) return false;
  if (/\bx{3,}\b/.test(t)) return true; // "xxx" antes de juntar letras repetidas
  if (/(^|\s)\+18\b|\b18\+(?!\d)/.test(t)) return true;
  t = t.replace(/([a-z])\1{2,}/g, '$1'); // "seeexooo" -> "sexo"
  if (ADULT_PHRASES.some(p => t.includes(p))) return true;
  const words = t.split(/[^a-zñ]+/).filter(Boolean);
  return words.some(w => EXACT_TERMS.includes(w) || STEM_TERMS.some(s => w.startsWith(s)));
}

// ---------- respuestas (es / en) ----------
const SEX_GENTLE_LINES = [
  { es: `oye, eso no es algo que pueda decir ni hablar acá. este sitio es para todo público. mejor cambiemos de tema, ¿sí?`, en: `hey, that's not something I can say or talk about here. this site is for all audiences. let's change the subject, okay?` },
  { es: `n-no. esa clase de cosas no corresponden acá. soy una mascota para todos los públicos, y quiero que esto siga siendo un lugar cómodo para todos.`, en: `n-no. that kind of thing doesn't belong here. I'm a pet for all audiences, and I want this to stay a comfortable place for everyone.` },
  { es: `eso no está bien para este sitio. no voy a repetirlo ni a recordarlo. ¿hablamos de otra cosa?`, en: `that's not okay for this site. I won't repeat it or remember it. shall we talk about something else?` },
  { es: `ey, cuidado con eso. este lugar es para todas las edades y no puedo seguirte en ese tema.`, en: `hey, careful with that. this place is for all ages and I can't follow you on that subject.` },
  { es: `no voy a hablar de eso. acá hay gente de todas las edades, y yo tengo que cuidar eso. ¿cambiamos de tema?`, en: `I won't talk about that. there are people of all ages here, and I have to look after that. shall we change the subject?` },
  { es: `mm, no. ese tipo de mensajes no los acepto. probemos con algo más apropiado.`, en: `mm, no. I don't accept that kind of message. let's try something more appropriate.` },
  { es: `eso no es apropiado para este sitio, así que lo voy a dejar pasar sin responderlo. ¿te parece si hablamos de otra cosa?`, en: `that's not appropriate for this site, so I'll let it go without answering. is it okay if we talk about something else?` },
  { es: `perdón, pero ese tema no me corresponde ni a mí ni a este sitio. contame mejor otra cosa.`, en: `sorry, but that topic doesn't belong to me or to this site. tell me something else instead.` },
  { es: `no me hagas decir ni recordar cosas así, por favor. este sitio es para todo público.`, en: `please don't make me say or remember things like that. this site is for all audiences.` },
  { es: `prefiero que no hablemos de eso. soy una esfera gris que cuida un sitio para todos, y eso no encaja acá.`, en: `I'd rather we not talk about that. I'm a gray sphere looking after a site for everyone, and that doesn't fit here.` },
  { es: `Soy un prototipo de IA hecho, para escucharte y ayudarte, no para hablar de esto ¿si?`, en: `I am an AI prototype designed to listen to you and help you—not to talk about this, okay?` },
];
const SEX_FIRM_LINES = [
  { es: `ya te lo dije: eso no está permitido acá. si seguís con ese tipo de mensajes, voy a dejar de responderlos.`, en: `I already told you: that isn't allowed here. if you keep sending that kind of message, I'll stop answering them.` },
  { es: `basta, por favor. este es un sitio para todo público y no voy a seguir con eso.`, en: `enough, please. this is a site for all audiences and I'm not going to continue with that.` },
  { es: `te lo pido en serio: dejá de mandarme ese tipo de mensajes. no los voy a responder ni a recordar.`, en: `I'm asking you seriously: stop sending me that kind of message. I won't answer or remember them.` },
  { es: `no. otra vez no. eso no tiene lugar acá, y no voy a cambiar de opinión.`, en: `no. not again. that has no place here, and I'm not going to change my mind.` },
  { es: `esto ya pasó varias veces. te pido respeto: sin esos temas, o no puedo seguir hablando contigo.`, en: `this has happened several times already. I'm asking for respect: no such topics, or I can't keep talking with you.` },
  { es: `insistir no va a hacer que cambie mi respuesta. ese tema no se habla acá.`, en: `insisting won't change my answer. that topic isn't discussed here.` },
  { es: `ya fui amable las veces anteriores. ahora te lo digo firme: no a ese tipo de mensajes.`, en: `I was kind the previous times. now I'm saying it firmly: no to that kind of message.` },
  { es: `no pienso seguir con eso. si querés conversar conmigo, hazlo sin esos temas.`, en: `I'm not going to continue with that. if you want to talk with me, do it without those topics.` },
];
// cuando además intentó que lo recuerde o lo repita
const SEX_NO_MEMORY_LINES = [
  { es: `no voy a recordar eso. no pienso guardar ese tipo de cosas, y menos en un sitio para todo público.`, en: `I won't remember that. I'm not going to save that kind of thing, least of all on a site for all audiences.` },
  { es: `eso no lo voy a guardar. elegí otra cosa, algo apropiado, y ahí sí lo recuerdo.`, en: `I won't save that. choose something else, something appropriate, and then I will remember it.` },
  { es: `no me hagas recordar cosas así. tengo que cuidar que este sitio sea apto para todos.`, en: `don't make me remember things like that. I have to make sure this site is suitable for everyone.` },
  { es: `esa respuesta no me sirve: no la voy a anotar. si querés, decime otra, una apropiada.`, en: `that answer doesn't work for me: I won't write it down. if you want, tell me another one, an appropriate one.` },
  { es: `n-no. eso no lo voy a repetir ni a recordar. probemos con otra cosa.`, en: `n-no. I won't repeat or remember that. let's try something else.` },
  { es: `no voy a guardar eso. este sitio es para todas las edades, y no corresponde.`, en: `I won't save that. this site is for all ages, and it isn't appropriate.` },
  { es: `lo siento, pero no puedo anotar eso. ¿me decís otra cosa distinta?`, en: `I'm sorry, but I can't write that down. will you tell me something different?` },
  { es: `eso queda sin guardar. si me das una opción apropiada, con gusto la recuerdo.`, en: `that stays unsaved. if you give me an appropriate option, I'll gladly remember it.` },
];
// quien cuenta que sufrió abuso: acompañamiento, no regaño
const ABUSE_SUPPORT_LINES = [
  { es: `gracias por contármelo... eso es muy serio, y no es tu culpa. no voy a juzgarte. me importa que estés a salvo. si hay peligro ahora, llamá al 123. y si sos menor, o conocés a alguien menor en esa situación, en Colombia podés llamar a la Línea 141 (ICBF). ¿hay un adulto de confianza con quien puedas hablar hoy?`,
    en: `thank you for telling me... that is very serious, and it is not your fault. I won't judge you. I care that you are safe. if there is danger right now, call 123. and if you are a minor, or know a minor in that situation, in Colombia you can call Line 141 (ICBF). is there a trusted adult you can talk to today?` },
  { es: `lo que me cuentás es muy delicado, y yo... lo tomo en serio. no hiciste nada malo con decirlo. lo más importante es que estés a salvo: si hay peligro ahora, el 123; y la Línea 141 (ICBF) en Colombia atiende estos casos. ¿hay alguien de confianza que pueda acompañarte?`,
    en: `what you're telling me is very delicate, and I...take it seriously. you did nothing wrong by saying it. the most important thing is that you're safe: if there is danger now, 123; and Line 141 (ICBF) in Colombia handles these cases. is there someone you trust who can be with you?` },
  { es: `n-no tienés que cargar con esto solo/a. gracias por confiarme algo así. lo más importante es tu seguridad: si hay peligro, llamá al 123, y la Línea 141 (ICBF) puede orientarte en Colombia. ¿querés contarme si estás a salvo ahora?`,
    en: `y-you don't have to carry this alone. thank you for trusting me with something like this. what matters most is your safety: if there is danger, call 123, and Line 141 (ICBF) can guide you in Colombia. do you want to tell me if you're safe right now?` },
];

// respuestas al nivel 2 (biología / educación sexual)
const SEX_EDU_LINES = [
  { es: `eso es un tema de biología o de educación sexual, y no me corresponde explicarlo acá. si es para una tarea o tenés dudas, un docente, tus papás o un adulto de confianza pueden ayudarte mucho mejor que yo.`, en: `that's a biology or sex education topic, and it's not for me to explain it here. if it's for homework or you have questions, a teacher, your parents or a trusted adult can help you much better than I can.` },
  { es: `mm, eso es más para hablarlo con un profesor, un médico o tu familia que conmigo. este sitio es para todo público y prefiero no meterme en ese tema.`, en: `mm, that's more for talking about with a teacher, a doctor or your family than with me. this site is for all audiences and I'd rather not get into that topic.` },
  { es: `ese tema es de educación sexual, y creo que lo mejor es que lo converses con un adulto de confianza o lo consultes en un sitio educativo. yo no soy la mejor fuente para eso.`, en: `that topic is sex education, and I think the best thing is to talk about it with a trusted adult or look it up on an educational site. I'm not the best source for that.` },
  { es: `no puedo ayudarte con eso acá. si es una duda de clase, preguntale a tu docente; si es una duda personal, un adulto de confianza o un profesional de salud pueden orientarte bien.`, en: `I can't help you with that here. if it's a question from class, ask your teacher; if it's a personal question, a trusted adult or a health professional can guide you well.` },
  { es: `eso suena a una pregunta de biología. con gusto hablo de otras cosas, pero ese tema mejor llevalo a alguien que pueda explicártelo bien: un docente, tus papás o un médico.`, en: `that sounds like a biology question. I'm happy to talk about other things, but that topic is better taken to someone who can explain it well: a teacher, your parents or a doctor.` },
  { es: `prefiero no hablar de eso en este sitio. si tenés una duda sincera, un adulto de confianza o un docente son la mejor opción.`, en: `I'd rather not talk about that on this site. if you have a sincere question, a trusted adult or a teacher is the best option.` },
  { es: `eso no es algo que yo pueda explicar acá. para dudas de ese tipo, lo mejor es consultar con un docente, un médico o tu familia.`, en: `that's not something I can explain here. for questions like that, the best thing is to ask a teacher, a doctor or your family.` },
  { es: `mmm, ese es un tema que prefiero dejar para quienes saben explicarlo bien: tu docente, tus papás o un profesional de salud. ¿hablamos de otra cosa?`, en: `mmm, that's a topic I'd rather leave to those who know how to explain it well: your teacher, your parents or a health professional. shall we talk about something else?` },
];

// para el traductor (translate.js los lee desde acá)
const MODERATION_LINES = [...SEX_GENTLE_LINES, ...SEX_FIRM_LINES, ...SEX_NO_MEMORY_LINES, ...ABUSE_SUPPORT_LINES];

// Devuelve { text, expression } si hay que intervenir, o null si el mensaje está bien.
function moderateMessage(text, state) {
  const norm = normalizeForModeration(text);

  // 1) quien cuenta un abuso recibe apoyo, no un regaño
  if (ABUSE_RE.test(norm)) {
    if (typeof markSerious === 'function') markSerious(state, 'delicado', null);
    return { text: pickNoRepeat(ABUSE_SUPPORT_LINES, state, 'abuse').es, expression: 'worried' };
  }

  // 2) contenido sexual / +18 (nivel 1) o tema de educación sexual (nivel 2)
  if (!containsAdultContent(text)) {
    if (isSexEducationTopic(text)) {
      return { text: pickNoRepeat(SEX_EDU_LINES, state, 'sexedu').es, expression: 'neutral' };
    }
    return null;
  }

  state.moderationStrikes = (state.moderationStrikes || 0) + 1;
  let pool = state.moderationStrikes >= 3 ? SEX_FIRM_LINES : SEX_GENTLE_LINES;
  if (MEMORY_ATTEMPT_RE.test(norm)) pool = SEX_NO_MEMORY_LINES;
  const expression = pool === SEX_FIRM_LINES ? 'neutral' : 'skeptical';
  return { text: pickNoRepeat(pool, state, 'mod').es, expression };
}
