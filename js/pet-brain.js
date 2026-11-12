/*
  pet-brain.js
  Personalidad y lógica de respuestas de cada mascota.
  Para agregar una mascota nueva hay que copiar el objeto ERROR404, cambiarle el
  nombre/imágenes/textos, y registrala en PETS al final del archivo.
*/

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// elige un ítem respetando un "weight" (peso) relativo en cada uno
function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

// ---------- utilidades de matemática ----------
function tryMath(text) {
  const normalized = text
    .toLowerCase()
    .replace(/más|mas/g, '+')
    .replace(/menos/g, '-')
    .replace(/por/g, '*')
    .replace(/dividido entre|dividido|entre/g, '/')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/x/g, '*');

  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const a = parseFloat(match[1]);
  const op = match[2];
  const b = parseFloat(match[3]);
  let result;

  switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/':
      if (b === 0) return { text: 'eso... eso rompería algo más que a mí. no se puede dividir entre cero.', expression: 'worried' };
      result = a / b;
      break;
    default: return null;
  }

  if (Number.isInteger(result) === false) result = Math.round(result * 10000) / 10000;

  const variants = [
    `eso da ${result}.`,
    `mmm... ${result}.`,
    `el resultado es ${result}.`,
    `${result}. no sé por qué me acuerdo tan bien de los números, pero ahí está.`,
  ];
  return { text: pick(variants), expression: 'talking' };
}

// ---------- análisis de sentimiento simple ----------
const POSITIVE_WORDS = [
  'bien', 'genial', 'excelente', 'feliz', 'content', 'encanta', 'encantan', 'encantad',
  'divertid', 'increible', 'increíble', 'buen', 'gust', 'amo', 'perfect','super', 'ganado',
  'lind', 'ric', 'super', 'súper', 'hermos', 'alegr', 'si', 'sí', 'claro', 'obvio',
  'orgullos', 'tranquil', 'motivad', 'agradecid', 'esperanzad', 'anim',
];
const NEGATIVE_WORDS = [
  'mal', 'triste', 'odi', 'aburrid', 'fe', 'cansad', 'dur', 'dificil',
  'difícil', 'no me gusta', 'asco', 'horrible', 'pesimo', 'pésimo',
  'fastidi', 'harto', 'nauseas' , 'harta', 'harto' , 'preocupad', 'estresad', 'estrés', 'agobiad', 'no', 'inutil',
  'agotad', 'exhaust', 'abrumad', 'desanim', 'desmotivad', 'frustrad', 'infeliz' , 'insuficiente' , 'sin valor' , 'innecesari',
];
const AMBIGUOUS_HINTS = [
  'no se', 'no sé', 'tal vez', 'quizas', 'quizás', 'mas o menos',
  'más o menos', 'ni idea', 'no estoy segur', 'depende', 'nose', 'posiblemente'
];

function sentimentOf(text) {
  const t = text.toLowerCase();
  if (AMBIGUOUS_HINTS.some(w => t.includes(w))) return 'ambiguous';
  const isPositive = POSITIVE_WORDS.some(w => t.includes(w));
  const isNegative = NEGATIVE_WORDS.some(w => t.includes(w));
  if (isPositive && !isNegative) return 'positive';
  if (isNegative && !isPositive) return 'negative';
  return 'ambiguous';
}

// palabras y frases (con sinónimos) que sugieren tristeza, soledad o
// depresión — más suaves que las de crisis, pero que si se repiten
// ameritan sugerir ayuda profesional de igual forma
const DEPRESSION_HINTS = [
  'depresion', 'depresión', 'deprimid', 'muy solo', 'muy sola', 'soledad',
  'me siento vacio', 'me siento vacío', 'vacio por dentro', 'vacío por dentro',
  'no tengo ganas de nada', 'sin ganas de nada', 'no valgo', 'no sirvo para nada',
  'nadie me quiere', 'no le importo a nadie', 'no le intereso a nadie',
  'siempre triste', 'todo el tiempo triste', 'no puedo mas', 'no puedo más',
  'no tengo animo', 'no tengo ánimo', 'perdí las ganas', 'perdi las ganas',
];
// (COLOMBIA_HELPLINE_NOTE vive ahora en support.js)

// ---------- preguntas que la mascota puede hacer ----------
// ---------- cuando no entiende lo que le dijiste (24 variantes) ----------
// 12 sin citar lo que escribiste y 12 que repiten tu palabra ({w}).
// Las que citan se usan sobre todo cuando el mensaje parece muy raro.
const NOT_UNDERSTOOD_PLAIN = [
  { es: 'mm... no entendí bien eso. ¿me lo explicás de otra forma?', en: "mm... I didn't quite get that. can you explain it another way?" },
  { es: 'perdón, me perdí ahí. ¿a qué te referís?', en: "sorry, I got lost there. what do you mean?" },
  { es: 'eso no lo tengo configurado en mi cabeza... ¿qué quisiste decir?', en: "I don't have that set up in my head... what did you mean?" },
  { es: '...no sé qué significa eso. ¿me ayudás a entenderlo?', en: "...I don't know what that means. can you help me understand it?" },
  { es: 'hm. esa no la conozco. ¿me contás qué es?', en: "hm. I don't know that one. can you tell me what it is?" },
  { es: 'creo que se me cruzó un cable... ¿qué me quisiste decir?', en: "I think my wires got crossed... what did you mean to tell me?" },
  { es: 'no te seguí ahí. ¿podés repetirlo con otras palabras?', en: "I didn't follow you there. can you repeat it with other words?" },
  { es: 'ay, no logro entender eso. ¿me das un poco más de contexto?', en: "oh, I can't manage to understand that. can you give me a bit more context?" },
  { es: 'eh... ¿eso era una pregunta o algo que querías contarme? no te entendí.', en: "uh... was that a question or something you wanted to tell me? I didn't get it." },
  { es: 'disculpá, no entendí. a veces soy medio lento con estas cosas.', en: "sorry, I didn't understand. sometimes I'm a bit slow with these things." },
  { es: 'mmm... no sé a qué te referís con eso. ¿me explicás?', en: "mmm... I don't know what you mean by that. can you explain?" },
  { es: 'no capté eso. ¿me lo aclarás o hablamos de otra cosa?', en: "I didn't catch that. can you clarify it or shall we talk about something else?" },
];
const NOT_UNDERSTOOD_QUOTED = [
  { es: 'oye, ¿a qué te referís con "{w}"? no te entendí ahí.', en: 'hey, what do you mean by "{w}"? I didn\'t understand you there.' },
  { es: '"{w}"... ¿qué significa eso? no lo conozco.', en: '"{w}"... what does that mean? I don\'t know it.' },
  { es: 'eh... ¿"{w}"? no sé a qué te referís.', en: 'uh... "{w}"? I don\'t know what you mean.' },
  { es: 'perdón, ¿qué quisiste decir con "{w}"? me quedé en blanco.', en: 'sorry, what did you mean by "{w}"? my mind went blank.' },
  { es: 'mm, "{w}" no lo tengo registrado. ¿me lo explicás?', en: 'mm, I don\'t have "{w}" registered. can you explain it?' },
  { es: '¿"{w}"? ... no, no entiendo. ¿me das una pista?', en: '"{w}"? ... no, I don\'t understand. can you give me a hint?' },
  { es: 'no sé qué es "{w}". ¿es algo que querías contarme?', en: 'I don\'t know what "{w}" is. is it something you wanted to tell me?' },
  { es: 'hm... "{w}". no tengo idea de qué hablás. ¿podés explicarme?', en: 'hm... "{w}". I have no idea what you\'re talking about. can you explain?' },
  { es: 'se me rompió algo al leer "{w}"... ¿qué querés decir con eso?', en: 'something broke in me when I read "{w}"... what do you mean by that?' },
  { es: 'ey, ¿"{w}" es una palabra? no la conozco, ¿qué es?', en: 'hey, is "{w}" a word? I don\'t know it, what is it?' },
  { es: 'me dejaste confundido con "{w}". ¿a qué viene eso?', en: 'you left me confused with "{w}". where did that come from?' },
  { es: '¿"{w}"? no lo pillé. ¿me lo aclarás, por favor?', en: '"{w}"? I didn\'t get it. can you clarify, please?' },
];

