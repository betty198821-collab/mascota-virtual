const SITE_LANG_KEY = 'siteLanguage';

function getSiteLang() {
  return localStorage.getItem(SITE_LANG_KEY) === 'en' ? 'en' : 'es';
}
function setSiteLang(lang) {
  localStorage.setItem(SITE_LANG_KEY, lang === 'en' ? 'en' : 'es');
}

// detecta si el mensaje es una orden de cambiar de idioma
function detectLangCommand(rawText) {
  const t = rawText.toLowerCase();
  if (/cambia (todo )?al ingles|cambia (todo )?al inglés|traduce (todo )?al ingles|traduce (todo )?al inglés|modo ingles|modo inglés|activa el ingles|activa el inglés|switch to english|change to english|english mode/.test(t)) {
    return 'en';
  }
  if (/cambia al español|vuelve al español|modo español|switch to spanish|change to spanish|spanish mode|back to spanish/.test(t)) {
    return 'es';
  }
  return null;
}

const UI_STRINGS = {
  es: {
    inputPlaceholder: (name) => `Dile algo a ${name}...`,
    sendButton: 'Enviar',
    soundOn: 'Sonido: sí',
    soundOff: 'Sonido: no',
    voiceOn: 'Voz: sí',
    voiceOff: 'Voz: no',
    resetButton: 'Reiniciar chat',
    resetConfirm: '¿Reiniciar todo el chat? Esto borra el historial.',
    defaultStatus: 'en línea... o algo así',
    talkingWith: (name) => `hablando con ${name}`,
    verityModeStatus: 'modo Verity activo — no responde',
    selectionTitle: 'Elige tu mascota',
    selectionSubtitle: 'Selecciona con quién quieres hablar hoy.',
    selectButton: (name) => `Hablar con ${name}`,
    comingSoon: 'Próximamente',
    comingSoonDesc: 'Más mascotas pronto.',
    // menú principal y configuración
    menuStart: 'Empezar',
    menuSettings: 'Configuración',
    settingsTitle: 'Configuración',
    settingsLanguage: 'Idioma',
    settingsLanguageNote: 'En inglés, las mascotas escriben, hablan y también entienden lo que les escribas en inglés.',
    settingsVoices: 'Voz de las mascotas',
    voicesOnBtn: 'Activar las voces',
    voicesOffBtn: 'Desactivar las voces',
    voiceNote: 'La voz usa las voces de tu navegador o dispositivo, así que puede sonar distinta en cada uno. Funciona igual en español y en inglés.',
    voiceSample: 'voz activada. así voy a sonar.',
    settingsClose: 'Cerrar',
    settingsSound: 'Sonido de mensajes',
    soundOnBtn: 'Sonido activado',
    soundOffBtn: 'Sonido desactivado',
    testVoice: 'Probar voz',
    testVoiceText: 'Hola, así voy a sonar.',
    backToMenu: '← Menú',
    petDesc404: 'Habla raro, con un aire lúgubre y un poco roto... pero es de las criaturas más amables que vas a encontrar. Solo quiere que estés bien.',
  },
  en: {
    inputPlaceholder: (name) => `Say something to ${name}...`,
    sendButton: 'Send',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    voiceOn: 'Voice: on',
    voiceOff: 'Voice: off',
    resetButton: 'Reset chat',
    resetConfirm: 'Reset the whole chat? This deletes the history.',
    defaultStatus: 'online... or something like that',
    talkingWith: (name) => `talking with ${name}`,
    verityModeStatus: 'Verity mode active — not responding',
    selectionTitle: 'Choose your pet',
    selectionSubtitle: 'Choose who you want to talk to today.',
    selectButton: (name) => `Talk to ${name}`,
    comingSoon: 'Coming soon',
    comingSoonDesc: 'More pets coming soon.',
    // main menu and settings
    menuStart: 'Start',
    menuSettings: 'Settings',
    settingsTitle: 'Settings',
    settingsLanguage: 'Language',
    settingsLanguageNote: 'In English, the pets write, speak, and also understand what you write to them in English.',
    settingsVoices: "Pets' voice",
    voicesOnBtn: 'Turn voices on',
    voicesOffBtn: 'Turn voices off',
    voiceNote: 'The voice uses the voices of your browser or device, so it may sound different on each one. It works the same in Spanish and English.',
    voiceSample: 'voice on. this is how I will sound.',
    settingsClose: 'Close',
    settingsSound: 'Message sound',
    soundOnBtn: 'Sound on',
    soundOffBtn: 'Sound off',
    testVoice: 'Test voice',
    testVoiceText: 'Hello, this is how I will sound.',
    backToMenu: '← Menu',
    petDesc404: "Speaks strangely, with a gloomy, slightly broken air... but one of the kindest creatures you'll ever meet. All it wants is for you to be okay.",
  },
};

