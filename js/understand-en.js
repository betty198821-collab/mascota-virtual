/*
  understand-en.js
  ----------------
  COMPRENSIÓN DE MENSAJES EN INGLÉS.

  El cerebro de la mascota (pet-brain.js, topics.js, support.js, personality.js,
  memory.js, web-lookup.js...) entiende español. Para que también entienda inglés
  SIN duplicar todo, este archivo "traduce" lo que escribe la persona al español
  que el cerebro ya reconoce, y el cerebro responde como siempre (la respuesta
  después se traduce al inglés con translateOutbound, en translate.js).

      lo que escribís (inglés) -> translateInbound() -> español -> cerebro
                                                                     |
      lo que ves (inglés)     <- translateOutbound()  <- respuesta (español)

  IMPORTANTE:
  - Solo funciona cuando el idioma elegido es inglés. En español no se usa nada de esto
    (translateInbound devuelve el texto tal cual si el idioma no es 'en').
  - No es inteligencia artificial: son reglas (frases) + un diccionario corto. Entiende
    las frases comunes de la lista de abajo; lo que no reconoce pasa casi igual y la
    mascota responde "no entendí" o algo general, igual que en español.
  - Las crisis (autolesión, no querer vivir, intento) y los insultos en inglés ya los
    detectan support.js y personality.js directamente, así que en esos casos el texto
    pasa SIN traducir. Esto es a propósito: así no se pierde ni una palabra.
  - La moderación (moderation.js) revisa SIEMPRE el texto original.

  PARA AGREGAR UNA FRASE NUEVA:
    1. Buscá el bloque que corresponda (saludos, emociones, búsquedas...).
    2. Agregá una línea:  R(/expresión en inglés/, 'frase en español que el cerebro ya entiende $1');
       - todo en minúscula y SIN apóstrofes (los contracciones ya se expanden: "don't" -> "do not").
       - $1, $2... son los pedacitos entre paréntesis de la expresión.
    3. El ORDEN importa: lo específico va antes que lo general (igual que en pet-brain.js).
    4. Si la frase en español no existe en el cerebro, la mascota no sabrá contestarla:
       primero hay que agregarla allá (ver README).
*/