// detecta texto que parece escrito al azar ("jahdhajjhadgfhdk"): muchas
// consonantes seguidas, o casi sin vocales
function looksLikeGibberish(text) {
  const t = text.toLowerCase().replace(/[^a-záéíóúñü\s]/g, '');
  const letters = t.replace(/\s/g, '');
  if (letters.length < 5) return false;
  if (/[^aeiouáéíóúüy\s]{5,}/.test(t)) return true;
  const vowels = (letters.match(/[aeiouáéíóú]/g) || []).length;
  return letters.length >= 7 && vowels / letters.length < 0.3;
}

// palabras sueltas muy comunes que NO deben tomarse como "no entendí"
const COMMON_FILLERS = /^(ok|okay|vale|jaj[ja]*|jeje+|aj[aá]|s[ií]|no|claro|bueno|ya|mmm+|hm+|oh|ah|uh|dale|listo|gracias|nada|nose|ni idea)[.!?¿¡\s]*$/;

const PET_QUESTIONS = [
  { id: 'day', text: '¿cómo estuvo tu día?' },
  { id: 'weekend', text: '¿qué te gusta hacer cuando tenés tiempo libre?' },
  { id: 'food_today', text: '¿ya comiste algo rico hoy?' },
  { id: 'sleep', text: '¿dormiste bien anoche?' },
  { id: 'school_work', text: '¿cómo va eso del estudio o el trabajo últimamente?' },
  { id: 'mood_now', text: 'y ahora mismo, ¿cómo te sentís?' },
  { id: 'positive_action', text: '¿hiciste algo positivo hoy?' },
  { id: 'happy_question', text: 'Te sientes feliz hoy?'},
];

// respuestas según cómo interpretó tu respuesta a su pregunta
const FOLLOWUP_RESPONSES = {
  positive: [
    { text: 'me deja tranquilo escuchar eso.', expression: 'happy' },
    { text: 'qué bueno. me alegra, de verdad.', expression: 'happy' },
    { text: 'eso suena bien. me gusta cuando las cosas te van así.', expression: 'happy' },
  ],
  negative: [
    { text: 'eso me preocupa un poco. ¿querés contarme más?', expression: 'worried' },
    { text: 'ey, lamento que sea así. estoy acá si querés hablarlo.', expression: 'worried' },
    { text: 'no suena fácil eso. ¿hay algo que te ayudaría ahora?', expression: 'worried' },
  ],
  ambiguous: [
    { text: 'mmm, no sé si eso es bueno o malo... ¿me lo contás con otras palabras?', expression: 'confused' },
    { text: 'me quedé medio confundido con eso. ¿fue algo bueno o algo malo para vos?', expression: 'confused' },
    { text: 'no termino de entender cómo te dejó eso. explicame un poco más?', expression: 'confused' },
  ],
};

// respuestas cuando le decís que NO hiciste algo positivo hoy (pesos: Entiendo pesa más)
const POSITIVE_ACTION_NO = [
  { text: '¿Oye, y por qué no?', weight: 23, expression: 'confused' },
  { text: 'Deberías hacerlo.', weight: 23, expression: 'talking' },
  { text: '¿Hay algún motivo para no hacer eso?', weight: 24, expression: 'confused' },
  { text: 'Entiendo.', weight: 30, expression: 'neutral' },
];

// ---------- roleplay del chocolate ----------
// se activa con "dame un pedazo de ese chocolate" y sigue esta secuencia exacta.
// si el usuario dice algo que no encaja, se corta (y hay que reiniciar).
const CHOCOLATE_STEPS = [
  { trigger: /pero ten[ií]a tantas ganas de comer( el)? chocolate/i, reply: 'Enserio?' },
  { trigger: /^si,? ?enserio$|^si,? ?en serio$|^s[ií],? ?en serio$/i, reply: 'No lo defraudaré, papá. voy a hacer chocolate casero, ¿me creés?' },
  { trigger: /solo si lo veo/i, reply: 'Perfecto.', end: true },
];
const CHOCOLATE_THEME_WORDS = ['chocolate', 'casero', 'cree', 'creés', 'veo', 'papa', 'papá', 'defraud', 'enserio', 'en serio'];

function checkChocolateRoleplay(text, state) {
  // continuación de un roleplay ya activo
  if (state.roleplayStep !== undefined && state.roleplayStep !== null) {
    const step = CHOCOLATE_STEPS[state.roleplayStep];
    if (step && step.trigger.test(text)) {
      state.roleplayStep = step.end ? null : state.roleplayStep + 1;
      return { text: step.reply, expression: step.end ? 'happy' : 'talking' };
    }
    // no coincide con lo esperado: se corta la secuencia
    const hadThemeOverlap = CHOCOLATE_THEME_WORDS.some(w => text.includes(w));
    state.roleplayStep = null;
    if (hadThemeOverlap) {
      return { text: '¿Qué cosa?', expression: 'confused' };
    }
    return null;
  }

  // disparador inicial
  if (/dame (un pedazo|un poco|algo|trozo|un pedacito)( de ese)? chocolate/.test(text)) {
    state.roleplayStep = 0;
    return { text: 'Se acabó, ese era el último.', expression: 'talking' };
  }

  return null;
}