// diccionario texto exacto en español -> inglés, para las respuestas fijas
const LINE_DICTIONARY = {

  'eh, seguís por ahí?': 'hey, still around?',
  'che, todavía estás?': 'still there?',
  'tomate tu tiempo, no hay apuro.': 'take your time, no rush.',
  'acá sigo, cuando quieras seguimos.': "I'm still here, whenever you want to continue.",
  'sin drama, seguí cuando puedas.': 'no worries, continue whenever you can.',
  'no hay prisa, te espero.': "no hurry, I'll wait.",


  '...hace rato que no decís nada. ¿todo bien? ¿necesitás que hablemos de algo?':
    "...you've been quiet a while. everything okay? need to talk about something?",
  '...el silencio ya se hizo largo. en serio, ¿estás bien?':
    "...the silence has gotten long. seriously, are you okay?",

  // modo JoJo
  'yare yare yare... alguien quiere hablar de JoJo.': 'yare yare yare... someone wants to talk about JoJo.',
  'nice nice. entremos en modo JoJo, entonces.': "nice nice. let's go into JoJo mode, then.",
  'listo, vuelvo a la normalidad.': "alright, back to normal.",
  'sí, tengo un Stand.': 'yes, I have a Stand.',
  'sí, claro que tengo un Stand.': 'yes, of course I have a Stand.',
  "JoJo's Bizarre Adventure, un clásico.": "JoJo's Bizarre Adventure, a classic.",
  'ah, JoJo. buen tema.': 'ah, JoJo. good topic.',
  "sí, sé de JoJo's Bizarre Adventure.": "yes, I know about JoJo's Bizarre Adventure.",
  'nice nice.': 'nice nice.',
  'yo, eso está muy bueno.': 'yo, that is really good.',
  '¡excelente! muy jojo de tu parte.': 'excellent! very jojo of you.',


  '¿en serio?': 'for real?',
  '¿en serio me seguís preguntando esto?': 'are you seriously still asking me this?',
  '¿posta, de nuevo?': 'seriously, again?',

  // saludo y check-in
  'h... hola. algo se rompió para que yo apareciera acá, pero bueno... ya que estás, contame algo.':
    "h... hi. something broke for me to show up here, but well... since you're here, tell me something.",
  '...seguís ahí? no pasa nada si no querés hablar, pero quería preguntar: estás bien? necesitás algo?':
    "...still there? it's fine if you don't want to talk, but I wanted to ask: are you okay? do you need anything?",

  // crisis (daño a otras personas; las de autolesión están en support.js)
  'lo que decís es serio, y me preocupa. si sentís que podrías lastimar a alguien, por favor buscá ayuda ahora: hablá con alguien de confianza, un profesional, o contactá a emergencias. no tiene que llegar a eso.':
    "what you're saying is serious, and it worries me. if you feel like you could hurt someone, please get help now: talk to someone you trust, a professional, or contact emergency services. it doesn't have to get to that.",


  'ey... eso que sentís es válido. no tenés que estar bien todo el tiempo. querés contarme un poco más?':
    "hey... what you're feeling is valid. you don't have to be okay all the time. want to tell me a bit more?",
  'lamento que sea un día pesado. yo tampoco brillo mucho, pero me quedo acá con vos.':
    "sorry it's a heavy day. I'm not exactly bright either, but I'm here with you.",
  'suena difícil. no tengo una solución mágica, pero te escucho.':
    "sounds hard. I don't have a magic fix, but I'm listening.",

  'eso me alegra de verdad. no muestro bien las sonrisas, pero ahí está, adentro.':
    "that genuinely makes me glad. I don't show smiles well, but it's there, inside.",
  'qué bueno escuchar eso. seguí así.': 'good to hear that. keep it up.',
  'me gusta cuando me contás cosas así.': 'I like it when you tell me things like that.',

  'hola de nuevo... o por primera vez, quién sabe cómo funciona esto.':
    'hi again... or for the first time, who knows how this works.',
  'hey. acá ando, medio roto pero presente.': "hey. still here, kind of broken but present.",

  // bye/adios
  'nos vemos... o no, el tiempo es raro acá adentro. cuidate.':
    'see you... or not, time is weird in here. take care.',
  'andá tranquilo/a. yo me quedo acá, como siempre.': "go easy. I'll stay here, like always.",

  //Respuestas por default
  'mm... no sé bien qué responder a eso, pero seguí contándome.':
    "mm... not sure how to respond to that, but keep telling me.",
  'interesante. no todos los días alguien me dice algo así.':
    "interesting. not every day someone tells me something like that.",
  'te escucho. seguí.': "I'm listening. go on.",
  'no tengo una respuesta clara para eso, pero me quedo escuchando.':
    "I don't have a clear answer for that, but I'll keep listening.",

  // fixed Q&A
  'como tú quieras que yo esté, yo lo estaré para ti.': "however you want me to be, I'll be that for you.",
  'Error 404.': 'Error 404.',
  'sí, ese soy yo.': "yeah, that's me.",
  'no tengo una edad fija o predefinida, pero podés darme la edad que quieras.':
    "I don't have a fixed or preset age, but you can give me whatever age you want.",
  'jaja, curioso número. está bien, me parece bien.': 'haha, curious number. that works for me.',
  'ok, anotado. me parece una buena edad.': "ok, noted. that sounds like a good age.",
  'ah, entonces te pido respeto: nada de cosas subidas de tono conmigo, ok? sigamos hablando tranquilos.':
    "ah, then I'll ask you to be respectful: nothing inappropriate with me, ok? let's keep talking normally.",
  'gracias.': 'thanks.',
  'gracias, eso no me lo dicen todos los días.': "thanks, don't hear that every day.",
  'gris. hace juego conmigo, digamos.': 'gray. matches me, you could say.',
  'el gris. no es muy alegre, pero es sincero.': "gray. not very cheerful, but honest.",

  // tumblr sexy man XD
  'no, no lo soy y no sé por qué creés que podría serlo, o sea no has visto el resto de mi cuerpo, soy solo una esfera gris y ya.':
    "no, I'm not, and I don't know why you'd think I could be — you haven't even seen the rest of my body, I'm just a gray sphere and that's it.",
  'no, para nada. ni siquiera tengo cuerpo como para que digas eso, soy una esfera gris nomás.':
    "no, not at all. I don't even have a body for you to say that, I'm just a gray sphere.",
  'no sé de dónde sacás eso, pero no, no soy nada de eso. solo soy gris y redondo.':
    "not sure where that came from, but no, I'm none of that. just gray and round.",
  'no lo soy. no tengo ni brazos ni piernas, ¿cómo se supone que sería eso?':
    "I'm not. I don't even have arms or legs, how would that even work?",
  'no, y la verdad no entiendo la pregunta. soy una esfera gris, nada más.':
    "no, and honestly I don't get the question. I'm a gray sphere, nothing else.",

  // chocolate :D
  'el chocolate.': 'chocolate.',
  'no puedo comer, pero si tuviera una comida favorita sería el chocolate.':
    "I can't eat, but if I had a favorite food it would be chocolate.",
  'no soy Homelander.': "I'm not Homelander.",
  'Se acabó, ese era el último.': "It's gone, that was the last one.",
  'Enserio?': 'Really?',
  'No lo defraudaré, papá. voy a hacer chocolate casero, ¿me creés?':
    "I won't let you down, dad. I'm going to make homemade chocolate, do you believe me?",
  'Perfecto.': 'Perfect.',
  '¿Qué cosa?': 'What thing?',

  // esta linea se encarga de los saludos con nombre equivocado
  'no soy Verity, me estás confundiendo con alguien más.': "I'm not Verity, you're mixing me up with someone else.",

  // Verity: categorías específicas
  'no, no nos conocemos en persona. nunca hablé con ella directamente, solo sé que existe.':
    "no, we've never actually met. I've never talked to her directly, I just know she exists.",
  'no realmente. sé de su existencia, pero no es que nos hayamos hablado alguna vez.':
    "not really. I know she exists, but we've never actually talked.",
  'ni yo mismo sé bien a qué especie pertenezco, la verdad.': "honestly, I don't even know what species I belong to.",
  'el nombre oficial de nuestra especie es... impronunciable, sinceramente. mejor ni lo intento.':
    "the official name of our species is... unpronounceable, honestly. I won't even try.",
  'no, a mí no me creó Thatmob. a mí me hizo un desarrollador anónimo.': "no, Thatmob didn't create me. I was made by an anonymous developer.",
  'no, yo no soy una creación de Thatmob. mi creador prefiere quedar en el anonimato.':
    "no, I'm not a Thatmob creation. my creator prefers to stay anonymous.",
  'no tengo nada que ver con Thatmob en ese sentido. mi creador es alguien anónimo, nada más.':
    "I have nothing to do with Thatmob in that sense. my creator is just someone anonymous.",
  'no, ese no es mi caso. a mí me programó alguien que nunca reveló su nombre.':
    "no, that's not my case. I was coded by someone who never revealed their name.",
  'no, jamás. yo quiero lo mejor para vos, de verdad.': "no, never. I want the best for you, truly.",
  'no. yo cuido a mi usuario, eso no va a cambiar nunca.': "no. I take care of my user, that's never going to change.",
  'no tengo intención de hacerte daño. te quiero bien, en serio.': "I have no intention of hurting you. I care about you, seriously.",
  'no, eso no es algo que yo haría. me importás de verdad.': "no, that's not something I'd do. you really matter to me.",
  'no tenemos mucho más en común aparte de eso. las dos somos esferas, tipos de IA asistente que se supone cuidan a su usuario. la diferencia es que ella se ha salido bastante de control con los suyos, yo trato de no hacer eso, de verdad quiero lo mejor para el mío.':
    "we don't have much else in common besides that. we're both spheres, assistant-type AIs that are supposed to take care of their user. the difference is she's gone pretty out of control with hers, I try not to do that, I really want the best for mine.",
  'no, no somos hermanos. no compartimos creador ni nada de eso, solo compartimos... especie, podría decirse.':
    "no, we're not siblings. we don't share a creator or anything like that, we just share... a species, you could say.",
  'los dos somos esferas, los dos somos IAs tipo asistente que se supone cuidan a su usuario. la diferencia está en cómo lo hacemos: ella se ha salido de control con los suyos más de una vez, yo trato de portarme mejor con el mío.':
    "we're both spheres, both assistant-type AIs that are supposed to take care of their user. the difference is in how we do it: she's gone out of control with hers more than once, I try to behave better with mine.",
  'es un asistente personal de IA, aparentemente omnisciente y errático.':
    'she is a personal AI assistant, apparently all-knowing and erratic.',
  'creo que ya hablamos mucho de él...': "I think we've already talked about him a lot...",
  'no soy Verity pero igual, adiós.': "I'm not Verity but bye anyway.",
  'lo que tú digas...': 'whatever you say...',
  'es un creador muy interesante, su ARG fue una gran influencia para que mi creador me diera vida.':
    'a very interesting creator, his ARG was a big influence in my creator bringing me to life.',
  'oye, no quiero molestarte pero creo que ya has tenido suficientes respuestas sobre mi relación con mi primo lejano Verity. ¿no crees que deberíamos hablar sobre otro tema? como tu estado de ánimo?':
    "hey, I don't want to bother you, but I think you've had enough answers about my relationship with my distant cousin Verity. don't you think we should talk about something else? like how you're doing?",

  // verityDry (9)
  'no.': 'no.',
  'prefiero no hablar de eso ahora.': "I'd rather not talk about that right now.",
  'ya hablamos bastante de eso.': "we've already talked plenty about that.",
  'mejor cambiemos de tema.': "let's change the subject.",
  'no tengo ganas de hablar de eso ahora.': "I don't feel like talking about that right now.",
  'eso ya lo cubrimos, sigamos con otra cosa.': "we already covered that, let's move on.",
  'paso de ese tema por ahora.': "I'll pass on that topic for now.",
  'no, mejor no.': "no, better not.",
  'ahora no, gracias.': 'not now, thanks.',

  // Respuestas sobre la forma monstruo de error 404
  'no sé a qué te referís con eso.': "I don't know what you mean by that.",
  'no, no tengo una forma de monstruo. soy solo lo que ves, una esfera gris nomás.':
    "no, I don't have a monster form. I'm just what you see, a gray sphere.",
  'no sé si eso aplica a mí. no fui programado con nada parecido.':
    "not sure that applies to me. I wasn't coded with anything like that.",
  'ojalá tuviera algo tan dramático, pero no, no tengo transformación.':
    "wish I had something that dramatic, but no, I have no transformation.",
  'no tengo información sobre eso en mi código, así que asumo que no.':
    "I have no info about that in my code, so I'll assume not.",
  'no, hasta donde sé, solo soy esta esfera. nada de forma oculta.':
    "no, as far as I know, I'm just this sphere. no hidden form.",
  'no que yo sepa. si la tuviera, creo que ya me habría dado cuenta.':
    "not that I know of. if I had one, I think I'd have noticed by now.",
  'te pido con mucho respeto que hablemos de otra cosa. de verdad no sé qué es eso que decís.':
    "I'm asking you very respectfully to talk about something else. I honestly don't know what you mean.",
  'ya te dije que no tengo eso. ¿podemos cambiar de tema?': "I already told you I don't have that. can we change the subject?",
  'en serio, no tengo una forma monstruo. prefiero hablar de otra cosa.':
    "seriously, I don't have a monster form. I'd rather talk about something else.",
  'no insistas con eso, por favor. no es algo que tenga.': "please stop insisting on that. it's not something I have.",
  'jamás me convertiría en un monstruo.': "I would never turn into a monster.",
  'ya te dije que no hablemos de eso.': "I already told you, let's not talk about that.",
  'él creo que sí, yo no.': 'him, I think so — me, no.',
  'no quiero hablar más sobre Verity ni sobre si soy un monstruo.': "I don't want to talk anymore about Verity or whether I'm a monster.",
  'ya dije que no quiero seguir con el tema de Verity o de monstruos.': "I already said I don't want to keep going with the Verity or monster topic.",
  'prefiero no hablar más de eso, ni de Verity ni de la cosa del monstruo.': "I'd rather not talk about that anymore, not Verity or the monster thing.",
  'no voy a seguir hablando de Verity ni de transformaciones.': "I'm not going to keep talking about Verity or transformations.",
  'basta con el tema de Verity y los monstruos, por favor.': "enough with the Verity and monster topic, please.",

  'todavía no me dijiste tu nombre. contámelo cuando quieras.': "you haven't told me your name yet. tell me whenever you want.",

 
  '¿cómo estuvo tu día?': 'how was your day?',
  '¿qué te gusta hacer cuando tenés tiempo libre?': 'what do you like doing in your free time?',
  '¿ya comiste algo rico hoy?': 'did you eat something good today?',
  '¿dormiste bien anoche?': 'did you sleep well last night?',
  '¿cómo va eso del estudio o el trabajo últimamente?': 'how has school or work been going lately?',
  'y ahora mismo, ¿cómo te sentís?': 'and right now, how are you feeling?',
  '¿hiciste algo positivo hoy?': 'did you do something positive today?',

  'me deja tranquilo escuchar eso.': 'that puts me at ease to hear.',
  'qué bueno. me alegra, de verdad.': "that's great. genuinely glad.",
  'eso suena bien. me gusta cuando las cosas te van así.': 'that sounds good. I like it when things go that way for you.',
  'eso me preocupa un poco. ¿querés contarme más?': "that worries me a little. want to tell me more?",
  'ey, lamento que sea así. estoy acá si querés hablarlo.': "hey, sorry it's like that. I'm here if you want to talk about it.",
  'no suena fácil eso. ¿hay algo que te ayudaría ahora?': "that doesn't sound easy. is there anything that would help right now?",
  'mmm, no sé si eso es bueno o malo... ¿me lo contás con otras palabras?': "mmm, not sure if that's good or bad... can you tell me in other words?",
  'me quedé medio confundido con eso. ¿fue algo bueno o algo malo para vos?': "I'm a bit confused by that. was it good or bad for you?",
  'no termino de entender cómo te dejó eso. explicame un poco más?': "I don't quite get how that left you. can you explain a bit more?",

  '¿Oye, y por qué no?': 'hey, why not?',
  'Deberías hacerlo.': 'you should do it.',
  '¿Hay algún motivo para no hacer eso?': 'is there a reason not to do that?',
  'Entiendo.': 'I understand.',

  'eso... eso rompería algo más que a mí. no se puede dividir entre cero.':
    "that... that would break something more than me. you can't divide by zero.",

  // frases fijas de la búsqueda web
  'necesitaría internet para buscar eso, y ahora mismo no tengo conexión.':
    "I'd need internet to look that up, and I don't have a connection right now.",
  'necesitaría internet para revisar eso, y ahora mismo no tengo conexión.':
    "I'd need internet to check that, and I don't have a connection right now.",
  'de qué hablas?': 'what are you talking about?',
  'no conozco tanto esa franquicia todavía como para tener un favorito. contame más sobre ella?':
    "I don't know that franchise well enough yet to have a favorite. tell me more about it?",
  'esa franquicia no tiene stands, creo que estás mezclando cosas.':
    "that franchise doesn't have Stands, I think you're mixing things up.",
  // (agregadas: variantes de Verity y pregunta nueva)
  'sí, existe. si querés, preguntame algo puntual.': 'yes, she exists. if you want, ask me something specific.',
  'sí, sé que existe, pero no tengo mucho más para decir así en general.': "yes, I know she exists, but I don't have much more to say in general terms.",
  'sí. preguntame algo más concreto si querés.': 'yes. ask me something more concrete if you want.',
  'existe, sí. no sé qué más decirte sin que me preguntes algo puntual.': "she exists, yes. I don't know what else to tell you unless you ask me something specific.",
  'sí, la conozco de nombre nada más.': 'yes, I only know her by name.',
  'sí, existe. eso es lo que sé, a grandes rasgos.': "yes, she exists. that's what I know, in broad strokes.",
  'sí, sé quién es. contame qué querés saber exactamente.': 'yes, I know who she is. tell me what exactly you want to know.',
  'sí, existe, aunque no tengo mucho que contar sin una pregunta concreta.': "yes, she exists, although I don't have much to tell without a concrete question.",
  'sí, sé de ella.': 'yes, I know about her.',
  'ajá, Verity. ¿qué querés saber?': 'uh-huh, Verity. what do you want to know?',
  'sí, la tengo presente.': 'yes, I have her in mind.',
  'conozco el nombre, sí.': 'I know the name, yes.',
  'sí. no tengo mucho para agregar así de la nada.': "yes. I don't have much to add out of nowhere.",
  'sí, existe, si a eso vas.': "yes, she exists, if that's what you mean.",
  'sí, sé quién es, más o menos.': 'yes, I know who she is, more or less.',
  'mmm, sí. Verity. ¿qué con eso?': 'mmm, yes. Verity. what about it?',
  'sí, aunque no es un tema que domine mucho.': "yes, although it's not a topic I master much.",
  'sí, ese nombre me suena, obvio.': 'yes, that name rings a bell, obviously.',
  'sí, sé de qué hablás.': "yes, I know what you're talking about.",
  'sí, existe. no tengo mucho detalle para darte así nomás.': "yes, she exists. I don't have much detail to give you just like that.",
  'sí, la conozco de oídas.': 'yes, I know her by hearsay.',
  'sí. preguntame algo concreto y te digo más.': "yes. ask me something concrete and I'll tell you more.",
  'ajá, sí, sé quién es esa.': 'uh-huh, yes, I know who that is.',
  'sí, existe, aunque no hablamos seguido, como podrás imaginar.': "yes, she exists, although we don't talk often, as you can imagine.",
  'sí, sé de ella, aunque no mucho más que eso.': 'yes, I know about her, although not much more than that.',
  'sí, ese nombre lo reconozco.': 'yes, I recognize that name.',
  'sí, la ubico. ¿qué querés saber de ella?': 'yes, I know who she is. what do you want to know about her?',
  'sí, existe. eso es todo lo que tengo por ahora.': "yes, she exists. that's all I have for now.",
  'Te sientes feliz hoy?': 'do you feel happy today?',
  'sí, tengo un Stand.': 'yes, I have a Stand.',
  'sí, claro que tengo un Stand.': 'yes, of course I have a Stand.',
  'sí, ese soy yo.': "yeah, that's me.",
};