// ---------- paso 0: normalizar (minúsculas, contracciones, jerga) ----------
function enNormalize(raw) {
  return raw
    .toLowerCase()
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bcan't\b|\bcant\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bi'm\b|\bim\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(i|you|he|she|we|they|it)'ll\b/g, '$1 will')
    .replace(/\b(i|you|he|she|we|they)'d\b/g, '$1 would')
    .replace(/\b(he|she|it|that|there|here|who|what|where|how|when|why)'s\b/g, '$1 is')
    .replace(/\blet's\b/g, 'let us')
    .replace(/\b([a-z]+)n't\b/g, '$1 not')
    .replace(/\bdont\b/g, 'do not').replace(/\bdidnt\b/g, 'did not').replace(/\bdoesnt\b/g, 'does not')
    .replace(/\bisnt\b/g, 'is not').replace(/\barent\b/g, 'are not').replace(/\bwasnt\b/g, 'was not')
    .replace(/\bgonna\b/g, 'going to').replace(/\bwanna\b/g, 'want to').replace(/\bgotta\b/g, 'have to')
    .replace(/\bdunno\b|\bidk\b/g, 'i do not know')
    .replace(/\bu\b/g, 'you').replace(/\bur\b/g, 'your')
    .replace(/\bpls\b|\bplz\b/g, 'please').replace(/\bthx\b|\bty\b/g, 'thanks');
}

// ---------- paso 1: reglas de frases (inglés -> español que el cerebro entiende) ----------
const EN_RULES = [];
function R(re, rep) { EN_RULES.push([re, rep]); }

const VERY = '(?:so |very |really |extremely |kinda |kind of |a bit |a little |pretty |totally |completely )?';
const END = '[?!. ]*$';

// --- matemática: "what is 5 plus 3" -> "5 + 3" ---
const OPS = { plus: '+', minus: '-', times: '*', 'multiplied by': '*', 'divided by': '/', over: '/', x: '*' };
R(/(?:what is |how much is |calculate |compute |solve )?(-?\d+(?:\.\d+)?)\s*(plus|minus|times|multiplied by|divided by|over)\s*(-?\d+(?:\.\d+)?)/,
  m => `${m[1]} ${OPS[m[2]]} ${m[3]}`);

// --- saludos y despedidas ---
R(/^(?:hello|hi|hey|heya|hiya|howdy|yo|sup|what is up)\b(?:,? (?:there|everyone|friend|buddy|bro|dude))?[?!. ]*$/, 'hola');
R(/^(?:hello|hi|hey|heya|hiya|howdy),? (?=[a-z])/, 'hola ');
R(/\bgood morning\b/, 'buenos días');
R(/\bgood afternoon\b/, 'buenas tardes');
R(/\bgood (?:evening|night)\b/, 'buenas noches');
R(/\b(?:goodbye|good bye|bye bye|bye|see you(?: later| soon| tomorrow)?|see ya|farewell)\b/, 'adiós');
R(/\bi (?:have to|must|need to) (?:go|leave)\b|\bi am leaving\b|\bi am off\b/, 'me voy');
R(/\b(?:thanks|thank you|thank you so much|thanks a lot|many thanks)\b/, 'gracias');
R(/^(?:sorry|i am sorry)[?!. ]*$/, 'perdón');

// --- nombre, edad, gustos ---
R(/\bmy name is ([a-z]+)/, 'me llamo $1');
R(/\bcall me ([a-z]+)/, 'llámame $1');
R(/\bdo you know my name\b/, 'sabes mi nombre');
R(/\bwhat is my name\b|\bwho am i\b/, 'cuál es mi nombre');
R(/\bwhat is your name\b|\bwhat do (?:they|people) call you\b/, 'cómo te llamas');
R(/\bhow old are you\b|\bwhat is your age\b/, 'cuántos años tienes');
R(/\bi am (\d{1,3}) (?:years? old|yo|y\/o)\b|^i am (\d{1,3})[?!. ]*$/, m => `tengo ${m[1] || m[2]} años`);
R(/\bmy favou?rite ([a-z]+) is ([^.!?\n]+)/, 'mi $1 favorito es $2');
R(/\b(?:what is|which is|what are|tell me) my favou?rite ([a-z]+)\b/, 'cuál es mi $1 favorito');
R(/\b(?:what is|which is|what are) your favou?rite (?:food|meal|dish)\b/, 'cuál es tu comida favorita');
R(/\b(?:what is|which is) your favou?rite colou?r\b/, 'cuál es tu color favorito');
R(/\b(?:what is|which is) your favou?rite (character|stand|anime|part)\b/, m => `cuál es tu ${({ character: 'personaje', stand: 'stand', anime: 'anime', part: 'parte' })[m[1]]} favorito`);
R(/\b(?:what is|which is) your favou?rite ([a-z]+)\b/, 'cuál es tu $1 favorito');
R(/\bif you could eat (?:something|anything)\b/, 'si pudieras comer algo');
R(/\b(?:what is|do you have a) (?:your )?favou?rite food\b/, 'comida favorita');

// --- cómo está la mascota / quién es ---
R(/\bhow (?:are you|do you do|is it going|have you been|are you doing|are u)\b/, 'cómo estás');
R(/\bhow do you feel\b|\bhow are you feeling\b/, 'cómo te sientes');
const SELF = { happy: 'feliz', glad: 'feliz', sad: 'triste', fine: 'bien', ok: 'bien', okay: 'bien', good: 'bien', bad: 'mal', angry: 'enojado', upset: 'molesto', tired: 'cansado', bored: 'aburrido', lonely: 'solo', alone: 'solo', scared: 'asustado', afraid: 'asustado', nervous: 'nervioso' };
R(/\b(?:are you|you are|you seem|you look|you feel) (?:so |very |really |a bit |a little )?(happy|glad|sad|fine|ok|okay|good|bad|angry|upset|tired|bored|lonely|alone|scared|afraid|nervous)\b/,
  m => `estás ${SELF[m[1]]}`);
R(/\bwho are you\b|\bwhat are you\b/, 'qué eres');
R(/\bare you (?:a |an )?(?:robot|bot|program|machine|computer)\b/, 'eres un robot');
R(/\bare you (chat ?gpt|gpt|claude|gemini|siri|alexa|copilot|bard|deepseek|grok)\b/, 'eres $1');
R(/\bwho (?:made|created|built|programmed|developed|designed) you\b|\bwho is your (?:creator|developer|owner)\b/, 'quién te creó');
R(/\bwhat does 404 mean\b|\bwhy (?:are you called|is your name|do they call you) (?:error )?404\b|\bwhy 404\b/, 'qué significa 404');
R(/\btell me about (?:yourself|you)\b/, 'cuéntame de ti');
R(/\btell me your (?:story|origin|lore|history)\b|\bwhere (?:do|did) you come from\b|\bhow were you born\b|\bwhat is your story\b/, 'cuéntame tu historia');
R(/\bwhat (?:happened|is wrong) (?:to|with) you\b|\bwhy are you broken\b|\bwhat does broken mean\b/, 'por qué estás roto');
R(/\b(?:do you have|why do you have) (?:fangs|teeth)\b|\bwhy do you smile like that\b/, 'colmillos');
R(/\bwhy are you (?:gray|grey|round|a sphere)\b|\bwhy do you look like that\b/, 'por qué eres gris');
R(/\bif you had a body\b/, 'si tuvieras cuerpo');
R(/\bhow do you feel\b/, 'cómo te sientes');
R(/\b(?:i will|i am going to|i shall) call you ([a-z0-9 ]+)/, 'te voy a llamar $1');
R(/\bwhat if i call you ([a-z0-9 ]+)/, 'si te llamo $1');
R(/\bi call you ([a-z0-9 ]+)/, 'te llamo $1');
R(/\byou are (?:so |very |really )?(?:cute|handsome|pretty|nice|cool|lovely|beautiful)\b|\byou look (?:good|nice|great|cute)\b/, 'eres lindo');

// --- Verity y ThatMob ---
R(/\bwhat do you think (?:of|about) verity\b|\bwhat is your opinion (?:of|about) verity\b/, 'qué opinas de verity');
R(/\bdo you like verity\b/, 'te cae bien verity');
R(/\bwhat do you know about verity\b|\bwho is verity\b|\bwhat is verity\b/, 'quién es verity');
R(/\b(?:are you and verity|are you two|are you) (?:brothers|siblings)\b|\bis verity your brother\b/, 'son hermanos');
R(/\b(?:is verity|are you and verity|are you) (?:your |a )?(?:cousins?|family|relatives?)\b/, 'es tu primo');
R(/\bdo you know verity\b|\bhave you (?:met|talked to|spoken to) verity\b/, 'conoces a verity');
R(/\bwhat do you (?:two )?have in common\b/, 'tienen en común');
R(/\bwhat is (?:your |the )?relationship (?:with|to|between you and) verity\b|\bwhat is your relationship\b/, 'qué relación tienen');
R(/\btell me (?:more )?about verity\b|\bspeak (?:more )?about verity\b/, 'cuéntame más sobre verity');
R(/\bwho is thatmob\b|\bwhat is thatmob\b|\bwhat do you know about thatmob\b/, 'quién es thatmob');
R(/\bdid thatmob (?:create|make|build) you\b/, 'thatmob te creó');

// --- seguridad, "no te descontroles" ---
R(/\b(?:will you|are you going to) (?:attack|hurt) me\b/, 'me vas a atacar');
R(/\b(?:will you|are you going to) (?:lose|go out of) control\b|\byou (?:might|could) lose control\b/, 'vas a salir de control');

// --- modos (Verity, JoJo, normal) ---
R(/\b(?:enter|activate|turn on|switch to|go into|go to|change to|start|put on)(?: the)? (verity|jojo|normal) mode\b/, m => (m[1] === 'normal' ? 'modo normal' : `entra en modo ${m[1]}`));
R(/\b(?:leave|exit|quit|turn off|deactivate|disable|stop)(?: the)? (verity|jojo) mode\b/, 'sal del modo $1');
R(/\b(?:go )?back to normal(?: mode)?\b/, 'modo normal');
R(/\b(verity|jojo|normal) mode\b/, 'modo $1');
R(/\b(?:change|switch|toggle) (?:the )?mode\b/, 'cambia de modo');

// --- cremallera (callarlo / dejarlo hablar) ---
R(/\b(?:close|zip|shut|seal) (?:your )?(?:mouth|lips)\b|\bkeep (?:quiet|silent)\b|\bstay (?:quiet|silent)\b|\bbe (?:quiet|silent)\b|\bshut up\b|\bzip it\b/, 'cierra la boca');
R(/\b(?:you can|you may|you are allowed to) (?:talk|speak)(?: now)?\b|\b(?:open|unzip) your (?:mouth|zipper)\b|\bunzip\b/, 'puedes hablar');

// --- tiempo en el sitio, resumen y memoria ---
R(/\bhow (?:many hours|many minutes|long) (?:have i|i have) been (?:using|on|in|here|at)\b/, 'cuántas horas llevo usando el sitio');
R(/\bwhat have we (?:talked|spoken) about\b|\bwhat did we (?:talk|speak) about\b|\b(?:summary|summarize|summarise|sum up) (?:of )?(?:our|the) (?:chat|conversation|talk)\b/, 'de qué hemos hablado');
R(/\bwhat were we (?:just )?talking about\b|\bwhat was i saying\b|\b(?:let us|can we) go back to (?:what we were talking about|before|that|what we said)\b|\bgo back to (?:that|before)\b/, 'de qué hablábamos');
R(/\bwhat (?:did|have) i (?:tell|told|say|said)(?: to)? you (?:about|of) (.+)/, 'qué te dije de $1');
R(/\bwhat (?:was|is) the last thing (?:that )?i (?:said|told you)\b/, 'lo último que te dije');
R(/\bwhat (?:was|is) the first thing (?:that )?i (?:said|told you)\b/, 'lo primero que te dije');
R(/\bdo you remember what i (?:told|said)\b/, 'recuerdas lo que te conté');

// --- consejos y ayuda ---
R(/\b(?:people|those|persons|someone|anyone) who (?:have )?survived (?:an? |their |a suicide )?(?:suicide )?attempts?\b/, 'personas que sobrevivieron a un intento');
R(/\bsurvivors? of (?:an? )?(?:suicide )?attempts?\b/, 'sobrevivientes');
R(/\bafter (?:an|my) attempt\b/, 'después de un intento');
R(/\b(?:give me|i need|i want|can you give me|do you have) (?:some |any )?(?:advice|tips)\b/, 'dame consejos');
R(/\bwhat (?:should|can|do) i do\b/, 'qué puedo hacer');
R(/\bi do not know what to do\b/, 'no sé qué hacer');
R(/\bhow (?:do|can) i (?:feel better|cope|get over (?:it|this)|deal with (?:it|this))\b/, 'cómo me siento mejor');
R(/\bhelp me\b/, 'ayúdame');
R(/\bi need help\b/, 'necesito ayuda');
R(/\bi am (?:safe|okay now|ok now|fine now)\b/, 'estoy a salvo');
R(/\bi am not (?:safe)\b/, 'no estoy a salvo');

// --- emociones (los temas de topics.js) ---
R(/\bi (?:just )?want to cry\b|\bi feel like crying\b|\bi (?:am|have been) crying\b/, 'quiero llorar');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:depressed)\\b'), 'estoy deprimido');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:sad|down|blue|unhappy|miserable)\\b'), 'me siento triste');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:lonely|alone|isolated)\\b'), 'me siento solo');
R(/\bi (?:cannot|can not) (?:take|handle|bear|do) (?:this|it) (?:anymore|any more)\b|\bi am (?:so )?(?:sick|tired) of (?:feeling|this)\b|\bi have had enough\b/, 'no puedo más');
R(/\b(?:nobody|no one) (?:cares|cares about|cares for) (?:me|about me)\b|\bnobody cares\b/, 'no le importo a nadie');
R(/\b(?:nobody|no one) (?:loves|likes|wants) me\b/, 'nadie me quiere');
R(/\b(?:nobody|no one) (?:listens|hears|pays attention)(?: to me)?\b/, 'nadie me escucha');
R(/\bi have (?:no|got no) friends\b|\bi do not have (?:any )?friends\b/, 'no tengo amigos');
R(/\bi do not have (?:anyone|anybody)\b|\bi have no one\b/, 'no tengo a nadie');
R(/\bi hate myself\b/, 'me odio');
R(/\bi am (?:a |an )?(?:worthless)\b|\bi am (?:so )?worth(?:less| nothing)\b/, 'no valgo');
R(/\bi am (?:a |an )?failure\b/, 'soy un fracaso');
R(/\bi am (?:so |such )?(?:a |an )?(?:useless|incompetent|loser|idiot|stupid|dumb)\b/, 'soy un inútil');
R(/\bi (?:always )?(?:do|did) (?:everything|it all) (?:wrong|badly)\b|\bi always (?:mess|screw) (?:everything )?up\b|\beverything i do (?:is|goes) wrong\b/, 'siempre hago todo mal');
R(/\beverything (?:goes|is going) wrong\b/, 'todo me sale mal');
R(/\bi cannot stop thinking\b/, 'no puedo dejar de pensar');
R(/\bi (?:have|am having|got) (?:a lot of |so much |severe |terrible )?anxiety\b|\bi am (?:so |very |really )?anxious\b|\bpanic attack\b|\bi am (?:having )?panic\b/, 'tengo mucha ansiedad');
R(/\bi am (?:so |very |really )?(?:overwhelmed|stressed|stressed out)\b/, 'estoy abrumado');
R(/\bi am (?:afraid|scared) (?:of|to) (?:talk|talking|speak|speaking) (?:to|with) (?:people|others)\b/, 'me da miedo hablar con la gente');
R(/\bi cannot sleep\b|\bi have trouble sleeping\b/, 'no puedo dormir');
R(/\bi do not (?:feel like|want to) (?:do|doing) (?:anything|nothing)\b|\bi do not feel like doing anything\b/, 'no tengo ganas de nada');
R(/\bi have no (?:motivation|desire)\b|\bno motivation\b/, 'sin motivación');
R(/\bi have no energy\b|\bi have no strength\b/, 'sin energía');
R(/\bi am (?:so |very )?lazy\b/, 'soy perezoso');
R(/\bi have not (?:achieved|accomplished) anything\b|\bi have achieved nothing\b|\bi did nothing with my life\b/, 'no he logrado nada');
R(/\bi (?:have )?failed\b/, 'fracasé');
R(/\bi (?:disappointed|let down) (?:everyone|everybody|them all)\b/, 'decepcioné a todos');
R(/\bi do not want to try again\b|\bi will not try again\b/, 'no quiero volver a intentar');
R(/\bi ruined everything\b/, 'arruiné todo');
R(/\beverything went wrong\b/, 'todo salió mal');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:angry|furious|mad|pissed|annoyed|upset)\\b'), 'estoy muy enojado');
R(/\bi have (?:a lot of |so much )?(?:anger|rage)\b|\bi am full of (?:anger|rage)\b/, 'tengo mucha rabia');
R(/\bi want to (?:take it out on|get back at|get even with|yell at|hit|fight)(?: someone| him| her| them)?\b/, 'me quiero desquitar');
R(/\bi cannot stand (?:this|it|feeling like this)\b/, 'no soporto esto');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:empty|hollow)(?: inside)?\\b|\\bi feel (?:an )?emptiness(?: inside)?\\b|\\bempty inside\\b'), 'me siento vacío');
R(/\bi (?:am|feel) (?:so |very |really |completely )?(?:numb|nothing)\b|\bi do not feel (?:anything|nothing)\b|\bi feel nothing\b/, 'no siento nada');
R(/\bnothing (?:really )?matters(?: to me| anymore)?\b|\bi do not care about anything\b/, 'nada me importa');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:happy|glad|great|awesome|amazing|excited|wonderful)\\b'), 'estoy feliz');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:good|fine|ok|okay|content|better|alright)\\b'), 'estoy bien');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:proud)\\b'), 'estoy orgulloso');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:tired|exhausted|drained|worn out)\\b'), 'estoy cansado');
R(new RegExp('\\bi (?:am|feel) ' + VERY + '(?:bad|awful|terrible|horrible|sick)\\b|\\bi do not feel (?:good|well)\\b|\\bi am not (?:okay|ok|fine|good|well)\\b'), 'me siento mal');

