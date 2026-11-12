/*
  english-input.js
  ----------------
  Cuando el sitio está en modo inglés, esto traduce lo que escribís en inglés a
  las frases en español que el cerebro (pet-brain.js y compañía) ya entiende.
  En modo español NO se usa: en español, el inglés no se interpreta (excepto las
  frases de crisis, que siempre se detectan en los dos idiomas por seguridad).

  Cómo funciona: una lista de reglas [patrón, reemplazo], que se aplican en
  orden. Si el mensaje no coincide con ninguna regla, queda tal cual y el bot
  responde como siempre que no entiende ("what do you mean by ...?").

  Honestidad: es una lista de frases, no un traductor general. Entiende muy
  bien todo lo que el bot sabe hacer (nombre, gustos, ánimo, Verity, consejos,
  modos, cremallera...) con varias formas de decirlo, pero una frase muy
  distinta de las de la lista no se va a entender.

  Para agregar una forma de decir algo: sumá una línea a ENGLISH_RULES con
  [ /lo que dice el usuario en inglés/, 'la frase en español equivalente' ].
  Las reglas van de lo más específico a lo más general: poné las nuevas arriba
  de las de "who is" y "what is".
*/

const EN_ADJ = {
  happy: 'feliz', sad: 'triste', ok: 'bien', okay: 'bien', fine: 'bien', well: 'bien', good: 'bien',
  angry: 'enojado', upset: 'molesto', tired: 'cansado', bored: 'aburrido', lonely: 'solo',
  scared: 'asustado', nervous: 'nervioso', mad: 'enojado',
};
const EN_CATS = {
  food: 'comida', movie: 'película', film: 'película', song: 'canción', music: 'música', game: 'juego',
  sport: 'deporte', book: 'libro', number: 'número', singer: 'cantante', band: 'banda',
  character: 'personaje', colour: 'color',
};
const enCat = (c) => EN_CATS[c] || c;