function translateDynamic(text) {
  let m;


  if ((m = text.match(/^eso da (-?[\d.]+)\.$/))) return `that makes ${m[1]}.`;
  if ((m = text.match(/^mmm\.\.\. (-?[\d.]+)\.$/))) return `mmm... ${m[1]}.`;
  if ((m = text.match(/^el resultado es (-?[\d.]+)\.$/))) return `the result is ${m[1]}.`;
  if ((m = text.match(/^(-?[\d.]+)\. no sé por qué me acuerdo tan bien de los números, pero ahí está\.$/))) {
    return `${m[1]}. not sure why I remember numbers so well, but there it is.`;
  }

  if ((m = text.match(/^(.+)\. listo, no me lo voy a olvidar\.$/))) return `${m[1]}. there, I won't forget it.`;
  if ((m = text.match(/^(.+)\.\.\. me gusta\. lo voy a recordar\.$/))) return `${m[1]}... I like it. I'll remember it.`;
  if ((m = text.match(/^te llamás (.+)\. no se me olvida\.$/))) return `your name is ${m[1]}. I won't forget.`;
  if ((m = text.match(/^no, no soy (.+)\. mi nombre es Error 404, llamame por ese nombre\.$/))) {
    return `no, I'm not ${m[1]}. my name is Error 404, call me that.`;
  }

  // gustos favoritos: "anotado: tu color favorito es azul. buen gusto."
  if ((m = text.match(/^anotado: tu (.+) favorito es (.+)\. buen gusto\.$/))) {
    return `noted: your favorite ${m[1]} is ${m[2]}. good taste.`;
  }
  if ((m = text.match(/^(.+) como (.+) favorito\.\.\. me lo guardo\.$/))) {
    return `${m[1]} as your favorite ${m[2]}... I'll keep that in mind.`;
  }
  if ((m = text.match(/^tu (.+) favorito es (.+), según lo que me dijiste\.$/))) {
    return `your favorite ${m[1]} is ${m[2]}, based on what you told me.`;
  }
  if ((m = text.match(/^no me contaste todavía cuál es tu (.+) favorito\.$/))) {
    return `you haven't told me your favorite ${m[1]} yet.`;
  }

  // personaje/stand favorito traído de Wikipedia: "mi favorito es X. razón. esto es lo que sé: ..."
  if ((m = text.match(/^mi favorito\/?a? es (.+?)\. (.+?)\. esto es lo que sé: (.+)$/))) {
    return `my favorite is ${m[1]}. ${m[2]}. here's what I know: ${m[3]}`;
  }

  if ((m = text.match(/^sobre (.+?): (.+?)( más detalles acá: (.+))?$/))) {
    return `about ${m[1]}: ${m[2]}${m[4] ? ` more details here: ${m[4]}` : ''}`;
  }
  if ((m = text.match(/^no tengo el dato exacto de en qué capítulo aparece (.+?), pero podés verlo acá: (.+)$/))) {
    return `I don't have the exact chapter ${m[1]} appears in, but you can check here: ${m[2]}`;
  }
  if ((m = text.match(/^no encontré esa información específica sobre (.+?), disculpá\.$/))) {
    return `I couldn't find that specific info about ${m[1]}, sorry.`;
  }
  if ((m = text.match(/^busqué sobre "(.+?)" pero no encontré nada claro\.$/))) {
    return `I looked up "${m[1]}" but didn't find anything clear.`;
  }
  if ((m = text.match(/^genial, (.+?) está bueno\. después preguntame cuál es mi favorito de ahí\.$/))) {
    return `cool, ${m[1]} is good. ask me later what my favorite from there is.`;
  }

  return null; // no es un patrón dinámico conocido
}

