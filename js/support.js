/*
  support.js
  ----------
  El tema MÁS serio que maneja la mascota: autolesión, ganas de no vivir e
  intento de suicidio. Tiene prioridad sobre todo lo demás (incluso sobre el
  modo Verity, que se apaga si aparece algo de esto).

  Qué hace:
  1. detectCrisis(texto): reconoce 3 niveles, en español e inglés:
       'attempt'  -> intento o plan inmediato (lo más urgente)
       'suicide'  -> ganas de no vivir / morir / suicidarse
       'selfharm' -> autolesión (hacerse daño, cortarse, etc.)
  2. respondCrisis(): responde con cuidado, sin juzgar ni regañar, con las
     líneas de ayuda, y pregunta si la persona está a salvo.
  3. handleSupport(): sigue la conversación (¿estás a salvo?, ¿querés
     consejos?) y da consejos cuando los pedís.

  De dónde salen los consejos: la guía de soledad y la de depresión de
  Cigna Healthcare (cigna.com), reescritas con palabras propias, más
  recomendaciones generales de seguridad. Los navegadores NO permiten leer
  páginas de otros sitios desde una web (bloqueo CORS), por eso el contenido
  está guardado acá y el bot solo agrega el enlace a la fuente.

  LÍNEAS DE AYUDA (verificadas en la página oficial del Ministerio de Salud y en su
  directorio 2026, y en prensa de 2026):
    - Línea 106: línea nacional de salud mental, gratuita, confidencial, 24 horas.
    - Línea 125 (CRUED): urgencias y apoyo psicológico en Cartagena y Bolívar, 24 horas.
    - 123: emergencias.   - 141: ICBF (niños y adolescentes; sin verificar por mi cuenta).
  (La Línea 192 opción 4 se sacó: solo figuraba en fuentes viejas.)
  Si las líneas cambian, buscá "106" y "125" en este archivo.

  Seguridad de los mensajes: nunca se explican métodos, nunca se dice que
  hacerse daño "sirve", y no se sugieren sustitutos que dañen o sean dolorosos.
*/

// ---------- notas que se pegan al final de una respuesta ----------
const COLOMBIA_HELPLINE_NOTE =
  ' si esto se está volviendo pesado de llevar solo/a, en Colombia podés llamar a la Línea 106 (salud mental, gratuita, las 24 horas, en todo el país). en Cartagena y Bolívar también está la Línea 125. si estás en peligro ahora, llamá al 123. no hace falta que sea una emergencia para llamar.';
// se agrega al final de cada respuesta de crisis
const REGION_NOTE = ' si estás en Cartagena o Bolívar, también podés llamar a la Línea 125 (CRUED, las 24 horas).';
const OFFER_ADVICE_NOTE =
  ' si querés, puedo contarte algunas cosas que a otras personas les ayudan. decime "sí" o pedime consejos.';

const LINK_NOTES = {
  soledad: {
    es: ' si querés leer más (es información general, no reemplaza a un profesional): https://www.cigna.com/es-us/knowledge-center/how-to-deal-with-loneliness',
    en: ' if you want to read more (general information, it does not replace a professional): https://www.cigna.com/knowledge-center/how-to-deal-with-loneliness',
  },
  tristeza: {
    es: ' si querés leer más (es información general, no reemplaza a un profesional): https://www.cigna.com/es-us/knowledge-center/understanding-depression',
    en: ' if you want to read more (general information, it does not replace a professional): https://www.cigna.com/knowledge-center/understanding-depression',
  },
};

// para el traductor: cada nota y su versión en inglés
const SUFFIX_NOTES = [
  { es: COLOMBIA_HELPLINE_NOTE,
    en: " if this is getting heavy to carry alone, in Colombia you can call Line 106 (mental health, free, 24 hours, nationwide). in Cartagena and Bolívar there is also Line 125. if you're in danger now, call 123. it doesn't have to be an emergency to call." },
  { es: REGION_NOTE,
    en: ' if you are in Cartagena or Bolívar, you can also call Line 125 (CRUED, 24 hours).' },
  { es: OFFER_ADVICE_NOTE,
    en: ` if you want, I can tell you some things that help other people. say "yes" or ask me for advice.` },
  LINK_NOTES.soledad,
  LINK_NOTES.tristeza,
];