const ENGLISH_RULES = [
  // ----- matemática -----
  [/\b(?:multiplied by|times)\b/g, 'por'],
  [/\bdivided by\b/g, 'entre'],
  [/\bplus\b/g, 'más'],
  [/\bminus\b/g, 'menos'],
  [/\b(?:what is|what's|how much is|calculate|compute) (?=[\d(])/g, 'cuánto es '],

  // ----- quién es / cómo se llama -----
  [/\bmy name is ([a-z]+)/, 'me llamo $1'],
  [/\bi am called ([a-z]+)/, 'me llamo $1'],
  [/\bcall me ([a-z]+)/, 'llámame $1'],
  [/\bwhat(?:'s| is) your name\b/, 'cómo te llamas'],
  [/\bwho are you\b|\bwhat are you\b/, 'qué eres'],
  [/\bhow old are you\b/, 'cuántos años tienes'],
  [/\b(?:i am|i'm) (\d{1,3}) years old\b/, 'tengo $1 años'],
  [/\bwho (?:created|made|built|programmed) you\b/, 'quién te creó'],
  [/\bwhere do you come from\b/, 'de dónde vienes'],
  [/\btell me (?:about )?your (?:story|origin|lore|history)\b|\btell me about yourself\b/, 'cuéntame tu historia'],
  [/^(?:and )?then\??$|^what happened next\??$/, 'y después'],
  [/^(?:go on|continue)[.!]*$/, 'sigue'],
  [/^tell me more[.!]*$/, 'cuéntame más'],

  // ----- cómo está -----
  [/\bhow are you(?: doing| today)?\b|\bwhat's up\b/, 'cómo estás'],
  [/\bhow do you feel\b/, 'cómo te sientes'],
  [/\b(?:are|do) you (?:feel )?(?:very |so |really )?(happy|sad|ok|okay|fine|well|good|angry|upset|tired|bored|lonely|scared|nervous|mad)\b/, (m, a) => 'estás ' + EN_ADJ[a]],

  // ----- saludos y despedidas -----
  [/^(?:bye|goodbye|see you(?: later)?|good night)\b/, 'adiós'],
  [/^good morning\b/, 'buenos días'],
  [/^good afternoon\b/, 'buenas tardes'],
  [/^good evening\b/, 'buenas noches'],
  [/^(?:hello|hi|hey|heya|hiya|howdy)(?: (?:there|everyone|buddy|friend|mate|man|bro|dude))?(?=[\s,!.?]|$)/, 'hola'],
  [/\bthank(?:s| you)\b/, 'gracias'],
  [/\byou'?re welcome\b/, 'de nada'],
  [/^yes,? (?:really|seriously)[.!]*$/, 'sí enserio'],
  [/^(?:yes|yeah|yep|yup|sure|of course)\b/, 'sí'],
  [/^(?:nope|nah)\b/, 'no'],
  [/\bplease\b/, 'por favor'],

  // ----- gustos y chocolate -----
  [/\bmy favou?rite (\w+) is (.+)/, (m, c, v) => `mi ${enCat(c)} favorito es ${v}`],
  [/\bwhat(?:'s| is) my favou?rite (\w+)/, (m, c) => `cuál es mi ${enCat(c)} favorito`],
  [/\bwhat(?:'s| is) your favou?rite (\w+)(?: (?:from|in|of) (.+))?/, (m, c, w) => `cuál es tu ${enCat(c)} favorito` + (w ? ` de ${w.replace(/^the /, '')}` : '')],
  [/\bif you could eat something,? what would (?:it|that) be\b|\bwhat would you eat\b/, 'si pudieras comer algo qué sería'],
  [/\bdo you like homemade chocolate\b/, 'te gusta el chocolate casero'],
  [/\bgive me (?:a )?(?:piece|bit) of (?:that )?chocolate\b/, 'dame un pedazo de ese chocolate'],
  [/\bbut i (?:really )?wanted to eat the chocolate\b/, 'pero tenía tantas ganas de comer el chocolate'],
  [/\bonly if i see it\b/, 'solo si lo veo'],

  // ----- consejos, tiempo, resumen, memoria -----
  [/\bgive me (?:some )?advice\b|\bi need advice\b|\bany advice\b/, 'dame consejos'],
  [/\b(?:another|one more) (?:tip|piece of advice|advice)\b/, 'otro consejo'],
  [/\bwhat (?:should|can) i do\b/, 'qué puedo hacer'],
  [/\bi don't know what to do\b/, 'no sé qué hacer'],
  [/\bi need help\b|\bhelp me\b/, 'necesito ayuda'],
  [/\bhow (?:long|many hours) have i been\b[^?]*/, 'cuántas horas llevo usando el sitio'],
  [/\bwhat have we (?:talked|spoken) about\b|\bsummar(?:y|ize) (?:of )?our (?:chat|conversation)\b/, 'qué hemos hablado'],
  [/\bwhat did i (?:tell|say to) you about (.+)/, 'qué te dije de $1'],
  [/\bwhat was the first thing i (?:said|told you)\b/, 'lo primero que te dije'],
  [/\bwhat was the last thing i (?:said|told you)\b/, 'lo último que te dije'],
  [/\bwhat were we talking about\b|\bgo back to what we were saying\b/, 'de qué hablábamos'],

  // ----- cómo se siente el usuario -----
  [/\b(?:i feel|i am|i'm) (?:so |very |really )?(?:sad|down|depressed|blue)\b/, 'me siento muy triste'],
  [/\b(?:i feel|i am|i'm) (?:so |very |really )?(?:lonely|alone)\b/, 'me siento muy solo'],
  [/\bi (?:have no|don't have any|do not have any) friends\b/, 'no tengo amigos'],
  [/\b(?:nobody|no one) cares about me\b|\bnobody loves me\b/, 'no le importo a nadie'],
  [/\b(?:nobody|no one) (?:listens|hears) (?:to )?me\b/, 'nadie me escucha'],
  [/\bi hate myself\b/, 'me odio'],
  [/\b(?:i am|i'm) (?:a )?(?:useless|worthless|a failure|stupid)\b/, 'soy un inútil'],
  [/\bi always (?:do everything wrong|mess (?:everything )?up)\b/, 'siempre hago todo mal'],
  [/\b(?:i am|i'm) (?:very |so )?(?:anxious|nervous)\b|\bi have (?:a lot of )?anxiety\b|\bpanic attack\b/, 'tengo mucha ansiedad'],
  [/\bi can't stop thinking about (?:the )?(?:worst|bad things)\b/, 'no puedo dejar de pensar en todo lo malo que podría pasar'],
  [/\bi(?:'m| am) (?:afraid|scared) of talking to people\b/, 'tengo miedo de hablar con la gente'],
  [/\bi (?:don't|do not) feel like doing anything\b|\bi have no motivation\b/, 'no tengo ganas de hacer nada'],
  [/\bi(?:'m| am) (?:so |very )?lazy\b/, 'soy perezoso'],
  [/\bi (?:haven't|have not) achieved anything\b|\bi have achieved nothing\b/, 'no he logrado nada'],
  [/\bi failed(?: at something)?\b/, 'fracasé en algo'],
  [/\bi (?:let everyone down|disappointed everyone)\b/, 'decepcioné a todos'],
  [/\bi (?:don't|do not) want to try again\b/, 'no quiero volver a intentarlo'],
  [/\bi feel nothing\b|\bnothing matters\b/, 'no siento nada'],
  [/\bi feel (?:so )?(?:empty|numb)\b|\bempty inside\b/, 'me siento vacío'],
  [/\b(?:i(?:'m| am)|i feel) (?:so |very |really )?(?:angry|furious|mad)\b/, 'estoy muy enojado'],
  [/\bi want to (?:take it out on|lash out at|vent on) (?:someone|somebody)\b/, 'me quiero desquitar con alguien'],
  [/\bi can't stand feeling (?:like )?this\b/, 'no soporto sentirme así'],
  [/\beverything (?:is going|goes) wrong\b|\bthings are going badly in everything\b/, 'me va muy mal en todo'],
  [/\bi(?:'m| am) (?:so |very )?tired\b/, 'estoy cansado'],
  [/\bi(?:'m| am) not happy\b/, 'no estoy feliz'],
  [/\bi(?:'m| am) (?:so |very )?happy\b|\bi feel (?:great|good|happy)\b/, 'estoy feliz'],
  [/\bi(?:'m| am) (?:fine|okay|ok)\b/, 'estoy bien'],
  [/\bi (?:don't|do not) want to talk\b|\bi don't feel like talking\b/, 'no quiero hablar'],
  [/\bleave me alone\b/, 'dejame en paz'],
  [/\byou (?:don't|do not) listen\b|\byou(?:'re| are) not listening\b/, 'no me escuchas'],
  [/\byou (?:don't|do not) understand me\b/, 'no me entiendes'],
  [/\byou(?:'re| are) the problem\b/, 'tú eres el problema'],

  // ----- Verity, ThatMob y lore -----
  [/\bwhat does (?:the )?404 mean\b|\bwhy are you called error 404\b|\bwhat is (?:a |an |the )?404\b/, 'qué significa el 404'],
  [/\bare you (?:and verity )?(?:brothers|siblings)\b|\bis verity your (?:brother|sister)\b/, 'son hermanos verity y tu'],
  [/\bis (?:she|verity|he) your (?:cousin|family|relative)\b|\bare you (?:two )?(?:cousins|related|family)\b/, 'es tu primo verity'],
  [/\bsame species\b|\bwhat species\b/, 'misma especie'],
  [/\bwhat do you (?:and verity )?have in common\b/, 'qué tienen en común tú y verity'],
  [/\bwhat(?:'s| is) your relationship (?:with|to) verity\b|\bexplain your relationship with verity\b/, 'explica tu relación con verity'],
  [/\b(?:did|were) thatmob (?:create|make) (?:you|both)\b|\bwere you (?:both )?created by thatmob\b/, 'los creó thatmob'],
  [/\bwill you (?:go|get) out of control\b|\bare you going to (?:attack|hurt) me\b|\bwill you (?:attack|hurt) me\b/, 'me vas a atacar'],
  [/\bdo you have a monster form\b|\bdo you have a transformation\b/, 'tienes una forma monstruo'],
  [/\b(?:can you )?(?:transform|turn) (?:yourself )?into (?:a )?monsters?\b/, 'transformate en monstruo'],
  [/\bwhat would you say to verity\b|\bif you (?:met|saw|had) verity(?: in front of you)?\b/, 'si lo tuvieras al frente qué le dirías a verity'],
  [/\bdo you have a stand\b/, 'tienes un stand'],
  [/\b(?:enter|activate|switch to|turn on|go into|go to) (verity|jojo) mode\b/, 'entra en modo $1'],
  [/\b(?:exit|leave|turn off|deactivate) (verity|jojo) mode\b/, 'sal del modo $1'],
  [/\b(?:normal mode|back to normal)\b/, 'modo normal'],
  [/\bchange mode\b/, 'cambia de modo'],
  [/\b(?:close|shut|zip) your mouth\b/, 'cierra la boca'],
  [/\b(?:you can )?open your mouth\b|\byou can (?:talk|speak) now\b/, 'puedes abrir la boca'],
  [/\bare you (chatgpt|gpt|claude|gemini|siri|alexa|copilot|bard|deepseek|grok)\b/, 'eres $1'],
  [/\b(?:i(?:'ll| will| am going to|'m going to)|what if i|how about i) call you (.+)/, 'te voy a llamar $1'],
  [/\bwhat do you think (?:of|about) (?:people|those) who call you that\b/, 'qué piensas de los que te llaman así'],
  [/\bwhy do you have (?:such )?(?:long )?(?:fangs|teeth)\b/, 'por qué tienes colmillos'],
  [/\bwhy are you (?:gray|grey|round)\b/, 'por qué eres gris'],
  [/\bwhat (?:broke|is broken)\b|\bwhy are you broken\b/, 'qué se rompió'],
  [/\bif you had a (?:full )?body\b/, 'si tuvieras cuerpo'],

  // ----- frases sueltas -----
  [/^(?:really|seriously|for real)\??$/, 'en serio'],
  [/^why\??$/, 'por qué'],
  [/^(?:and so|so what)\??$/, 'y ya'],
  [/^i hope so[.!]*$/, 'eso espero'],
  [/^(?:cool|nice|great|awesome)[.!]*$/, 'genial'],

  // ----- preguntas generales (siempre al final: son las más amplias) -----
  [/\bwhat do you know about (.+)/, 'qué sabes de $1'],
  [/\bwhat do you think (?:of|about) (.+)/, 'qué opinas de $1'],
  [/\btell me (?:more )?about (.+)/, 'cuéntame sobre $1'],
  [/\btalk to me about (.+)/, 'háblame de $1'],
  [/\bdo you know (.+)/, 'conoces a $1'],
  [/\bwho is (.+)/, 'quién es $1'],
  [/\bwhat(?:'s| is) (?:a |an |the )?(.+)/, 'qué es $1'],
];

// Devuelve el mensaje traducido al español, o el mismo mensaje si no hay reglas que apliquen.
function translateInputToSpanish(raw) {
  const original = raw.toLowerCase().replace(/[’`]/g, "'").trim();
  let t = original;
  for (const [re, rep] of ENGLISH_RULES) t = t.replace(re, rep);
  return t === original ? raw : t;
}