// --- críticas a la mascota y "no quiero hablar" ---
R(/\byou do not (?:even )?listen(?: to me)?\b/, 'ni siquiera me escuchas');
R(/\byou do not (?:even )?understand(?: me)?\b/, 'no me entiendes');
R(/\byou are (?:the )?problem\b/, 'tú eres el problema');
R(/\byou do not make (?:any )?sense\b/, 'no tiene sentido');
R(/\byou (?:do not|are not) (?:answer|answering|respond|responding)(?: me| to me)?\b/, 'no me respondes');
R(/\byou are (?:so |very |really )?(?:bad|terrible|awful)\b/, 'eres muy malo');
R(/\bleave me alone\b/, 'déjame en paz');
R(/\bi do not want to (?:talk|speak|say anything|tell)(?: about it)?\b|\bdo not ask me\b/, 'no tengo ganas de hablar');

// --- respuestas cortas ---
R(/^(?:yes|yeah|yep|yup|sure|of course|please|i do|ok sure)[?!. ]*$/, 'sí');
R(/^(?:no|nope|nah|not really)[?!. ]*$/, 'no');
R(/^(?:not now|maybe later|no thanks)[?!. ]*$/, 'ahora no');
R(/^(?:ok|okay|alright|got it|i see|cool|nice|perfect|right|k|fine|understood)[?!. ]*$/, 'ok');
R(/^(?:i do not know|no idea|not sure)[?!. ]*$/, 'ni idea');
R(/^(?:why|but why|and why)[?!. ]*$/, 'por qué');
R(/^(?:really|seriously|for real|no way)[?!. ]*$/, 'en serio');
R(/^(?:so|and so|so what|and\?|so\?)[?!. ]*$/, 'y entonces');
R(/^(?:i hope so)[?!. ]*$/, 'eso espero');
R(/^(?:and then|then|what happens next|what next|go on|continue|keep going|tell me more|more)[?!. ]*$/, 'sigue');