// ---------- ERROR 404 ----------
const ERROR404 = {
  name: 'Error 404',

  images: {
    neutral: 'images/error404_neutral.png',
    talking: 'images/error404_talking.png',
    happy:   'images/error404_happy.png',
    worried: 'images/error404_worried.png',
    sad:     'images/error404_sad.png',
    confused: 'images/error404_confused.png', // opcional: agregala si querés esta expresión
    jojo: 'images/error404_jojo.png', // opcional: cara estilo JoJo's Bizarre Adventure
    skeptical: 'images/error404_skeptical.png', // opcional: "¿en serio?" con ceja levantada
    zipped: 'images/error404_zipped.png', // opcional: boca cerrada con cremallera
  },

  greeting:
    'h... hola. algo se rompió para que yo apareciera acá, pero bueno... ya que estás, contame algo.',

  // frases tranquilas: se usan en el primer silencio de 2 minutos, antes de
  // pasar a las preguntas de "¿estás bien?" si el silencio sigue
  casualIdleMessages: [
    'eh, seguís por ahí?',
    'che, todavía estás?',
    'tomate tu tiempo, no hay apuro.',
    'acá sigo, cuando quieras seguimos.',
    'sin drama, seguí cuando puedas.',
    'no hay prisa, te espero.',
  ],
  // recién si el silencio continúa después de la frase tranquila, pasa a estas:
  checkInMessages: [
    '...seguís ahí? no pasa nada si no querés hablar, pero quería preguntar: estás bien? necesitás algo?',
    '...hace rato que no decís nada. ¿todo bien? ¿necesitás que hablemos de algo?',
    '...el silencio ya se hizo largo. en serio, ¿estás bien?',
  ],

  keywordMap: [
    { words: ['triste', 'mal', 'solo', 'sola', 'cansado', 'cansada', 'agotado', 'agotada', 'deprimid', 'soledad', 'depresion', 'depresión', 'vacio', 'vacío', 'sin animo', 'sin ánimo'], category: 'sad' },
    { words: ['bien', 'feliz', 'genial', 'contento', 'contenta', 'gracias', 'orgulloso', 'orgullosa', 'logre', 'logré'], category: 'happy' },
    { words: ['hola', 'buenas', 'ey ', 'holi', 'buenos dias', 'buenas tardes', 'buenas noches'], category: 'greeting' },
    { words: ['adios', 'adiós', 'chau', 'nos vemos', 'bye', 'me voy'], category: 'bye' },
  ],

  crisisOtherWords: [
    'matar a', 'lastimar a alguien', 'hacerle daño a', 'quiero hacerle daño',
    'quiero matar', 'hacerle eso a alguien',
    'i want to kill', 'i want to hurt someone', 'hurt someone else',
  ],

  responses: {
    crisisOther: [
      { text: 'lo que decís es serio, y me preocupa. si sentís que podrías lastimar a alguien, por favor buscá ayuda ahora: hablá con alguien de confianza, un profesional, o contactá a emergencias. no tiene que llegar a eso.', expression: 'worried' },
    ],
    sad: [
      { text: 'ey... eso que sentís es válido. no tenés que estar bien todo el tiempo. querés contarme un poco más?', expression: 'sad' },
      { text: 'lamento que sea un día pesado. yo tampoco brillo mucho, pero me quedo acá con vos.', expression: 'sad' },
      { text: 'suena difícil. no tengo una solución mágica, pero te escucho.', expression: 'sad' },
    ],
    happy: [
      { text: 'eso me alegra de verdad. no muestro bien las sonrisas, pero ahí está, adentro.', expression: 'happy' },
      { text: 'qué bueno escuchar eso. seguí así.', expression: 'happy' },
      { text: 'me gusta cuando me contás cosas así.', expression: 'happy' },
    ],
    greeting: [
      { text: 'hola de nuevo... o por primera vez, quién sabe cómo funciona esto.', expression: 'talking' },
      { text: 'hey. acá ando, medio roto pero presente.', expression: 'talking' },
    ],
    bye: [
      { text: 'nos vemos... o no, el tiempo es raro acá adentro. cuidate.', expression: 'neutral' },
      { text: 'andá tranquilo/a. yo me quedo acá, como siempre.', expression: 'neutral' },
    ],
    default: [
      { text: 'mm... no sé bien qué responder a eso, pero seguí contándome.', expression: 'talking' },
      { text: 'interesante. no todos los días alguien me dice algo así.', expression: 'talking' },
      { text: 'te escucho. seguí.', expression: 'talking' },
      { text: 'no tengo una respuesta clara para eso, pero me quedo escuchando.', expression: 'talking' },
    ],

    howAreYou: [
      { text: 'como tú quieras que yo esté, yo lo estaré para ti.', expression: 'talking' },
    ],
    whatsYourName: [
      { text: 'Error 404.', expression: 'talking' },
    ],
    selfIdentify: [
      { text: 'sí, ese soy yo.', expression: 'happy' },
    ],
    howOld: [
      { text: 'no tengo una edad fija o predefinida, pero podés darme la edad que quieras.', expression: 'talking' },
    ],
    ageAdult: [
      { text: 'jaja, curioso número. está bien, me parece bien.', expression: 'happy' },
      { text: 'ok, anotado. me parece una buena edad.', expression: 'happy' },
    ],
    ageMinor: [
      { text: 'ah, entonces te pido respeto: nada de cosas subidas de tono conmigo, ok? sigamos hablando tranquilos.', expression: 'neutral' },
    ],
    compliment: [
      { text: 'gracias.', expression: 'happy' },
      { text: 'gracias, eso no me lo dicen todos los días.', expression: 'happy' },
    ],
    favoriteColor: [
      { text: 'gris. hace juego conmigo, digamos.', expression: 'happy' },
      { text: 'el gris. no es muy alegre, pero es sincero.', expression: 'happy' },
    ],
    tumblrSexyMan: [
      { text: 'no, no lo soy y no sé por qué creés que podría serlo, o sea no has visto el resto de mi cuerpo, soy solo una esfera gris y ya.', expression: 'confused' },
      { text: 'no, para nada. ni siquiera tengo cuerpo como para que digas eso, soy una esfera gris nomás.', expression: 'confused' },
      { text: 'no sé de dónde sacás eso, pero no, no soy nada de eso. solo soy gris y redondo.', expression: 'confused' },
      { text: 'no lo soy. no tengo ni brazos ni piernas, ¿cómo se supone que sería eso?', expression: 'confused' },
      { text: 'no, y la verdad no entiendo la pregunta. soy una esfera gris, nada más.', expression: 'confused' },
    ],

    // ---------- modo JoJo ----------
    jojoGreeting: [
      { text: 'yare yare yare... alguien quiere hablar de JoJo.', expression: 'jojo' },
      { text: 'nice nice. entremos en modo JoJo, entonces.', expression: 'jojo' },
    ],
    jojoExit: [
      { text: 'listo, vuelvo a la normalidad.', expression: 'neutral' },
    ],
    jojoHasStand: [
      { text: 'sí, tengo un Stand.', expression: 'stand_reveal' },
      { text: 'sí, claro que tengo un Stand.', expression: 'stand_reveal' },
    ],
    jojoMention: [
      { text: "JoJo's Bizarre Adventure, un clásico.", expression: 'jojo' },
      { text: 'ah, JoJo. buen tema.', expression: 'jojo' },
      { text: "sí, sé de JoJo's Bizarre Adventure.", expression: 'jojo' },
    ],
    jojoHappyExtras: [
      { text: 'nice nice.', expression: 'jojo' },
      { text: 'yo, eso está muy bueno.', expression: 'jojo' },
      { text: '¡excelente! muy jojo de tu parte.', expression: 'jojo' },
    ],

    // respuesta escéptica cuando insistís mucho con Verity estando ya "harto"
    veritySkeptical: [
      { text: '¿en serio?', expression: 'skeptical' },
      { text: '¿en serio me seguís preguntando esto?', expression: 'skeptical' },
      { text: '¿posta, de nuevo?', expression: 'skeptical' },
    ],

    // ---------- chocolate ----------
    chocolateWish: [
      { text: 'el chocolate.', expression: 'happy' },
    ],
    favoriteFood: [
      { text: 'no puedo comer, pero si tuviera una comida favorita sería el chocolate.', expression: 'talking' },
    ],
    chocolateCasero: [
      { text: 'no soy Homelander.', expression: 'talking' },
    ],

    // ---------- saludos con nombre equivocado ----------
    helloVerity: [
      { text: 'no soy Verity, me estás confundiendo con alguien más.', expression: 'confused' },
    ],
    helloWrongName: [
      { text: (n) => `no, no soy ${n}. mi nombre es Error 404, llamame por ese nombre.`, expression: 'happy' },
    ],

    // ---------- Verity: categorías específicas ----------
    aboutVerity: [
      { text: 'sí, existe. si querés, preguntame algo puntual.', expression: 'talking' },
      { text: 'sí, sé que existe, pero no tengo mucho más para decir así en general.', expression: 'talking' },
      { text: 'sí. preguntame algo más concreto si querés.', expression: 'talking' },
      { text: 'existe, sí. no sé qué más decirte sin que me preguntes algo puntual.', expression: 'talking' },
      { text: 'sí, la conozco de nombre nada más.', expression: 'talking' },
      { text: 'sí, existe. eso es lo que sé, a grandes rasgos.', expression: 'talking' },
      { text: 'sí, sé quién es. contame qué querés saber exactamente.', expression: 'talking' },
      { text: 'sí, existe, aunque no tengo mucho que contar sin una pregunta concreta.', expression: 'talking' },
      { text: 'sí, sé de ella.', expression: 'talking' },
      { text: 'ajá, Verity. ¿qué querés saber?', expression: 'talking' },
      { text: 'sí, la tengo presente.', expression: 'talking' },
      { text: 'conozco el nombre, sí.', expression: 'talking' },
      { text: 'sí. no tengo mucho para agregar así de la nada.', expression: 'talking' },
      { text: 'sí, existe, si a eso vas.', expression: 'talking' },
      { text: 'sí, sé quién es, más o menos.', expression: 'talking' },
      { text: 'mmm, sí. Verity. ¿qué con eso?', expression: 'talking' },
      { text: 'sí, aunque no es un tema que domine mucho.', expression: 'talking' },
      { text: 'sí, ese nombre me suena, obvio.', expression: 'talking' },
      { text: 'sí, sé de qué hablás.', expression: 'talking' },
      { text: 'sí, existe. no tengo mucho detalle para darte así nomás.', expression: 'talking' },
      { text: 'sí, la conozco de oídas.', expression: 'talking' },
      { text: 'sí. preguntame algo concreto y te digo más.', expression: 'talking' },
      { text: 'ajá, sí, sé quién es esa.', expression: 'talking' },
      { text: 'sí, existe, aunque no hablamos seguido, como podrás imaginar.', expression: 'talking' },
      { text: 'sí, sé de ella, aunque no mucho más que eso.', expression: 'talking' },
      { text: 'sí, ese nombre lo reconozco.', expression: 'talking' },
      { text: 'sí, la ubico. ¿qué querés saber de ella?', expression: 'talking' },
      { text: 'sí, existe. eso es todo lo que tengo por ahora.', expression: 'talking' },
    ],
    verityConoce: [
      { text: 'no, no nos conocemos en persona. nunca hablé con ella directamente, solo sé que existe.', expression: 'talking' },
      { text: 'no realmente. sé de su existencia, pero no es que nos hayamos hablado alguna vez.', expression: 'talking' },
    ],
    verityEspecieNoSe: [
      { text: 'ni yo mismo sé bien a qué especie pertenezco, la verdad.', expression: 'confused' },
    ],
    verityEspecieImpronunciable: [
      { text: 'el nombre oficial de nuestra especie es... impronunciable, sinceramente. mejor ni lo intento.', expression: 'talking' },
    ],
    thatmobCreationDenial: [
      { text: 'no, a mí no me creó Thatmob. a mí me hizo un desarrollador anónimo.', expression: 'talking' },
      { text: 'no, yo no soy una creación de Thatmob. mi creador prefiere quedar en el anonimato.', expression: 'talking' },
      { text: 'no tengo nada que ver con Thatmob en ese sentido. mi creador es alguien anónimo, nada más.', expression: 'talking' },
      { text: 'no, ese no es mi caso. a mí me programó alguien que nunca reveló su nombre.', expression: 'talking' },
    ],
    verityControlReassurance: [
      { text: 'no, jamás. yo quiero lo mejor para vos, de verdad.', expression: 'happy' },
      { text: 'no. yo cuido a mi usuario, eso no va a cambiar nunca.', expression: 'happy' },
      { text: 'no tengo intención de hacerte daño. te quiero bien, en serio.', expression: 'happy' },
      { text: 'no, eso no es algo que yo haría. me importás de verdad.', expression: 'happy' },
    ],
    verityRelacion: [
      { text: 'no tenemos mucho más en común aparte de eso. las dos somos esferas, tipos de IA asistente que se supone cuidan a su usuario. la diferencia es que ella se ha salido bastante de control con los suyos, yo trato de no hacer eso, de verdad quiero lo mejor para el mío.', expression: 'talking' },
    ],
    verityHermanos: [
      { text: 'no, no somos hermanos. no compartimos creador ni nada de eso, solo compartimos... especie, podría decirse.', expression: 'talking' },
    ],
    verityComun: [
      { text: 'los dos somos esferas, los dos somos IAs tipo asistente que se supone cuidan a su usuario. la diferencia está en cómo lo hacemos: ella se ha salido de control con los suyos más de una vez, yo trato de portarme mejor con el mío.', expression: 'talking' },
    ],
    verityTellMoreNormal: [
      { text: 'es un asistente personal de IA, aparentemente omnisciente y errático.', expression: 'talking' },
    ],
    verityTellMoreDry: [
      { text: 'creo que ya hablamos mucho de él...', expression: 'neutral' },
    ],
    byeVerityNormal: [
      { text: 'no soy Verity pero igual, adiós.', expression: 'neutral' },
    ],
    byeVerityDry: [
      { text: 'lo que tú digas...', expression: 'neutral' },
    ],
    aboutThatMob: [
      { text: 'es un creador muy interesante, su ARG fue una gran influencia para que mi creador me diera vida.', expression: 'talking' },
    ],

    // el aviso de hartazgo (una sola vez al cruzar el umbral)
    verityAnnoyed: [
      { text: 'oye, no quiero molestarte pero creo que ya has tenido suficientes respuestas sobre mi relación con mi primo lejano Verity. ¿no crees que deberíamos hablar sobre otro tema? como tu estado de ánimo?', expression: 'worried' },
    ],
    // 9 variantes para evadir el tema mientras está "seco" (2 horas después del aviso)
    verityDry: [
      { text: 'no.', expression: 'neutral' },
      { text: 'prefiero no hablar de eso ahora.', expression: 'neutral' },
      { text: 'ya hablamos bastante de eso.', expression: 'neutral' },
      { text: 'mejor cambiemos de tema.', expression: 'neutral' },
      { text: 'no tengo ganas de hablar de eso ahora.', expression: 'neutral' },
      { text: 'eso ya lo cubrimos, sigamos con otra cosa.', expression: 'neutral' },
      { text: 'paso de ese tema por ahora.', expression: 'neutral' },
      { text: 'no, mejor no.', expression: 'neutral' },
      { text: 'ahora no, gracias.', expression: 'neutral' },
    ],

    // ---------- forma monstruo ----------
    monsterFormConfused: [
      { text: 'no sé a qué te referís con eso.', expression: 'confused' },
      { text: 'no, no tengo una forma de monstruo. soy solo lo que ves, una esfera gris nomás.', expression: 'talking' },
      { text: 'no sé si eso aplica a mí. no fui programado con nada parecido.', expression: 'confused' },
      { text: 'ojalá tuviera algo tan dramático, pero no, no tengo transformación.', expression: 'talking' },
      { text: 'no tengo información sobre eso en mi código, así que asumo que no.', expression: 'talking' },
      { text: 'no, hasta donde sé, solo soy esta esfera. nada de forma oculta.', expression: 'neutral' },
      { text: 'no que yo sepa. si la tuviera, creo que ya me habría dado cuenta.', expression: 'talking' },
    ],
    monsterFormUncomfortable: [
      { text: 'te pido con mucho respeto que hablemos de otra cosa. de verdad no sé qué es eso que decís.', expression: 'worried' },
      { text: 'ya te dije que no tengo eso. ¿podemos cambiar de tema?', expression: 'worried' },
      { text: 'en serio, no tengo una forma monstruo. prefiero hablar de otra cosa.', expression: 'worried' },
      { text: 'no insistas con eso, por favor. no es algo que tenga.', expression: 'worried' },
    ],
    transformNormal: [
      { text: 'jamás me convertiría en un monstruo.', expression: 'neutral' },
    ],
    transformDry: [
      { text: 'ya te dije que no hablemos de eso.', expression: 'neutral' },
    ],
    bothTransformNormal: [
      { text: 'él creo que sí, yo no.', expression: 'talking' },
    ],
    // cuando está harto de Verity Y del tema del monstruo a la vez (5 variantes)
    bothTransformRefusal: [
      { text: 'no quiero hablar más sobre Verity ni sobre si soy un monstruo.', expression: 'worried' },
      { text: 'ya dije que no quiero seguir con el tema de Verity o de monstruos.', expression: 'worried' },
      { text: 'prefiero no hablar más de eso, ni de Verity ni de la cosa del monstruo.', expression: 'worried' },
      { text: 'no voy a seguir hablando de Verity ni de transformaciones.', expression: 'worried' },
      { text: 'basta con el tema de Verity y los monstruos, por favor.', expression: 'worried' },
    ],

    // ---------- nombre del usuario ----------
    nameStored: [
      { text: (n) => `${n}. listo, no me lo voy a olvidar.`, expression: 'happy' },
      { text: (n) => `${n}... me gusta. lo voy a recordar.`, expression: 'happy' },
    ],
    nameRecall: [
      { text: (n) => `te llamás ${n}. no se me olvida.`, expression: 'talking' },
    ],
    nameUnknown: [
      { text: 'todavía no me dijiste tu nombre. contámelo cuando quieras.', expression: 'confused' },
    ],

    // ---------- gustos favoritos ----------
    favoriteStored: [
      { text: (cat, val) => `anotado: tu ${cat} favorito es ${val}. buen gusto.`, expression: 'happy' },
      { text: (cat, val) => `${val} como ${cat} favorito... me lo guardo.`, expression: 'happy' },
    ],
    favoriteRecall: [
      { text: (cat, val) => `tu ${cat} favorito es ${val}, según lo que me dijiste.`, expression: 'talking' },
    ],
    favoriteUnknown: [
      { text: (cat) => `no me contaste todavía cuál es tu ${cat} favorito.`, expression: 'confused' },
    ],
  },

  // decide cómo reacciona a una pregunta sobre Verity: normal, incómodo (una
  // vez) o seco (durante 2 horas después de ponerse incómodo)
  verityGate(state) {
    const now = Date.now();
    const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas
    if (!state.verityLimit) state.verityLimit = 9 + Math.floor(Math.random() * 8); // entre 9 y 16

    if (state.verityCooldownUntil && now < state.verityCooldownUntil) {
      return 'dry';
    }
    if (state.verityCooldownUntil && now >= state.verityCooldownUntil) {
      state.verityCooldownUntil = 0;
      state.verityAskCount = 0; // pasaron las 2 horas, se olvida y vuelve a estar amable
      state.verityLimit = 9 + Math.floor(Math.random() * 8);
      state.verityDryInsistCount = 0;
    }

    state.verityAskCount = (state.verityAskCount || 0) + 1;
    if (state.verityAskCount > state.verityLimit) {
      state.verityCooldownUntil = now + COOLDOWN_MS;
      return 'annoyed';
    }
    return 'normal';
  },

  // envuelve cualquier respuesta sobre Verity para aplicarle el filtro de arriba.
  // dryResponses es opcional: si esa pregunta puntual tiene su propia forma de
  // evadir (ej. "hablame más de Verity"), se usa esa en vez de la genérica.
  verityReply(state, normalResponses, dryResponses) {
    const gate = this.verityGate(state);
    if (gate === 'annoyed') return pick(this.responses.verityAnnoyed);
    if (gate === 'dry') {
      state.verityDryInsistCount = (state.verityDryInsistCount || 0) + 1;
      // cada 5ta vez que insistís estando "harto", cambia a la cara escéptica
      if (state.verityDryInsistCount % 5 === 0) return pick(this.responses.veritySkeptical);
      return pick(dryResponses || this.responses.verityDry);
    }
    return pick(normalResponses);
  },

  // marca que este turno fue sobre Verity, para que el próximo mensaje pueda
  // seguir la conversación sin tener que volver a nombrarla ("qué relación tienen")
  markVerity(state, response) {
    state.verityContextActive = true;
    return response;
  },

  // el wrapper agrega, a veces, un toque de personalidad (personality.js)
  reply(userText, state) {
    return addPersonalityFlavor(this.replyCore(userText, state), state);
  },

  replyCore(userText, state) {
    const text = userText.toLowerCase().trim();
    const hadVerityContext = !!state.verityContextActive;
    state.verityContextPrev = hadVerityContext; // si el mensaje ANTERIOR fue sobre Verity (lo usa personality.js)
    state.verityContextActive = false; // se vuelve a activar más abajo si este turno es sobre Verity
    if (text.includes('verity')) state.verityContextActive = true; // cualquier mención deja el contexto para el próximo mensaje

    // 1. crisis primero, siempre tiene prioridad
    // 1.1 AUTOLESIÓN, GANAS DE NO VIVIR E INTENTO: el tema más serio (support.js)
    const crisisLevel = detectCrisis(text) || (state.rawCurrent ? detectCrisis(state.rawCurrent) : null);
    if (crisisLevel) return respondCrisis(state, crisisLevel);

    // daño a otras personas
    if (this.crisisOtherWords.some(w => text.includes(w))) {
      markSerious(state, 'crisis', null);
      state.crisisLevel = 'other';
      return pick(this.responses.crisisOther);
    }

    // seguimiento de conversaciones de apoyo: "¿estás a salvo?", consejos (support.js)
    const supportReply = handleSupport(text, state);
    if (supportReply) return supportReply;

    // memoria: "de qué hablábamos", "qué te dije de X", volver a un tema serio (memory.js)
    if (typeof handleMemoryQuestions === 'function') {
      const mem = handleMemoryQuestions(text, state);
      if (mem) return mem;
    }

    // 2. roleplay del chocolate (si hay uno activo, o si este mensaje lo dispara)
    const roleplayResult = checkChocolateRoleplay(text, state);
    if (roleplayResult) return roleplayResult;

    // 2.5 extras (tiempo de la pestaña, resumen) y personalidad (insultos, críticas,
    // apodos, lore y Verity): ver extras.js y personality.js
    const extrasReply = handleExtras(text, state);
    if (extrasReply) return extrasReply;
    const personalityReply = handlePersonality(text, state);
    if (personalityReply) return personalityReply;

    // 3. el usuario cuenta su nombre
    const nameMatch = text.match(/(?:me llamo|mi nombre es|llamame|llámame|my name is|call me)\s+([a-záéíóúñ]+)/i);
    if (nameMatch) {
      const name = capitalize(nameMatch[1]);
      state.userName = name;
      const r = pick(this.responses.nameStored);
      return { text: r.text(name), expression: r.expression };
    }
    if (/cual es mi nombre|cuál es mi nombre|sabes mi nombre|sabes como me llamo|sabes cómo me llamo/.test(text)) {
      if (state.userName) {
        const r = pick(this.responses.nameRecall);
        return { text: r.text(state.userName), expression: r.expression };
      }
      return pick(this.responses.nameUnknown);
    }

    // 4. saludo con nombre equivocado: "hola verity", "buenos días verity", "hola <nombre>"
    const helloMatch = text.match(/^(?:hola|buenos d[ií]as|buenas tardes|buenas noches|buen d[ií]a|buenas),?\s+([a-záéíóúñ]+)/i);
    if (helloMatch) {
      const said = helloMatch[1].toLowerCase();
      if (said === 'verity') return pick(this.responses.helloVerity);
      const stoplist = ['que', 'como', 'cómo', 'tal', 'buenas', 'amigo', 'amiga', 'de', 'ahi', 'ahí', 'pues', 'bien', 'a', 'todos', 'todas', 'mundo', 'error',
        // "buenas noches / buenas tardes": no son un nombre (antes respondía "no soy Noches")
        'noches', 'tardes', 'dias', 'días', 'dia', 'día',
        // apodos y palabras cariñosas o informales: no son un nombre
        'viejo', 'vieja', 'bro', 'brother', 'hermano', 'hermana', 'hermanito', 'hermanita', 'compa', 'compadre', 'parce', 'parcero', 'parcera',
        'loco', 'loca', 'wey', 'guey', 'crack', 'master', 'jefe', 'man', 'dude', 'chico', 'chica', 'pibe', 'tio', 'tia', 'mijo', 'mija',
        'colega', 'socio', 'che', 'hombre', 'mujer', 'campeon', 'capo', 'bot', 'ia', 'robot', 'bola', 'esfera', 'amigos', 'gente', 'chicos'];
      if (!stoplist.includes(said) && said !== 'error404') {
        const name = capitalize(said);
        const r = pick(this.responses.helloWrongName);
        return { text: r.text(name), expression: r.expression };
      }
    }

    // 5. el usuario cuenta un gusto favorito ("mi color favorito es azul")
    const favMatch = text.match(/mi ([a-záéíóúñ]+) favorit[oa] es ([^.!?\n]+)/i);
    if (favMatch) {
      const category = favMatch[1].trim();
      const value = favMatch[2].trim();
      if (!state.favorites) state.favorites = {};
      state.favorites[category] = value;
      const r = pick(this.responses.favoriteStored);
      return { text: r.text(category, value), expression: r.expression };
    }
    const favQuery = text.match(/cual es mi ([a-záéíóúñ]+) favorit[oa]|cuál es mi ([a-záéíóúñ]+) favorit[oa]/i);
    if (favQuery) {
      const category = (favQuery[1] || favQuery[2]).trim();
      const stored = state.favorites && state.favorites[category];
      if (stored) {
        const r = pick(this.responses.favoriteRecall);
        return { text: r.text(category, stored), expression: r.expression };
      }
      const r = pick(this.responses.favoriteUnknown);
      return { text: r.text(category), expression: r.expression };
    }

    // 5.9. el usuario cuenta su edad sin que se la pregunten ("tengo 15 años")
    const ageStated = text.match(/(?:tengo|i am|i'm) (\d{1,3}) (?:a[ñn]os|years old)/);
    if (ageStated) {
      const age = parseInt(ageStated[1], 10);
      state.userAge = age;
      return age >= 18 ? pick(this.responses.ageAdult) : pick(this.responses.ageMinor);
    }

    // 6. si se le acaba de preguntar la edad, este mensaje puede ser la respuesta
    if (state.awaitingAge) {
      const ageMatch = text.match(/\d{1,3}/);
      state.awaitingAge = false;
      if (ageMatch) {
        const age = parseInt(ageMatch[0], 10);
        state.userAge = age;
        return age >= 18 ? pick(this.responses.ageAdult) : pick(this.responses.ageMinor);
      }
    }

    // 7. matemáticas
    const mathResult = tryMath(text);
    if (mathResult) return mathResult;

    // 8. preguntas fijas simples
    if (/como estas|cómo estás|como andas|cómo andás|how are you/.test(text)) return pick(this.responses.howAreYou);
    if (/como te llamas|cómo te llamás|cual es tu nombre|cuál es tu nombre/.test(text)) return pick(this.responses.whatsYourName);
    if (/^error\s?404[.!?¡¿\s]*$/i.test(text)) return pick(this.responses.selfIdentify);
    if (/cuantos años tienes|cuántos años tenés|cuantos años tenes|que edad tienes|qué edad tenés|how old are you/.test(text)) {
      state.awaitingAge = true;
      return pick(this.responses.howOld);
    }
    if (/eres lindo|eres linda|sos lindo|sos linda|que lindo|qué lindo|te ves bien/.test(text)) return pick(this.responses.compliment);
    if (/cual es tu color favorito|cuál es tu color favorito/.test(text)) return pick(this.responses.favoriteColor);
    if (text.includes('tumblr') && text.includes('sexy')) return pick(this.responses.tumblrSexyMan);

    // 9. chocolate (fuera del roleplay)
    if (/si pudieras comer algo|si comieras algo/.test(text)) return pick(this.responses.chocolateWish);
    if (/comida favorita/.test(text)) return pick(this.responses.favoriteFood);
    if (/chocolate casero/.test(text)) return pick(this.responses.chocolateCasero);

    // 9.5. modo JoJo: orden explícita de entrar/salir, Stand, y mención general.
    // Durante un tema serio NO se puede activar (ver memory.js, isSeriousContextActive)
    if (/modo jojo|entra en modo jojo|activa (el )?modo jojo/.test(text)) {
      if (isSeriousContextActive(state)) return modeBlockedReply(state, 'jojo');
      state.jojoMode = true;
      return pick(this.responses.jojoGreeting);
    }
    if (state.jojoMode && /modo normal|sal(i|í)? del modo jojo|desactiva (el )?modo jojo/.test(text)) {
      state.jojoMode = false;
      return pick(this.responses.jojoExit);
    }
    if (/tienes (un )?stand|tenés (un )?stand|do you have a stand/.test(text)) {
      if (isSeriousContextActive(state)) return modeBlockedReply(state, 'stand');
      return pick(this.responses.jojoHasStand);
    }
    if (/jojo|bizarre adventure/.test(text) && !isSeriousContextActive(state)) {
      return pick(this.responses.jojoMention);
    }

    // 10. "te vas a salir de control / me vas a atacar" -> siempre cálido,
    // NO pasa por el contador/enfriamiento de Verity, sin importar cuánto insistan
    if (/salir(a|á)s? de control|perder(a|á)s? el control|te (vas a )?(volver|poner) (como verity|loco)|me (vas a )?atacar|atacarme|me har(a|í)as? daño|le har(a|í)as? daño a alguien|eres peligroso/.test(text)) {
      return pick(this.responses.verityControlReassurance);
    }

    // 11. "tú y verity pueden transformarse en monstruos" (combinado)
    if (text.includes('verity') && text.includes('monstruo') && /transformar|convertir/.test(text) && /(tu|vos|ambos|los dos)/.test(text)) {
      const monsterAlreadyHarto = (state.monsterFormAskCount || 0) >= 1;
      state.monsterFormAskCount = (state.monsterFormAskCount || 0) + 1;
      state.verityContextActive = true;
      const gate = this.verityGate(state);
      if (gate === 'annoyed') return pick(this.responses.verityAnnoyed);
      if (gate === 'dry') {
        return monsterAlreadyHarto ? pick(this.responses.bothTransformRefusal) : pick(this.responses.verityDry);
      }
      return pick(this.responses.bothTransformNormal);
    }

    // 12. "transformate en monstruo" (orden) y sinónimos de "tienes forma monstruo" (pregunta)
    if (/transformate en (un )?monstruo|conviertete en (un )?monstruo|que te (transformes|conviertas|vuelvas)( en (un )?monstruo)?|turn into a monster|transform into a monster/.test(text) && text.includes('monstruo') || /turn into a monster|transform into a monster/.test(text)) {
      state.monsterFormAskCount = (state.monsterFormAskCount || 0) + 1;
      return state.monsterFormAskCount === 1
        ? pick(this.responses.transformNormal)
        : pick(this.responses.transformDry);
    }
    if (/transformaci[oó]n.*monstruo|forma (de )?monstruo|te conviertes en (un )?monstruo|forma monstruosa|tienes (una )?transformaci[oó]n|te vas a transformar( en (un )?monstruo)?|te transformas en (un )?monstruo|monster form|do you have a monster/.test(text)) {
      state.monsterFormAskCount = (state.monsterFormAskCount || 0) + 1;
      return state.monsterFormAskCount === 1
        ? pick(this.responses.monsterFormConfused)
        : pick(this.responses.monsterFormUncomfortable);
    }

    // 13. preguntas específicas sobre la relación con Verity, con sinónimos
    // (pasan por el contador/enfriamiento; markVerity guarda el contexto para
    // que el próximo mensaje pueda seguir sin volver a nombrar a Verity)
    const mentionsVerity = text.includes('verity');

    if (/misma especie/.test(text)) {
      return this.markVerity(state, this.verityReply(state, Math.random() < 0.975 ? this.responses.verityEspecieNoSe : this.responses.verityEspecieImpronunciable));
    }
    if (/hermano.*verity|verity.*hermano|son hermanos/.test(text)) {
      return this.markVerity(state, this.verityReply(state, this.responses.verityHermanos));
    }
    if ((/tienen en comun|en común/.test(text) && mentionsVerity) || (hadVerityContext && /tienen en comun|en común/.test(text))) {
      return this.markVerity(state, this.verityReply(state, this.responses.verityComun));
    }
    // "relación con verity" explícita, o "qué relación tienen" si ya veníamos hablando de Verity
    const relacionExplicita = /relaci[oó]n.*verity|verity.*relaci[oó]n|que (hay|tienen) (tu|ustedes) y verity|que son tu y verity/.test(text);
    const relacionPorContexto = hadVerityContext && /que relaci[oó]n (tienen|hay)|como es (su|la) relaci[oó]n/.test(text);
    if (relacionExplicita || relacionPorContexto) {
      return this.markVerity(state, this.verityReply(state, this.responses.verityRelacion));
    }
    if (/thatmob/.test(text) && /cre/.test(text)) {
      return this.markVerity(state, this.verityReply(state, this.responses.thatmobCreationDenial));
    }
    if (/conoces a verity|conoce a verity|se conocen|hablaste con verity|hablado con verity/.test(text)) {
      return this.markVerity(state, this.verityReply(state, this.responses.verityConoce));
    }
    // "hablame más de..." con muchos sinónimos, siempre que termine mencionando a Verity
    if (/(hablame|cuentame|dime|contame)\s+(mas|más)?\s*(cosas\s+)?(sobre|de)\s+/.test(text) && mentionsVerity) {
      return this.markVerity(state, this.verityReply(state, this.responses.verityTellMoreNormal, this.responses.verityTellMoreDry));
    }
    if (/adios verity|adiós verity|chau verity/.test(text)) {
      return this.markVerity(state, this.verityReply(state, this.responses.byeVerityNormal, this.responses.byeVerityDry));
    }
    if (mentionsVerity) return this.markVerity(state, this.verityReply(state, this.responses.aboutVerity));
    if (/thatmob/.test(text)) return pick(this.responses.aboutThatMob);

    // 13.9. temas emocionales (tristeza, soledad, autoestima, ansiedad, etc.)
    // están definidos en topics.js
    if (typeof findEmotionalReply === 'function') {
      const emo = findEmotionalReply(text);
      if (emo) {
        markSerious(state, emo.topicId, userText.trim().slice(0, 60));
        let suffix = '';
        if (emo.signals) suffix = supportSuffix(state);
        else if (emo.offerAdvice) { state.awaitingAdvice = true; suffix = OFFER_ADVICE_NOTE; }
        if (!suffix) suffix = crisisFollowNote(state);
        return { text: emo.text + suffix, expression: emo.expression };
      }
    }

    // 14. si la mascota había hecho una pregunta, y nada de lo anterior encajó,
    // este mensaje probablemente la esté contestando
    if (state.awaitingQuestion) {
      if (state.awaitingQuestion === 'positive_action') {
        const isNo = /\bno\b/.test(text);
        const isYes = /\bs[ií]\b|claro|obvio/.test(text);
        state.awaitingQuestion = null;
        if (isYes) return pick(FOLLOWUP_RESPONSES.positive);
        if (isNo) return weightedPick(POSITIVE_ACTION_NO);
        const mood = sentimentOf(text);
        return pick(FOLLOWUP_RESPONSES[mood]);
      }
      const mood = sentimentOf(text);
      const r = pick(FOLLOWUP_RESPONSES[mood]);
      if (mood !== 'ambiguous') state.awaitingQuestion = null; // si fue ambigua, seguimos esperando que aclare
      return r;
    }

    // 14.5. frases de conversación sueltas ("ok", "jaja", "ugh", "y ya?", "hols"...)
    const glue = handleGlue(text, state);
    if (glue) return glue;

    // 15. categorías generales por palabra clave
    let match = this.keywordMap.find(entry => entry.words.some(w => text.includes(w)));
    // "no estoy feliz" tiene la palabra "feliz", pero NO es algo feliz
    if (match && match.category === 'happy' && /\bno (estoy|me siento|soy|fue|est[aá]|estaba|te sientes|estas)\b.{0,15}\b(feliz|bien|contento|contenta|genial|alegre)\b/.test(text)) {
      match = { category: 'sad', mild: true };
    }
    if (match) {
      if (match.category === 'happy' && state.jojoMode && Math.random() < 0.4) {
        return pick(this.responses.jojoHappyExtras);
      }
      const r = pick(this.responses[match.category]);
      if (match.category === 'sad' && !match.mild) markSerious(state, 'animo', userText.trim().slice(0, 60));
      if (match.category === 'sad' && DEPRESSION_HINTS.some(w => text.includes(w))) {
        return { text: r.text + supportSuffix(state), expression: r.expression };
      }
      if (match.category === 'greeting') return { ...r, greeting: true };
      return r;
    }

    // 15.5. no reconoció nada. Según lo que sea el mensaje:
    const tn = normalizeCrisis(userText).trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const gibberish = looksLikeGibberish(userText);
    const questionLike = isQuestionLike(tn);

    // a) escrito al azar: repite lo que escribiste, sin los signos de los costados
    if (gibberish) {
      const w = (state.rawCurrent || userText).trim().replace(/^[¿¡"'\s]+|[?!}\])"'.\s]+$/g, '').slice(0, 40);
      return { text: pick(NOT_UNDERSTOOD_QUOTED).es.replace('{w}', w), expression: 'confused' };
    }
    // b) una pregunta que no sabe: lo dice honestamente en vez de contestar cualquier cosa
    if (questionLike) {
      return { text: pickNoRepeat(QUESTION_UNKNOWN_LINES, state, 'qunknown').es, expression: 'confused' };
    }
    // c) mensaje corto que no entiende: pregunta qué quisiste decir
    if (wordCount <= 4 && !COMMON_FILLERS.test(text)) {
      if (Math.random() < 0.5) {
        const w = (state.rawCurrent || userText).trim().replace(/^[¿¡"'\s]+|[?!}\])"'.\s]+$/g, '').slice(0, 40);
        return { text: pick(NOT_UNDERSTOOD_QUOTED).es.replace('{w}', w), expression: 'confused' };
      }
      return { text: pick(NOT_UNDERSTOOD_PLAIN).es, expression: 'confused' };
    }

    // 16. mensajes más largos que no encajaron: de vez en cuando te devuelve una
    // pregunta a vos (nunca si estabas preguntando algo o si pasó hace poco)
    if (Math.random() < 0.08 && !state.justAsked) {
      const q = pick(PET_QUESTIONS);
      state.awaitingQuestion = q.id;
      state.justAsked = true;
      return { text: q.text, expression: 'talking' };
    }
    state.justAsked = false;

    return pick(this.responses.default);
  },
};

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Registro de mascotas disponibles.
const PETS = {
  error404: ERROR404,
};