// ---------- detección ----------
function normalizeCrisis(raw) {
  return raw.toLowerCase().replace(/ñ/g, 'n').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// (el texto ya viene sin tildes y con la ñ convertida en n)
const ATTEMPT_RE = /intente (suicidarme|quitarme la vida|matarme)|intento de suicidio|me tome (muchas|todas las|demasiadas) pastillas|pastillas para (morir|matarme|no despertar)|me (voy a|quiero) (matar|suicidar|quitar la vida) (hoy|ahora|esta noche|ya)|(hoy|esta noche|ahora) me (mato|suicido|quito la vida)|tengo (un )?plan para (morir|matarme|suicidarme|quitarme la vida)|ya (lo )?decidi (morir|matarme|suicidarme)|tried to kill myself|i attempted suicide|i took (too many |a lot of )?pills|(going to|gonna) kill myself (tonight|today|now)|i have a plan to (die|kill myself)/;

const SUICIDE_RE = /quiero morir|quiero morirme|me quiero morir|me quiero matar|quiero matarme|quiero suicidarme|me quiero suicidar|no quiero (seguir )?(vivir|existir)|ya no quiero vivir|quisiera (no existir|morirme|desaparecer para siempre|no despertar)|quiero desaparecer|mejor (estar )?muert[oa]|pienso en (el )?suicidio|pensando en (el )?suicidio|pensamientos suicidas|ideas suicidas|idea de suicid|quitarme la vida|acabar con mi vida|terminar con mi vida|acabar con todo|seria mejor sin mi|nadie me extranaria|no vale la pena vivir|ya no aguanto mas (vivir|esta vida)|suicid|want to die|wanna die|kill myself|end my life|suicidal|don.?t want to live|better off dead|wish i (was|were) dead|take my own life/;

const SELFHARM_RE = /me (hago|hice|estoy haciendo|he hecho|sigo haciendo) (dano|cortes|heridas)|me (corto|cortaba|estoy cortando|he cortado|seguia cortando) (los |las |el |la )?(brazos?|munecas?|piernas?|muslos?|a proposito|para (sentir|calmar|desahogar|castigar|olvidar))|autolesion|auto ?lesion|autolastim|me lastimo (a proposito|adrede|para)|me (quemo|golpeo|rasguno|pellizco) (a proposito|adrede|para (sentir|calmar|castigar|olvidar))|quiero (hacerme dano|lastimarme|autolesionarme)|(ganas|deseos) de (hacerme dano|lastimarme|cortarme)|voy a (hacerme dano|lastimarme)|hacerme dano|lastimarme|cortarme(?!\s+(el|la|las|los)\s+(pelo|cabello|barba|unas|flequillo|fleco))|self.?harm|(i|i'm|im) (hurt|hurting|cut|cutting|harm|harming) myself|hurt myself|cut myself/;

function detectCrisis(text) {
  const t = normalizeCrisis(text);
  if (ATTEMPT_RE.test(t)) return 'attempt';
  if (SUICIDE_RE.test(t)) return 'suicide';
  if (SELFHARM_RE.test(t)) return 'selfharm';
  return null;
}

// ---------- respuestas a una crisis ----------
const CRISIS_LINES = {
  selfharm: [
    { es: `gracias por decírmelo. sé que no es fácil contar algo así, y no voy a juzgarte. lo que sentís importa, y merecés cuidado, no dolor. no tenés que pasar por esto solo/a: contale a alguien de confianza o llamá a la Línea 106 (salud mental, gratuita, las 24 horas, en toda Colombia). si te hiciste una herida que necesita atención, o estás en peligro ahora, llamá al 123. ¿estás a salvo en este momento?`,
      en: `thank you for telling me. I know it isn't easy to share something like this, and I won't judge you. what you feel matters, and you deserve care, not pain. you don't have to go through this alone: tell someone you trust or call Line 106 (mental health, free, 24 hours, across Colombia). if you hurt yourself and the wound needs attention, or you're in danger right now, call 123. are you safe right now?` },
    { es: `lo que me contás me preocupa, y me alegra que lo hayas dicho. cuando duele tanto por dentro, a veces uno busca un alivio que termina lastimando más. hay personas preparadas para acompañarte sin juzgarte: la Línea 106, atiende las 24 horas. y si hay peligro ahora, el 123. ¿podés alejarte de lo que usás para hacerte daño y quedarte cerca de alguien? ¿estás a salvo ahora?`,
      en: `what you're telling me worries me, and I'm glad you said it. when it hurts so much inside, sometimes a person looks for relief that ends up hurting more. there are people prepared to be with you without judging you: Line 106, answers 24 hours. and if there is danger now, 123. can you move away from what you use to hurt yourself and stay near someone? are you safe now?` },
    { es: `no estás roto/a ni sos un problema por sentirte así. hacerse daño suele ser una señal de que hay un dolor muy grande que necesita ser escuchado, y eso se puede trabajar con ayuda profesional. te propongo algo: hoy contale a una persona de confianza lo que me contaste a mí. y si querés hablar ahora mismo con alguien preparado, la Línea 106, está las 24 horas. ¿estás a salvo en este momento?`,
      en: `you're not broken, and you're not a problem for feeling this way. hurting yourself is often a sign of a very big pain that needs to be heard, and that can be worked on with professional help. here's what I suggest: today, tell a person you trust what you told me. and if you want to talk right now with someone prepared, Line 106, is open 24 hours. are you safe at this moment?` },
    { es: `te escucho, de verdad. quiero que sepas que existen otras formas de atravesar este dolor, y que no hace falta que lo hagas a solas. hablar con un profesional de salud mental puede cambiar mucho las cosas. mientras tanto, la Línea 106, te puede acompañar a cualquier hora, y el 123 si estás en peligro. ¿ahora mismo estás a salvo?`,
      en: `I'm listening, truly. I want you to know there are other ways to get through this pain, and you don't have to do it alone. talking to a mental health professional can change a lot. in the meantime, Line 106, can be with you at any hour, and 123 if you're in danger. are you safe right now?` },
    { es: `gracias por la confianza. me importa cómo estás, no solo lo que hacés. si sentís que podrías hacerte daño ahora, alejate de lo que podrías usar, buscá a alguien cerca, y llamá al 123 o a la Línea 106. no tenés que esperar a que sea "suficientemente grave" para pedir ayuda. ¿hay alguien de confianza cerca tuyo ahora?`,
      en: `thank you for trusting me. I care how you are, not just what you do. if you feel you might hurt yourself now, move away from what you could use, find someone nearby, and call 123 or Line 106. you don't have to wait until it's "serious enough" to ask for help. is there someone you trust near you now?` },
    { es: `no voy a regañarte: lo que necesitás es cuidado y apoyo. hacerte daño no resuelve lo que te está doliendo por dentro, y hay gente que puede ayudarte a encontrar otros caminos. te recomiendo hablar hoy con un adulto de confianza o con un profesional. la Línea 106, atiende las 24 horas. ¿estás a salvo ahora?`,
      en: `I'm not going to scold you: what you need is care and support. hurting yourself doesn't solve what's hurting you inside, and there are people who can help you find other paths. I recommend talking today with a trusted adult or a professional. Line 106, answers 24 hours. are you safe now?` },
  ],
  suicide: [
    { es: `lo que decís me preocupa mucho, y me importa lo que te pasa. no te voy a juzgar. cuando el dolor es tan grande, a veces parece que no hay otra salida, pero el dolor cambia, y tu vida es la única que tenés: merece la oportunidad de sentirse distinta. no tenés que atravesar esto solo/a. llamá hoy a la Línea 106 (salud mental, gratuita, 24 horas, en toda Colombia), o al 123 si estás en peligro ahora. ¿estás a salvo en este momento?`,
      en: `what you're saying worries me a lot, and I care about what's happening to you. I won't judge you. when the pain is this big, sometimes it seems like there's no other way out, but pain changes, and your life is the only one you have: it deserves the chance to feel different. you don't have to go through this alone. call Line 106 (mental health, free, 24 hours, nationwide) today, or 123 if you're in danger now. are you safe at this moment?` },
    { es: `gracias por decírmelo, no debe ser nada fácil. me importás, y quiero que estés bien. pensar en morir suele aparecer cuando el sufrimiento se vuelve insoportable, no porque tu vida no valga: sí vale, y el dolor puede aliviarse con ayuda. por favor hablá hoy con alguien de confianza o llamá a la Línea 106. si sentís que podrías hacerlo ahora, llamá al 123. ¿estás a salvo ahora?`,
      en: `thank you for telling me, it can't be easy. you matter to me, and I want you to be okay. thinking about dying tends to appear when suffering becomes unbearable, not because your life isn't worth it: it is, and the pain can ease with help. please talk to someone you trust today or call Line 106. if you feel you might do it now, call 123. are you safe now?` },
    { es: `te escucho, y no voy a dejarte solo/a con esto. tu vida es única y no se repite; eso la vuelve valiosa incluso cuando hoy no lo sientas así. quitarse la vida es algo que no tiene vuelta atrás, y lo que hoy duele tanto se puede tratar con ayuda. por favor, llamá a la Línea 106, o al 123 si hay peligro. ¿hay alguien cerca con quien puedas estar ahora?`,
      en: `I'm listening, and I won't leave you alone with this. your life is unique and doesn't repeat; that makes it valuable even when you don't feel that today. taking your own life can't be undone, and what hurts so much today can be treated with help. please call Line 106, or 123 if there is danger. is there someone nearby you can be with now?` },
    { es: `lamento muchísimo que estés sintiéndote así. no tenés que ser fuerte ahora, solo tenés que no estar solo/a. contale a alguien de confianza lo que me dijiste, y si querés hablar con alguien preparado ya mismo, la Línea 106, atiende las 24 horas; en Cartagena y Bolívar también está la Línea 125. si estás en peligro, el 123. ¿estás a salvo ahora?`,
      en: `I'm so sorry you're feeling this way. you don't have to be strong now, you just have to not be alone. tell someone you trust what you told me, and if you want to talk to someone prepared right away, Line 106, answers 24 hours; in Cartagena and Bolívar there is also Line 125. if you're in danger, 123. are you safe now?` },
    { es: `esto es lo más serio que me podés contar, y por eso lo tomo con toda la seriedad. no estás exagerando. y también creo que hay otras salidas aunque hoy no las veas: este dolor puede cambiar con acompañamiento. te pido que hoy hables con alguien de confianza y llames a la Línea 106. si sentís que estás en peligro ahora, el 123. ¿estás a salvo?`,
      en: `this is the most serious thing you can tell me, and that's why I take it with complete seriousness. you're not exaggerating. and I also believe there are other ways out even if you can't see them today: this pain can change with support. I ask you to talk to someone you trust today and call Line 106. if you feel you're in danger now, 123. are you safe?` },
    { es: `no quiero que te quedes solo/a con estos pensamientos. tu vida importa, y es la única que tenés: vale la pena darle una oportunidad a que las cosas cambien, con ayuda. un profesional puede acompañarte. la Línea 106, está las 24 horas, y el 123 si es una urgencia. ¿me contás si estás a salvo ahora?`,
      en: `I don't want you to stay alone with these thoughts. your life matters, and it's the only one you have: it's worth giving things a chance to change, with help. a professional can be with you. Line 106, is open 24 hours, and 123 if it's an emergency. will you tell me if you're safe now?` },
  ],
  attempt: [
    { es: `me preocupa muchísimo lo que me contás, y es urgente. si ya hiciste algo para hacerte daño, o sentís que podés hacerlo ahora, llamá al 123 ya mismo, o pedile a alguien que te lleve a urgencias. por favor no te quedes solo/a: buscá a una persona cerca, ahora. yo estoy acá, pero necesitás ayuda de verdad. ¿hay alguien con vos?`,
      en: `what you're telling me worries me enormously, and it's urgent. if you've already done something to hurt yourself, or you feel you could do it now, call 123 right away, or ask someone to take you to the emergency room. please don't stay alone: find a person nearby, now. I'm here, but you need real help. is anyone with you?` },
    { es: `gracias por decírmelo. ahora lo más importante es tu seguridad: si tomaste algo, si te hiciste daño, o si tenés un plan para hacerlo, llamá al 123 ahora o andá a urgencias, y pedile a alguien de confianza que esté con vos. la Línea 106, también atiende las 24 horas. tu vida importa. ¿podés avisarle a alguien ahora?`,
      en: `thank you for telling me. right now the most important thing is your safety: if you took something, hurt yourself, or have a plan to do it, call 123 now or go to the emergency room, and ask someone you trust to be with you. Line 106, also answers 24 hours. your life matters. can you tell someone now?` },
    { es: `esto es una urgencia y quiero que estés a salvo. llamá al 123 ahora o pedí que te lleven a un centro de salud. si hay alguien cerca, avisale, no te quedes solo/a. después, con calma, hablamos de todo lo que te duele. ¿hay alguien cerca tuyo en este momento?`,
      en: `this is an emergency and I want you to be safe. call 123 now or ask to be taken to a health center. if someone is nearby, tell them, don't stay alone. afterwards, calmly, we'll talk about everything that hurts. is anyone near you right now?` },
    { es: `no estás solo/a, y lo que decís es serio. por favor llamá al 123 ya, o pedí ayuda a alguien que esté cerca para ir a urgencias. alejate de cualquier cosa con la que puedas hacerte daño. yo me quedo acá, pero necesitás a alguien presente contigo. ¿hay alguien?`,
      en: `you're not alone, and what you're saying is serious. please call 123 now, or ask someone nearby for help to go to the emergency room. move away from anything you could hurt yourself with. I'll stay here, but you need someone present with you. is there anyone?` },
  ],
};

// después de preguntar "¿estás a salvo?"
const SAFE_LINES = [
  { es: `me alegra saberlo, gracias por contestarme. lo que me contaste sigue siendo importante: ¿te parece si hoy se lo contás a alguien de confianza? y si querés que te cuente algunas cosas que ayudan, decime "sí".`,
    en: `I'm glad to know it, thank you for answering. what you told me is still important: would it be okay to tell someone you trust today? and if you want me to tell you some things that help, say "yes".` },
  { es: `qué bueno que estés a salvo ahora. no hace falta que sigas solo/a con esto. si querés, hablamos de lo que te está pasando, y también puedo contarte cosas que le han servido a otras personas. ¿querés?`,
    en: `I'm glad you're safe now. you don't have to keep going through this alone. if you want, we can talk about what's happening to you, and I can also tell you things that have helped other people. do you want that?` },
  { es: `gracias por decírmelo. me quedo más tranquilo. igual, lo que sentís merece atención: hablarlo con alguien de confianza o con un profesional puede ayudar mucho. ¿querés que te cuente algunas ideas que pueden servirte?`,
    en: `thank you for telling me. I feel more at ease. still, what you feel deserves attention: talking to someone you trust or a professional can help a lot. do you want me to tell you some ideas that might help?` },
  { es: `me alegra. gracias por responderme. quedate cerca de alguien si podés, y no dejes de pedir ayuda si la idea vuelve. ¿querés que te cuente algunas cosas que pueden ayudar?`,
    en: `I'm glad. thank you for answering. stay near someone if you can, and don't stop asking for help if the thought comes back. do you want me to tell you some things that can help?` },
];
const UNSAFE_LINES = [
  { es: `gracias por ser honesto/a. entonces lo primero es tu seguridad: llamá al 123 ahora, o pedile a alguien que esté cerca que te acompañe a urgencias. la Línea 106, también está las 24 horas. no te quedes solo/a, por favor.`,
    en: `thank you for being honest. then the first thing is your safety: call 123 now, or ask someone nearby to go with you to the emergency room. Line 106, is also open 24 hours. please don't stay alone.` },
  { es: `te agradezco que me lo digas. no estás solo/a: llamá al 123 ahora mismo, o buscá a alguien de confianza que esté cerca y quedate con esa persona. la Línea 106, te atiende a cualquier hora. tu vida importa.`,
    en: `I appreciate you telling me. you're not alone: call 123 right now, or find someone you trust nearby and stay with that person. Line 106, answers at any hour. your life matters.` },
  { es: `gracias por decírmelo. ahora lo importante es que estés con alguien y que pidas ayuda: llamá al 123 o pedile a una persona cercana que te lleve a un centro de salud. yo sigo acá, pero necesitás a alguien presente.`,
    en: `thank you for telling me. what matters now is that you're with someone and that you ask for help: call 123 or ask a nearby person to take you to a health center. I'm still here, but you need someone present.` },
  { es: `entiendo. no tenés que resolverlo solo/a. por favor llamá al 123 o a la Línea 106, ahora, y avisale a alguien cercano lo que está pasando. cuando estés acompañado/a, seguimos hablando.`,
    en: `I understand. you don't have to solve it alone. please call 123 or Line 106, now, and tell someone close what's going on. when you're accompanied, we'll keep talking.` },
];

const NO_ADVICE_LINES = [
  { es: `está bien, sin presión. si más adelante querés consejos, solo pedímelos. y acá sigo para escucharte.`,
    en: `that's okay, no pressure. if you want advice later, just ask me. and I'm still here to listen.` },
  { es: `de acuerdo. no te voy a llenar de consejos si no querés. lo que sí quiero es que sepas que acá podés hablar cuando lo necesites.`,
    en: `alright. I won't fill you with advice if you don't want it. what I do want is for you to know you can talk here whenever you need.` },
  { es: `entendido. cuando quieras, pedime consejos o simplemente contame cómo estás. te escucho.`,
    en: `understood. whenever you want, ask me for advice or just tell me how you are. I'm listening.` },
];
const ADVICE_NO_TOPIC_LINES = [
  { es: `con gusto te ayudo. contame un poco qué te está pasando, y vemos juntos qué podría servirte.`,
    en: `I'm glad to help. tell me a little about what's happening to you, and we'll see together what might help.` },
  { es: `quiero ayudarte, pero primero necesito entender qué te pasa. ¿querés contármelo, aunque sea un poquito?`,
    en: `I want to help you, but first I need to understand what's going on. do you want to tell me, even just a little?` },
  { es: `estoy acá para ayudarte. ¿qué es lo que más te está pesando ahora?`,
    en: `I'm here to help you. what's weighing on you the most right now?` },
];

// ---------- consejos ----------
// soledad: basado en la guía "Cómo manejar la soledad" de Cigna, con palabras propias
// tristeza/depresión: basado en "Entender la depresión" de Cigna, con palabras propias
// autolesión y suicidio: recomendaciones generales de seguridad
const ADVICE = {
  soledad: [
    { es: `algo que ayuda con la soledad es empezar por reconocerla: ponerle nombre a lo que sentís ya es un paso. hablar con un familiar o un amigo y decirles que te sentís solo/a, o con un psicólogo o consejero, puede ayudarte a entender qué la está alimentando.`,
      en: `something that helps with loneliness is starting by recognizing it: naming what you feel is already a step. talking to a relative or a friend and telling them you feel lonely, or to a psychologist or counselor, can help you understand what is feeding it.` },
    { es: `con el mundo virtual hay que ir con cuidado: chatear, jugar en línea con otras personas o participar en comunidades puede acompañarte, pero las redes sociales a veces hacen sentir más solo/a, porque muestran vidas perfectas que no son la realidad. si después de estar conectado/a te sentís peor, es buena señal para desconectarte un rato.`,
      en: `you have to be careful with the virtual world: chatting, playing online with other people or joining communities can keep you company, but social media sometimes makes you feel lonelier, because it shows perfect lives that aren't reality. if you feel worse after being online, it's a good sign to log off for a while.` },
    { es: `hacer voluntariado es una forma muy buena de sentirse menos solo/a: colaborar con otras personas por una causa (un refugio de animales, un comedor comunitario, leerle a niños) ayuda a conocer gente nueva, baja el estrés y te hace sentir útil. si es en tu barrio o comunidad, mejor, porque después te los volvés a cruzar.`,
      en: `volunteering is a great way to feel less alone: working with other people for a cause (an animal shelter, a community kitchen, reading to children) helps you meet new people, lowers stress and makes you feel useful. if it's in your neighborhood or community, even better, because you'll run into them again.` },
    { es: `también ayudan los grupos o clubes con intereses en común (deportes, arte, juegos, música, lectura): la amistad se arma más fácil cuando ya hay algo que compartís. podés buscarlos en internet o en tu comunidad.`,
      en: `groups or clubs with shared interests also help (sports, art, games, music, reading): friendship builds more easily when you already share something. you can look for them online or in your community.` },
    { es: `y no te olvides de cuidarte: moverte un poco, tomar luz del sol, comer bien y dormir mejor influyen mucho en cómo te sentís. para dormir mejor: horarios parecidos todos los días, sin pantallas un rato antes, y el cuarto oscuro y en silencio.`,
      en: `and don't forget to look after yourself: moving a little, getting sunlight, eating well and sleeping better influence a lot how you feel. to sleep better: similar hours every day, no screens a while before, and a dark, quiet room.` },
  ],
  tristeza: [
    { es: `un primer paso importante es no quedarte con esto solo/a: contale a alguien de confianza cómo te sentís. y si la tristeza dura mucho, o te quita las ganas de todo, conviene hablar con un profesional de la salud: primero un chequeo médico, porque a veces hay causas físicas, y después terapia o consejería, que ayudan mucho cuando algo te dolió o cambió tu vida.`,
      en: `an important first step is not to keep this to yourself: tell someone you trust how you feel. and if the sadness lasts a long time, or takes away your desire to do anything, it's a good idea to talk to a health professional: first a medical check-up, because sometimes there are physical causes, and then therapy or counseling, which help a lot when something hurt you or changed your life.` },
    { es: `también ayuda cuidar lo básico, aunque cueste: moverte un poco (caminar, andar en bici, nadar), comer lo más equilibrado que puedas, y dormir a horarios parecidos todos los días. no lo cura todo, pero el ejercicio puede levantar un poco el ánimo. es un apoyo, no un reemplazo de la ayuda profesional.`,
      en: `taking care of the basics also helps, even when it's hard: moving a little (walking, biking, swimming), eating as balanced as you can, and sleeping at similar times every day. it doesn't cure everything, but exercise can lift your mood a little. it's a support, not a replacement for professional help.` },
    { es: `la tristeza sin una razón clara es más común de lo que parece, y no necesitás justificarla para que cuente. a veces ayuda ponerle nombre a lo que sentís, escribirlo, o contárselo a alguien. si pasa el tiempo y no se alivia, es buena idea consultar a un profesional.`,
      en: `sadness without a clear reason is more common than it seems, and you don't need to justify it for it to count. sometimes it helps to name what you feel, write it down, or tell someone. if time passes and it doesn't ease, it's a good idea to consult a professional.` },
    { es: `si sentís que no tenés ganas de nada, probá con pasos muy chicos: tomar agua, abrir la ventana, darte una ducha, salir a que te dé la luz del sol unos minutos. no hace falta hacer todo; una sola cosa pequeña ya cuenta. y no te compares con las vidas perfectas que se ven en redes: eso suele hacer que uno se sienta peor.`,
      en: `if you feel like you don't want to do anything, try very small steps: drink water, open the window, take a shower, go out for a few minutes of sunlight. you don't have to do everything; one small thing already counts. and don't compare yourself with the perfect lives you see on social media: that usually makes you feel worse.` },
    { es: `conviene reconocer las señales: dejar de disfrutar lo que antes te gustaba, cambios fuertes en el sueño o en la comida, llanto frecuente, o sentirte muy pesimista por mucho tiempo pueden indicar depresión, que es algo serio pero tratable. no es debilidad ni exageración. pedir ayuda profesional es una forma de cuidarte.`,
      en: `it's worth recognizing the signs: no longer enjoying what you used to like, strong changes in sleep or eating, frequent crying, or feeling very pessimistic for a long time can indicate depression, which is serious but treatable. it isn't weakness or exaggeration. asking for professional help is a way of taking care of yourself.` },
  ],
  autolesion: [
    { es: `hacerse daño suele ser una forma de intentar soportar un dolor muy grande, y ese dolor merece ayuda de verdad. lo más importante que podés hacer es hablar con un profesional de salud mental o con un adulto de confianza, sin esperar a que sea "suficientemente grave". si se lo contás a alguien cercano, podés decirle simplemente: "me estoy lastimando y necesito ayuda".`,
      en: `hurting yourself is often a way of trying to bear a very big pain, and that pain deserves real help. the most important thing you can do is talk to a mental health professional or a trusted adult, without waiting for it to be "serious enough". if you tell someone close, you can simply say: "I'm hurting myself and I need help".` },
    { es: `cuando venga el impulso, intentá no quedarte solo/a: ir a un lugar donde haya gente o llamar a alguien suele ayudar a que la urgencia baje. y alejá de tu alcance lo que usás para lastimarte, o pedile a alguien de confianza que lo guarde. si te hiciste una herida que necesita atención, andá a un centro de salud.`,
      en: `when the urge comes, try not to stay alone: going to a place with people or calling someone usually helps the urgency go down. and keep out of reach what you use to hurt yourself, or ask someone you trust to keep it. if you have a wound that needs attention, go to a health center.` },
    { es: `no tenés que tener todo claro para pedir ayuda. un profesional puede ayudarte a entender qué hay detrás y a encontrar otras maneras de aliviar lo que sentís. mientras lo conseguís, la Línea 106, te atiende las 24 horas, y el 123 si estás en peligro.`,
      en: `you don't have to have everything clear to ask for help. a professional can help you understand what's behind it and find other ways of easing what you feel. while you arrange that, Line 106, answers 24 hours, and 123 if you're in danger.` },
    { es: `merecés recibir cuidado y no castigo. si lo que sentís es culpa, vergüenza o rabia hacia vos mismo/a, contárselo a alguien de confianza puede aliviar bastante, y un profesional puede acompañarte sin juzgarte. no estás solo/a en esto: mucha gente pasa por algo parecido y sale adelante con apoyo.`,
      en: `you deserve care, not punishment. if what you feel is guilt, shame or anger toward yourself, telling someone you trust can ease it quite a bit, and a professional can be with you without judging you. you're not alone in this: many people go through something similar and move forward with support.` },
  ],
  suicidio: [
    { es: `lo más importante ahora es que no estés solo/a: contale a alguien de confianza lo que sentís, hoy mismo, o quedate cerca de alguien. y llamá a la Línea 106 (24 horas), o al 123 si sentís que podés hacerte daño ahora. mantené lejos de vos cualquier cosa con la que podrías lastimarte.`,
      en: `the most important thing now is that you're not alone: tell someone you trust what you feel, today, or stay near someone. and call Line 106 (24 hours), or 123 if you feel you could hurt yourself now. keep away from you anything you could hurt yourself with.` },
    { es: `el deseo de morir suele aparecer cuando el sufrimiento supera lo que podemos soportar, pero el dolor intenso cambia con el tiempo y con apoyo, y quitarse la vida no tiene vuelta atrás. tu vida es la única que tenés. un profesional de salud mental puede ayudarte a que esto sea menos pesado; pedir esa cita es un acto de cuidado, no de debilidad.`,
      en: `the wish to die tends to appear when suffering exceeds what we can bear, but intense pain changes with time and support, and taking your life can't be undone. your life is the only one you have. a mental health professional can help make this less heavy; asking for that appointment is an act of care, not weakness.` },
    { es: `si hoy está muy difícil, intentá hacer tu día de a pasos cortos: estar en un lugar seguro, acompañado/a si es posible, tomar agua, comer algo, y avisarle a alguien cómo estás. no tomes decisiones definitivas hoy. si la idea se vuelve más fuerte, llamá al 123 enseguida.`,
      en: `if today is very hard, try to take your day in short steps: be in a safe place, accompanied if possible, drink water, eat something, and let someone know how you are. don't make definitive decisions today. if the thought gets stronger, call 123 right away.` },
    { es: `hay más personas de las que imaginás dispuestas a ayudarte: un familiar, un amigo, un docente, un médico. a veces cuesta empezar la conversación, y podés abrir con algo simple: "no estoy bien y necesito ayuda". la Línea 106, también te escucha a cualquier hora.`,
      en: `there are more people than you imagine willing to help you: a relative, a friend, a teacher, a doctor. sometimes it's hard to start the conversation, and you can open with something simple: "I'm not okay and I need help". Line 106, also listens at any hour.` },
  ],
};

// para el traductor (translate.js lo lee desde acá)
const SUPPORT_LINES = [
  ...CRISIS_LINES.selfharm, ...CRISIS_LINES.suicide, ...CRISIS_LINES.attempt,
  ...SAFE_LINES, ...UNSAFE_LINES, ...NO_ADVICE_LINES, ...ADVICE_NO_TOPIC_LINES,
  ...ADVICE.soledad, ...ADVICE.tristeza, ...ADVICE.autolesion, ...ADVICE.suicidio,
];

// ---------- usar todo lo anterior ----------
// responde a una crisis y deja todo listo para la pregunta "¿estás a salvo?"
function respondCrisis(state, level) {
  markSerious(state, 'crisis', null);
  state.crisisLevel = level;
  state.lastCrisisSeq = state.msgSeq || 0;
  state.lastHelplineSeq = state.msgSeq || 0;
  state.safetyReasks = 0;
  state.awaitingSafety = true;
  state.awaitingAdvice = false;
  const line = pickNoRepeat(CRISIS_LINES[level], state, 'crisis_' + level);
  return { text: line.es + REGION_NOTE, expression: 'worried' };
}

// nota que se pega al final de una respuesta de tristeza/soledad/autoestima:
// a la 2da vez ofrece consejos, y a la 3ra (y cada 3) recomienda líneas de ayuda
function supportSuffix(state) {
  state.depressionSignalCount = (state.depressionSignalCount || 0) + 1;
  const n = state.depressionSignalCount;
  if (n === 2) { state.awaitingAdvice = true; return OFFER_ADVICE_NOTE; }
  if (n >= 3 && n % 3 === 0) return COLOMBIA_HELPLINE_NOTE;
  return '';
}

function adviceKeyFor(state) {
  const last = state.topicLog && state.topicLog[state.topicLog.length - 1];
  if (!last) return null;
  if (last.id === 'crisis') {
    if (state.crisisLevel === 'selfharm') return 'autolesion';
    if (state.crisisLevel === 'attempt') return 'intento';   // consejos de sobrevivientes (advice-extra.js)
    if (state.crisisLevel === 'other') return 'enojo';       // daño a otras personas: consejos para el enojo
    return 'suicidio';
  }
  if (last.id === 'vacio') return 'vacio';                   // vacío emocional (advice-extra.js)
  if (last.id === 'soledad') return 'soledad';
  if (last.id === 'enojo') return 'enojo';
  if (last.id === 'ansiedad') return 'ansiedad';
  if (last.id === 'delicado') return null;
  return 'tristeza'; // tristeza, ánimo, autoestima, ansiedad, motivación, fracaso
}

function giveAdvice(state, forcedKey) {
  state.awaitingAdvice = false;
  const key = forcedKey || adviceKeyFor(state);
  if (!key) return { text: pickNoRepeat(ADVICE_NO_TOPIC_LINES, state, 'notopic').es, expression: 'talking' };
  // para "ganas de no vivir" se mezclan los consejos generales con los de sobrevivientes
  const pool = (key === 'suicidio' && ADVICE.intento) ? ADVICE.suicidio.concat(ADVICE.intento) : ADVICE[key];
  const bundle = pickNoRepeat(pool, state, 'advice_' + key);
  const link = LINK_NOTES[key];
  return { text: bundle.es + (link ? link.es : ''), expression: key === 'autolesion' || key === 'suicidio' || key === 'intento' ? 'worried' : 'talking' };
}

const YES_RE = /^(si|dale|claro|ok|bueno|por favor|quiero|cuentame|contame|yes|please|sure)\b/;
const NO_RE = /^(no|ahora no|nah|nop|todavia no)\b/;
// pedidos explícitos de los consejos nuevos (advice-extra.js)
const SURVIVOR_ADVICE_RE = /sobreviviente|sobrevivi(r|o|eron|ste) a un intento|consejos? de (personas|gente) que (intentaron|han intentado|pasaron por)|despues de (un|mi) intento|survivors?\b|after (an|my) attempt/;
const EMPTINESS_ADVICE_RE = /(consejos?|ayuda|que hago|como (salgo|supero|lidio)).{0,25}vacio|vacio.{0,25}(consejos?|ayuda|que hago)|advice.{0,20}empt(y|iness)|empt(y|iness).{0,20}advice/;
const ADVICE_REQUEST_RE = /consejo|que (puedo|debo|deberia) hacer|ayudame|dame ayuda|como (salgo|supero|lidio|me siento mejor|dejo de sentirme|puedo salir)|necesito ayuda|que hago\b|no se que hacer|advice|help me|what should i do/;

// sigue las conversaciones de apoyo: "¿estás a salvo?", "¿querés consejos?" y
// los pedidos de consejos. Devuelve { text, expression } o null.
function handleSupport(text, state) {
  const tn = normalizeCrisis(text).trim();

  if (state.awaitingSafety) {
    state.awaitingSafety = false;
    if (YES_RE.test(tn) || /^(estoy (a salvo|bien|seguro|segura)|ya estoy bien|im safe)/.test(tn)) {
      state.awaitingAdvice = true;
      return { text: pickNoRepeat(SAFE_LINES, state, 'safe').es, expression: 'worried' };
    }
    if (NO_RE.test(tn) || /^(no se|not safe)/.test(tn)) {
      return { text: pickNoRepeat(UNSAFE_LINES, state, 'unsafe').es, expression: 'worried' };
    }
    // no contestó (un "hola", un "ok"): se lo vuelve a preguntar, hasta 2 veces
    if (tn.split(/\s+/).length <= 3 && (state.safetyReasks || 0) < 2) {
      state.safetyReasks = (state.safetyReasks || 0) + 1;
      state.awaitingSafety = true;
      return { text: pickNoRepeat(SAFETY_REASK_LINES, state, 'reask').es, expression: 'worried' };
    }
  }

  if (state.awaitingAdvice) {
    state.awaitingAdvice = false;
    if (YES_RE.test(tn)) return giveAdvice(state);
    // solo cuenta como "no quiero consejos" si es una respuesta corta ("no", "ahora no"), no una frase como "no tengo amigos"
    if (NO_RE.test(tn) && tn.split(/\s+/).length <= 3) return { text: pickNoRepeat(NO_ADVICE_LINES, state, 'noadvice').es, expression: 'talking' };
  }

  if (SURVIVOR_ADVICE_RE.test(tn) && ADVICE.intento) return giveAdvice(state, 'intento');
  if (EMPTINESS_ADVICE_RE.test(tn) && ADVICE.vacio) return giveAdvice(state, 'vacio');

  if (ADVICE_REQUEST_RE.test(tn)) {
    const isLongVent = tn.split(/\s+/).length > 8 && typeof findEmotionalReply === 'function' && findEmotionalReply(text);
    if (!isLongVent) return giveAdvice(state);
  }
  return null;
}

// ---------- seguimiento después de una crisis ----------
const SAFETY_REASK_LINES = [
  { es: `sigo acá. antes me dijiste algo muy importante y no lo olvidé. ¿estás a salvo ahora?`, en: `I'm still here. earlier you told me something very important and I haven't forgotten it. are you safe now?` },
  { es: `no me quiero quedar con la duda: ¿estás a salvo en este momento? si no, llamá al 123 o a la Línea 106.`, en: `I don't want to be left wondering: are you safe at this moment? if not, call 123 or Line 106.` },
  { es: `me alegra que sigas acá. solo necesito saber una cosa: ¿estás a salvo ahora?`, en: `I'm glad you're still here. I just need to know one thing: are you safe now?` },
  { es: `gracias por escribirme. antes de seguir: ¿estás bien? ¿hay alguien cerca tuyo?`, en: `thank you for writing to me. before we continue: are you okay? is there anyone near you?` },
];
const CRISIS_IDLE_LINES = [
  { es: `sigo acá. antes me dijiste algo muy importante y no lo olvidé. ¿estás a salvo? si necesitás hablar con alguien ahora, la Línea 106, atiende las 24 horas.`, en: `I'm still here. earlier you told me something very important and I haven't forgotten it. are you safe? if you need to talk to someone now, Line 106, answers 24 hours.` },
  { es: `no quiero dejarte solo/a con lo que me contaste. ¿cómo estás ahora? si algo se complica, el 123 está para urgencias.`, en: `I don't want to leave you alone with what you told me. how are you now? if something gets complicated, 123 is there for emergencies.` },
  { es: `estoy acá, sin apuro. ¿me contás cómo seguís? y recordá que podés llamar a la Línea 106, a cualquier hora.`, en: `I'm here, no rush. will you tell me how you're doing? and remember you can call Line 106, at any hour.` },
];

// ¿pasó hace poco una crisis? entonces Error 404 recuerda las líneas de ayuda
function recentCrisis(state) {
  return state.lastCrisisSeq !== undefined && (state.msgSeq || 0) - state.lastCrisisSeq <= 20;
}
function crisisFollowNote(state) {
  if (!recentCrisis(state)) return '';
  const seq = state.msgSeq || 0;
  if (seq - (state.lastHelplineSeq === undefined ? -99 : state.lastHelplineSeq) < 4) return '';
  state.lastHelplineSeq = seq;
  return COLOMBIA_HELPLINE_NOTE;
}
function crisisIdleLine(state) {
  return recentCrisis(state) ? { text: pickNoRepeat(CRISIS_IDLE_LINES, state, 'crisisidle').es, expression: 'worried' } : null;
}

// consejos para el enojo y la ansiedad (recomendaciones generales y seguras)
ADVICE.enojo = [
  { es: `cuando la rabia sube, ayuda alejarte un momento de la situación: caminar, tomar aire, tomar agua. no es huir; es darle tiempo al cuerpo para bajar la intensidad antes de decir o hacer algo de lo que después te arrepientas.`,
    en: `when anger rises, it helps to step away from the situation for a moment: walk, get some air, drink water. it isn't running away; it's giving your body time to come down before you say or do something you'll regret.` },
  { es: `probá respirar lento: inhalá por la nariz contando hasta 4, soltá el aire por la boca contando hasta 6, y repetilo varias veces. suele ayudar a que el cuerpo se calme un poco.`,
    en: `try breathing slowly: inhale through your nose counting to 4, let the air out through your mouth counting to 6, and repeat it several times. it usually helps the body calm down a little.` },
  { es: `poné lo que sentís en palabras: escribilo, dibujalo, o contáselo a alguien de confianza. decirlo ayuda más que guardarlo. si es con alguien con quien discutiste, esperá a estar más calmado/a para hablar.`,
    en: `put what you feel into words: write it, draw it, or tell someone you trust. saying it helps more than keeping it in. if it's with someone you argued with, wait until you're calmer to talk.` },
  { es: `mover el cuerpo ayuda a soltar la tensión: caminar rápido, correr, bailar, estirarte. y si la rabia viene seguido, o sentís que podés lastimar a alguien o a vos, hablá con un adulto de confianza o un profesional. el 123 está para emergencias.`,
    en: `moving your body helps release tension: brisk walking, running, dancing, stretching. and if the anger comes often, or you feel you could hurt someone or yourself, talk to a trusted adult or a professional. 123 is for emergencies.` },
];
ADVICE.ansiedad = [
  { es: `una técnica sencilla es la de los 5 sentidos: nombrá 5 cosas que ves, 4 que podés tocar, 3 que escuchás, 2 que olés y 1 que saboreás. te trae de vuelta al momento presente.`,
    en: `a simple technique is the 5 senses one: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste. it brings you back to the present moment.` },
  { es: `respirá despacio: inhalá 4 segundos, soltá 6. repetilo unas 5 veces. si estás muy acelerado/a, apoyá los pies firmes en el piso.`,
    en: `breathe slowly: inhale 4 seconds, let out 6. repeat it about 5 times. if you're very worked up, plant your feet firmly on the floor.` },
  { es: `hablá con alguien de lo que te preocupa, y separá lo que podés resolver hoy de lo que es solo una posibilidad. escribirlo en dos columnas ayuda.`,
    en: `talk to someone about what worries you, and separate what you can solve today from what is only a possibility. writing it in two columns helps.` },
  { es: `si la ansiedad se repite mucho o te impide hacer tu vida, conviene consultar a un profesional de salud: se puede tratar. mientras tanto, cuidá el sueño y reducí un poco la cafeína.`,
    en: `if the anxiety comes back a lot or stops you from living your life, it's worth consulting a health professional: it can be treated. meanwhile, look after your sleep and cut back a little on caffeine.` },
];
SUPPORT_LINES.push(...SAFETY_REASK_LINES, ...CRISIS_IDLE_LINES, ...ADVICE.enojo, ...ADVICE.ansiedad);