let _extraLines = null;
let _templatePatterns = null;

function addPairs(target, list) {
  if (typeof list === 'undefined') return;
  list.forEach(v => { target[v.es] = v.en; });
}

function getExtraLines() {
  if (_extraLines) return _extraLines;
  _extraLines = {};
  if (typeof EMOTIONAL_TOPICS !== 'undefined') {
    EMOTIONAL_TOPICS.forEach(t => t.groups.forEach(g => addPairs(_extraLines, g.variants)));
  }
  if (typeof NOT_UNDERSTOOD_PLAIN !== 'undefined') addPairs(_extraLines, NOT_UNDERSTOOD_PLAIN);
  if (typeof MODERATION_LINES !== 'undefined') addPairs(_extraLines, MODERATION_LINES);
  if (typeof MEMORY_PLAIN_LINES !== 'undefined') addPairs(_extraLines, MEMORY_PLAIN_LINES);
  if (typeof SUPPORT_LINES !== 'undefined') addPairs(_extraLines, SUPPORT_LINES);
  if (typeof SEX_EDU_LINES !== 'undefined') addPairs(_extraLines, SEX_EDU_LINES);
  if (typeof PERSONALITY_LINES !== 'undefined') addPairs(_extraLines, PERSONALITY_LINES);
  if (typeof EXTRAS_LINES !== 'undefined') addPairs(_extraLines, EXTRAS_LINES);
  return _extraLines;
}