// --- búsquedas en Wikipedia (web-lookup.js) ---
R(/\bwhat chapter (?:does|did|is) (.+?) (?:appear|show up|debut|first appear)(?: in)?\b/, 'en qué capítulo aparece $1');
R(/\bwhat (?:episode|part|season) (?:does|did|is) (.+?) (?:appear|show up|debut|first appear)(?: in)?\b/, 'en qué capítulo aparece $1');
R(/\bwhere (?:does|did) (.+?) (?:appear|show up|debut)\b/, 'dónde aparece $1');
R(/\bwhen (?:does|did) (.+?) (?:appear|show up|debut)\b/, 'cuándo aparece $1');
R(/\bi (?:like|love|enjoy|am a fan of|am into) (?:the )?(?:anime |series |game |manga )?(pokemon|naruto|dragon ball|dbz|one piece|attack on titan|jojo|jojo's bizarre adventure|hellsing|mob psycho 100|mob psycho)\b/, 'me gusta $1');
R(/\bwho (?:is|was|are) (?:a |an |the )?(.+)/, 'quién es $1');
R(/\bdo you know who (.+?) (?:is|was)\b/, 'quién es $1');
R(/\bdo you know what (.+?) (?:is|are)\b/, 'qué es $1');
R(/\bexplain(?: to me)? what (.+?) (?:is|are)\b/, 'explícame qué es $1');
R(/\bdo you know (?:anything |something )?about (.+)/, 'sabes algo sobre $1');
R(/\btell me (?:more )?about (.+)/, 'cuéntame sobre $1');
R(/\b(?:talk|speak) (?:to me )?about (.+)/, 'háblame de $1');
R(/\bwhat (?:is|are|was) (?:a |an |the )?(.+)/, 'qué es $1');

// ---------- paso 2: diccionario de palabras sueltas (para lo que las reglas no cubrieron) ----------
const EN_WORDS = {
  hello: 'hola', hi: 'hola', hey: 'hola', thanks: 'gracias', please: 'por favor', sorry: 'perdón',
  sad: 'triste', happy: 'feliz', good: 'bien', great: 'genial', fine: 'bien', bad: 'mal', tired: 'cansado',
  exhausted: 'agotado', alone: 'solo', lonely: 'solo', loneliness: 'soledad', depressed: 'deprimido',
  depression: 'depresión', sadness: 'tristeza', empty: 'vacío', emptiness: 'vacío', anxiety: 'ansiedad',
  anxious: 'ansioso', angry: 'enojado', scared: 'miedo', afraid: 'miedo', fear: 'miedo', cry: 'llorar',
  crying: 'llorar', proud: 'orgulloso', numb: 'entumecido', worried: 'preocupado', stressed: 'abrumado',
  advice: 'consejos', tips: 'consejos', survivors: 'sobrevivientes', survivor: 'sobreviviente',
  today: 'hoy', tomorrow: 'mañana', yesterday: 'ayer', tonight: 'esta noche', now: 'ahora',
  friend: 'amigo', friends: 'amigos', family: 'familia', school: 'escuela', work: 'trabajo', home: 'casa',
  food: 'comida', music: 'música', game: 'juego', games: 'juegos', movie: 'película', movies: 'películas',
  dog: 'perro', cat: 'gato', mother: 'madre', mom: 'mamá', father: 'padre', dad: 'papá',
  brother: 'hermano', sister: 'hermana', life: 'vida', love: 'amor',
  why: 'por qué', how: 'cómo', what: 'qué', who: 'quién', where: 'dónde', when: 'cuándo',
  yes: 'sí', not: 'no', nothing: 'nada', everything: 'todo', nobody: 'nadie', never: 'nunca',
  and: 'y', or: 'o', but: 'pero', very: 'muy', too: 'demasiado', more: 'más', less: 'menos',
  me: 'me', my: 'mi', myself: 'yo mismo', you: 'tú', your: 'tu', the: '',
  from: 'de', for: 'para', about: 'sobre', with: 'con', of: 'de', without: 'sin',
  night: 'noche', morning: 'mañana', day: 'día', time: 'tiempo', help: 'ayuda', talk: 'hablar',
  story: 'historia', question: 'pregunta', name: 'nombre', feel: 'siento', feeling: 'sintiendo',
};

// ---------- paso 3: función principal ----------
function enApplyRules(str) {
  let segs = [{ t: str, done: false }];
  for (const [re, rep] of EN_RULES) {
    const anchored = re.source.charAt(0) === '^';
    if (anchored && segs.length !== 1) continue; // las reglas de mensaje completo solo si no se tocó nada antes
    const g = new RegExp(re.source, re.flags.replace('g', '') + 'g');
    const next = [];
    for (const seg of segs) {
      if (seg.done) { next.push(seg); continue; }
      g.lastIndex = 0;
      let last = 0, m;
      while ((m = g.exec(seg.t)) !== null) {
        if (m[0] === '') { g.lastIndex++; continue; }
        if (m.index > last) next.push({ t: seg.t.slice(last, m.index), done: false });
        const out = typeof rep === 'function' ? rep(m) : rep.replace(/\$(\d)/g, (_, n) => (m[Number(n)] || '').trim());
        next.push({ t: out, done: true });
        last = m.index + m[0].length;
      }
      if (last < seg.t.length) next.push({ t: seg.t.slice(last), done: false });
    }
    segs = next;
  }
  return segs;
}

// ¿es algo que el cerebro ya entiende directo en inglés? (crisis, insultos, otro daño)
function enHandledNatively(raw, lower) {
  if (typeof detectCrisis === 'function' && detectCrisis(raw)) return true;
  if (/i want to (kill|hurt) (someone|somebody)|hurt someone else/.test(lower)) return true;
  if (typeof isInsult === 'function' && typeof normalizeCrisis === 'function') {
    const selfTalk = /\b(i am|i'm|im|i feel|myself|my life)\b/.test(lower);
    if (!selfTalk && isInsult(normalizeCrisis(raw))) return true;
  }
  return false;
}

// Devuelve el mensaje en español para el cerebro. Si el idioma NO es inglés, no toca nada.
function translateInbound(raw, lang) {
  if (lang !== 'en' || !raw) return raw;
  const lower = raw.toLowerCase();
  if (enHandledNatively(raw, lower)) return raw;

  const norm = enNormalize(raw);
  const segs = enApplyRules(norm);
  const out = segs.map(s => (s.done ? s.t : s.t.replace(/[a-z']+/g, w => (EN_WORDS[w] !== undefined ? EN_WORDS[w] : w)))).join(' ');
  const clean = out.replace(/\s+/g, ' ').replace(/\s+([?!.,])/g, '$1').trim();
  return clean || raw;
}