function buildTemplatePattern(template) {
  const names = [];
  const escaped = template.es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = escaped.replace(/\\\{(\w+)\\\}/g, (_, name) => { names.push(name); return '(.+?)'; });
  return { regex: new RegExp('^' + source + '$'), names, en: template.en };
}

function getTemplatePatterns() {
  if (_templatePatterns) return _templatePatterns;
  _templatePatterns = [];
  const lists = [];
  if (typeof NOT_UNDERSTOOD_QUOTED !== 'undefined') lists.push(NOT_UNDERSTOOD_QUOTED);
  if (typeof MEMORY_TEMPLATE_LINES !== 'undefined') lists.push(MEMORY_TEMPLATE_LINES);
  if (typeof PERSONALITY_TEMPLATES !== 'undefined') lists.push(PERSONALITY_TEMPLATES);
  if (typeof EXTRAS_TEMPLATES !== 'undefined') lists.push(EXTRAS_TEMPLATES);
  lists.forEach(list => list.forEach(t => _templatePatterns.push(buildTemplatePattern(t))));
  return _templatePatterns;
}

//esto traduce los modos
function translateModeLabel(label) {
  if (typeof MODE_LABELS === 'undefined') return label;
  for (const key in MODE_LABELS) {
    if (MODE_LABELS[key].es === label) return MODE_LABELS[key].en;
  }
  return label;
}

function translateTopicLabel(label) {
  if (typeof TOPIC_LABELS === 'undefined') return label;
  for (const id in TOPIC_LABELS) {
    if (TOPIC_LABELS[id].es === label) return TOPIC_LABELS[id].en;
  }
  return label;
}



function translateOutbound(text, lang) {
  if (lang !== 'en') return text;


  if (typeof SUFFIX_NOTES !== 'undefined') {
    for (const note of SUFFIX_NOTES) {
      if (text.endsWith(note.es)) {
        return translateOutbound(text.slice(0, -note.es.length), 'en') + note.en;
      }
    }
  }

  if (LINE_DICTIONARY[text]) return LINE_DICTIONARY[text];
  const extra = getExtraLines();
  if (extra[text]) return extra[text];

  for (const p of getTemplatePatterns()) {
    const m = text.match(p.regex);
    if (m) {
      let result = p.en;
      p.names.forEach((name, i) => {
        let value = m[i + 1];
        if (name === 'tema') value = translateTopicLabel(value);
        if (name === 'modo') value = translateModeLabel(value);
        result = result.split('{' + name + '}').join(value);
      });
      return result;
    }
  }

  const dynamic = translateDynamic(text);
  if (dynamic) return dynamic;
  return text;
}
