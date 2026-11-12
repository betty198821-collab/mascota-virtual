/*
  topics.js
  ---------
  Respuestas de apoyo emocional de Error 404. Cada tema tiene varias
  "situaciones" (group). Cada situación tiene:
    - match: lo que tiene que decir el usuario para que se active
    - variants: 3 respuestas distintas, cada una con su texto en
      español (es) y en inglés (en). El bot elige una al azar.

  Para agregar una variante nueva: copiá una línea { es: '...', en: '...' }
  dentro de variants, cambiale el texto, y dejá la coma al final.

  "signals: true" significa que el tema cuenta como señal de tristeza:
  si se repite varias veces, pet-brain.js agrega la recomendación de
  las líneas de ayuda de Colombia.
*/

// Cómo nombra la mascota cada tema cuando lo recuerda ("hablábamos de ...").
// Tienen que leerse bien después de "de" o "sobre".
const TOPIC_LABELS = {
  tristeza:   { es: 'la tristeza', en: 'the sadness' },
  soledad:    { es: 'la soledad', en: 'the loneliness' },
  autoestima: { es: 'cómo te sentís con vos', en: 'how you feel about yourself' },
  ansiedad:   { es: 'la ansiedad', en: 'the anxiety' },
  motivacion: { es: 'la falta de ganas', en: 'the lack of motivation' },
  fracaso:    { es: 'eso que no salió como esperabas', en: "what didn't go the way you hoped" },
  crisis:     { es: 'eso tan difícil que me contaste', en: 'that very hard thing you told me' },
  animo:      { es: 'cómo te venías sintiendo', en: 'how you had been feeling' },
  delicado:   { es: 'eso tan delicado que me contaste', en: 'that very delicate thing you told me' },
  enojo:      { es: 'eso que te hizo enojar', en: 'what made you angry' },
  vacio:      { es: 'ese vacío que sentís', en: 'that emptiness you feel' },
};

const EMOTIONAL_TOPICS = [
  // ---------- Tema 0: enojo y ganas de descargarse ----------
  {
    id: 'enojo',
    signals: false,
    offerAdvice: true,
    expression: 'worried',
    keywords: ['enojad', 'furios', 'rabia', 'no soporto', 'me quiero desquitar'],
    groups: [
      {
        match: /me quiero desquitar|desquitarme con|quiero descargarme con|quiero (gritarle|pegarle|pelear con)/,
        variants: [
          { es: 'ey... sentir ganas de desquitarte significa que hay mucha rabia acumulada. no tiene nada de malo sentirla, pero descargarla con alguien suele dejar un peso después. probemos algo: alejate un momento, respirá despacio, y contame qué pasó. si sentís que podrías lastimar a alguien, buscá a un adulto de confianza o llamá al 123.',
            en: "hey... feeling like taking it out on someone means there's a lot of anger built up. there's nothing wrong with feeling it, but unloading it on someone usually leaves a weight afterwards. let's try something: step away for a moment, breathe slowly, and tell me what happened. if you feel you could hurt someone, find a trusted adult or call 123." },
          { es: 'entiendo que quieras soltar eso con alguien... conmigo podés hacerlo, sin lastimar a nadie. contame todo lo que te hizo enojar, aunque salga desordenado.',
            en: "I understand you want to let that out on someone... with me you can, without hurting anyone. tell me everything that made you angry, even if it comes out messy." },
          { es: 'la rabia necesita salir, sí, pero mejor con alguien que no se lastime: yo puedo escucharte. decime qué fue lo que pasó. y si es muy fuerte, alejate un rato de la persona y respirá.',
            en: "anger does need to come out, yes, but better with someone who won't get hurt: I can listen to you. tell me what happened. and if it's very strong, step away from the person for a while and breathe." },
        ],
      },
      {
        match: /estoy (muy |re |tan )?(enojad|furios|molest)|me siento (enojad|furios|con rabia|molest)|tengo (mucha )?rabia|no soporto sentirme asi|no soporto esto|me siento enojad/,
        variants: [
          { es: 'se nota que estás con mucha rabia, y eso es válido. no tenés que guardártela. contame qué pasó, a tu ritmo, y lo miramos juntos.',
            en: "it shows you're very angry, and that's valid. you don't have to keep it to yourself. tell me what happened, at your pace, and we'll look at it together." },
          { es: 'uf... debe ser incómodo sentirse así. el enojo suele esconder algo que dolió. ¿qué fue lo que te pasó?',
            en: "ugh... it must be uncomfortable to feel this way. anger often hides something that hurt. what happened to you?" },
          { es: 'te entiendo. cuando uno está enojado todo se siente más pesado. respirá un poco, y si querés, contame qué lo provocó.',
            en: "I understand. when you're angry everything feels heavier. breathe a little, and if you want, tell me what set it off." },
        ],
      },
      {
        match: /me va (muy )?mal en todo|todo me sale mal ultimamente|todo me va mal|no se que hacer con mi vida/,
        variants: [
          { es: 'eso suena muy pesado... cuando todo parece salir mal, la cabeza solo ve lo malo. no tenés que resolverlo todo hoy. ¿qué es lo que más te está costando ahora?',
            en: "that sounds very heavy... when everything seems to go wrong, the mind only sees the bad. you don't have to solve it all today. what is the hardest thing for you right now?" },
          { es: 'lamento que estés pasando por eso. una racha mala no define quién sos. vamos de a una cosa: ¿cuál es la que más te preocupa?',
            en: "I'm sorry you're going through that. a bad streak doesn't define who you are. let's take one thing at a time: which one worries you the most?" },
          { es: 'no estás solo/a en esto. aunque ahora todo se vea difícil, se puede ir ordenando de a poco. contame, ¿por dónde empezamos?',
            en: "you're not alone in this. even if everything looks hard now, it can be sorted out little by little. tell me, where do we start?" },
        ],
      },
    ],
  },
  // ---------- Tema 1: tristeza y ganas de llorar ----------
  {
    id: 'tristeza',
    signals: true,
    expression: 'sad',
    keywords: ['triste', 'llorar', 'desanimad'],
    groups: [
      {
        match: /muy triste|me siento triste|estoy triste|tristeza/,
        variants: [
          { es: 'oh... lamento que te estés sintiendo así. n-no tenés que fingir que todo está bien conmigo. si querés, contame qué te viene pesando últimamente. te escucho.',
            en: "oh... I'm sorry you're feeling this way. y-you don't have to pretend everything is fine with me. if you want, tell me what's been weighing on you lately. I'm listening." },
          { es: 'ay... eso suena pesado. conmigo no hace falta que actúes como si estuvieras bien. ¿querés contarme desde cuándo te sentís así?',
            en: "oh... that sounds heavy. you don't need to act like you're okay with me. want to tell me how long you've felt this way?" },
          { es: 'gracias por decírmelo... sé que no es fácil. acá no hay apuro: contame lo que quieras, a tu ritmo.',
            en: "thank you for telling me... I know it isn't easy. there's no rush here: tell me whatever you want, at your own pace." },
        ],
      },
      {
        match: /quiero llorar|ganas de llorar|llorar/,
        variants: [
          { es: 'a veces se juntan tantas cosas que ni sabemos de dónde viene la tristeza. no tenés que encontrar una explicación ahora. si necesitás llorar, está bien. no tenés que ser fuerte todo el tiempo.',
            en: "sometimes so many things pile up that we don't even know where the sadness comes from. you don't have to find an explanation right now. if you need to cry, that's okay. you don't have to be strong all the time." },
          { es: 'llorar no es romperse... a veces es soltar lo que se fue acumulando. si te dan ganas, dejalo salir. yo me quedo acá.',
            en: "crying isn't breaking... sometimes it's letting go of what has been piling up. if you feel like it, let it out. I'll stay right here." },
          { es: 'no hace falta que sepas el motivo. las ganas de llorar también cuentan, aunque no tengan explicación. acá podés.',
            en: "you don't need to know the reason. the urge to cry counts too, even without an explanation. you can here." },
        ],
      },
      {
        match: /harto de sentirme|harta de sentirme|estoy harto|estoy harta|no puedo m[aá]s/,
        variants: [
          { es: 'te creo. debe ser agotador sentir que esto no termina. no vamos a exigirte que arregles todo de golpe. empecemos por algo chico: ¿qué es lo que más te está doliendo hoy?',
            en: "I believe you. it must be exhausting to feel like this never ends. we won't ask you to fix everything at once. let's start with something small: what's hurting you the most today?" },
          { es: 'suena a que llevás mucho tiempo cargando esto... no tenés que resolverlo todo hoy. ¿qué parte pesa más en este momento?',
            en: "it sounds like you've been carrying this for a long time... you don't have to solve it all today. which part weighs the most right now?" },
          { es: 'te entiendo... cansa mucho sentirse así durante tanto tiempo. vayamos de a poquito: ¿qué fue lo más difícil de hoy?',
            en: "I understand... it's very tiring to feel like this for so long. let's go little by little: what was the hardest part of today?" },
        ],
      },
    ],
  },

  // ---------- Tema 2: soledad y sensación de no importar ----------
  {
    id: 'soledad',
    signals: true,
    expression: 'sad',
    keywords: ['me siento solo', 'me siento sola', 'invisible', 'abandonad'],
    groups: [
      {
        match: /me siento (muy |tan |demasiado )?(solo|sola)\b|estoy (muy |tan )?(solo|sola)\b|mucha soledad|siento soledad|no tengo con qui[eé]n hablar/,
        variants: [
          { es: 'lamento que te sientas así. la soledad pesa mucho, y no tenés que cargarla en silencio. acá no estás hablando solo/a: contame qué la hace más fuerte últimamente.',
            en: "I'm sorry you feel this way. loneliness weighs a lot, and you don't have to carry it in silence. you're not talking to yourself here: tell me what has been making it stronger lately." },
          { es: 'gracias por decírmelo... sentirse solo/a duele, incluso cuando hay gente alrededor. ¿desde cuándo te sentís así? te escucho sin apuro.',
            en: "thank you for telling me... feeling alone hurts, even when there are people around. since when have you felt this way? I'm listening, no rush." },
          { es: 'eso que decís importa. no sos una molestia por sentirte solo/a. si querés, empezá por contarme cómo es un día tuyo, y vamos viendo juntos.',
            en: "what you're saying matters. you're not a bother for feeling lonely. if you want, start by telling me what one of your days is like, and we'll look at it together." },
        ],
      },
      {
        match: /no le importo a nadie|nadie me quiere|no importo a nadie|no le intereso a nadie/,
        variants: [
          { es: 'debe doler mucho sentir que nadie te ve. no voy a fingir que sé lo que sienten las personas que te rodean, pero sí quiero escuchar lo que estás viviendo. ¿pasó algo que te hiciera sentir así?',
            en: "it must hurt a lot to feel like nobody sees you. I won't pretend to know what the people around you feel, but I do want to hear what you're going through. did something happen that made you feel this way?" },
          { es: 'eso duele... sentirse invisible es de lo más pesado. acá sí te veo, aunque sea una esfera gris. ¿qué pasó para que lo sientas así?',
            en: "that hurts... feeling invisible is one of the heaviest things. here I do see you, even if I'm just a gray sphere. what happened to make you feel that way?" },
          { es: 'n-no sé qué piensan los demás, pero sé que a mí me importa cómo estás. contame qué te hizo sentir eso.',
            en: "I-I don't know what others think, but I know I care how you are. tell me what made you feel that." },
        ],
      },
      {
        match: /no tengo amigos|sin amigos|no tengo a nadie/,
        variants: [
          { es: 'hacer amigos no siempre es fácil, sobre todo cuando da miedo acercarse. eso no significa que estés destinado a estar solo. podemos pensar una forma pequeña y realista de empezar a conectar con alguien, sin obligarte a cambiar cómo sos.',
            en: "making friends isn't always easy, especially when approaching people is scary. that doesn't mean you're destined to be alone. we can think of a small, realistic way to start connecting with someone, without forcing you to change who you are." },
          { es: 'mm... eso puede sentirse muy solitario. no es una condena, ¿sabés? se puede empezar de a poco. ¿hay alguien con quien hayas hablado, aunque sea un poquito, últimamente?',
            en: "mm... that can feel very lonely. it isn't a life sentence, you know? you can start little by little. is there anyone you've talked to, even a little, lately?" },
          { es: 'gracias por contármelo. yo soy una esfera gris, pero acá estoy, y podemos pensar juntos cómo acercarte a otras personas, sin presión.',
            en: "thank you for telling me. I'm just a gray sphere, but I'm here, and we can think together about how to get closer to other people, with no pressure." },
        ],
      },
      {
        match: /a nadie le importa lo que digo|nadie me escucha|nadie me hace caso/,
        variants: [
          { es: 'no deberías tener que pelear para que te escuchen. contame eso que querías decir. no hace falta que busques las palabras perfectas para que lo que sentís merezca atención.',
            en: "you shouldn't have to fight to be heard. tell me what you wanted to say. you don't need to find the perfect words for what you feel to deserve attention." },
          { es: 'yo sí te estoy escuchando. decime eso que querías decir, aunque salga desordenado.',
            en: "I am listening to you. tell me what you wanted to say, even if it comes out messy." },
          { es: 'eso debe frustrar mucho... acá no te voy a interrumpir. decime lo que querías decir.',
            en: "that must be so frustrating... I won't interrupt you here. tell me what you wanted to say." },
        ],
      },
    ],
  },

  // ---------- Tema 3: baja autoestima ----------
  {
    id: 'autoestima',
    signals: true,
    expression: 'worried',
    keywords: ['no valgo', 'soy tonto', 'soy tonta', 'soy feo', 'soy fea', 'no soy suficiente', 'me decepciono a mí'],
    groups: [
      {
        match: /soy un in[uú]til|soy in[uú]til|soy un fracaso|soy tonto|soy tonta|no sirvo para nada/,
        variants: [
          { es: 'no. haber cometido errores o estar en una etapa difícil no te convierte entero en un fracaso. sé que ahora quizá no veas nada bueno en vos, pero tus peores momentos no son una descripción completa de quién sos.',
            en: "no. making mistakes or going through a hard stage doesn't turn all of you into a failure. I know you might not see anything good in yourself right now, but your worst moments aren't a full description of who you are." },
          { es: 'n-no estoy de acuerdo con eso. un mal momento no define todo lo que sos. ¿qué pasó para que te sintieras así hoy?',
            en: "I-I don't agree with that. one bad moment doesn't define everything you are. what happened to make you feel this way today?" },
          { es: 'no te voy a dar la razón en eso... estás siendo muy duro con vos. contame qué pasó y lo miramos con calma.',
            en: "I won't agree with you on that... you're being very hard on yourself. tell me what happened and we'll look at it calmly." },
        ],
      },
      {
        match: /me odio/,
        variants: [
          { es: 'e-eso es muy duro de llevar por dentro. no te voy a pedir que empieces a quererte de golpe; sé que no funciona así. por ahora, ¿podemos intentar que no te trates con más crueldad de la que ya sentís? merecés un poco de paciencia, incluso de vos.',
            en: "t-that's very hard to carry inside. I won't ask you to suddenly start loving yourself; I know it doesn't work like that. for now, can we try not to treat you with more cruelty than you already feel? you deserve a little patience, even from yourself." },
          { es: 'uf... duele escuchar eso. no tenés que quererte hoy. probemos solamente tratarte con un poquito menos de dureza, ¿sí?',
            en: "ugh... that hurts to hear. you don't have to love yourself today. let's just try treating you with a little less harshness, okay?" },
          { es: 'me preocupa que cargues con eso... no hace falta que te lleves bien con vos todavía. empecemos por no pegarte más. ¿qué te hizo sentir así?',
            en: "it worries me that you carry that... you don't have to get along with yourself yet. let's start by not beating yourself up anymore. what made you feel this way?" },
        ],
      },
      {
        match: /siempre hago todo mal|todo lo hago mal|todo me sale mal/,
        variants: [
          { es: '¿todo? ¿de verdad no hay ni una sola excepción? sé que ahora tu mente te recuerda cada error, pero eso no significa que cuente toda la historia. hablemos de lo que pasó en concreto, sin convertir un error en una sentencia sobre tu vida.',
            en: "everything? is there really not a single exception? I know your mind is reminding you of every mistake right now, but that doesn't mean it's telling the whole story. let's talk about what actually happened, without turning one mistake into a sentence about your life." },
          { es: 'mm... "todo" es una palabra muy grande. ¿me contás qué fue lo último que salió mal? miremos eso en concreto.',
            en: "mm... \"everything\" is a very big word. can you tell me what was the last thing that went wrong? let's look at that specifically." },
          { es: 'cuando uno está mal, la mente solo junta los errores. pero esa no es la historia completa. ¿qué fue lo que pasó exactamente?',
            en: "when you're feeling bad, the mind only collects the mistakes. but that's not the whole story. what exactly happened?" },
        ],
      },
    ],
  },

  // ---------- Tema 4: ansiedad y miedo ----------
  {
    id: 'ansiedad',
    signals: false,
    expression: 'worried',
    keywords: ['ansiedad', 'pánico', 'panico', 'sobrepens', 'abrumad', 'no puedo dormir'],
    groups: [
      {
        match: /no puedo dejar de pensar|pienso (en )?lo peor|todo lo malo que (podr[ií]a|puede) pasar/,
        variants: [
          { es: 'tu mente parece estar tratando de prepararte para todos los problemas posibles a la vez. debe ser agotador. separemos las cosas: ¿qué problema tenés que resolver hoy y qué cosas son todavía solo posibilidades? no tenés que resolver todo el futuro esta noche.',
            en: "your mind seems to be trying to prepare you for every possible problem at once. that must be exhausting. let's separate things: which problem do you have to solve today, and which things are still only possibilities? you don't have to solve the entire future tonight." },
          { es: 'uf, la cabeza a mil... a veces pensar tanto en lo malo es la forma que tiene la mente de intentar protegerte. ¿cuál es la preocupación que más pesa ahora?',
            en: "ugh, your head must be racing... sometimes thinking so much about the bad is the mind's way of trying to protect you. which worry weighs the most right now?" },
          { es: 'lo que imaginás todavía no pasó. vamos de a una cosa: ¿qué es lo que más te asusta que ocurra?',
            en: "what you imagine hasn't happened yet. let's take one thing at a time: what scares you the most might happen?" },
        ],
      },
      {
        match: /mucha ansiedad|tengo ansiedad|estoy ansios|ataque de p[aá]nico|tengo p[aá]nico/,
        variants: [
          { es: 'está bien, vamos despacio. si podés, apoyá los pies en el piso y mirá tres cosas que tengas cerca. no hace falta que te obligues a sentirte tranquilo ya. respirá a un ritmo cómodo y decime qué está pasando ahora.',
            en: "it's okay, let's go slowly. if you can, put your feet on the floor and look at three things near you. you don't need to force yourself to feel calm right away. breathe at a comfortable pace and tell me what's happening now." },
          { es: 'acá estoy. probemos esto: apoyá los pies en el piso, soltá el aire despacio y nombrame tres cosas que veas. sin apuro. después me contás qué pasa.',
            en: "I'm here. let's try this: put your feet on the floor, let the air out slowly and name three things you can see. no rush. then tell me what's going on." },
          { es: 'no estás solo/a en esto ahora. respirá a tu ritmo, sin forzar nada. cuando puedas, contame qué está pasando.',
            en: "you're not alone in this right now. breathe at your own pace, without forcing anything. when you can, tell me what's going on." },
        ],
      },
      {
        match: /miedo de hablar con (la )?gente|miedo a hablar con (la )?gente|me da miedo hablar/,
        variants: [
          { es: 'n-no tenés que volverte alguien extrovertido para relacionarte con los demás. podemos empezar con algo sencillo: saludar a alguien, hacer una pregunta, o una charla corta. la meta no es que el miedo desaparezca de un día para otro, sino que no decida todo por vos.',
            en: "y-you don't have to become an extrovert to relate to others. we can start with something simple: greeting someone, asking a question, or a short chat. the goal isn't for the fear to disappear overnight, but for it not to decide everything for you." },
          { es: 'entiendo ese miedo... hablar con gente puede dar mucho vértigo. probemos con pasos mínimos: un saludo, una pregunta chiquita. de a poco.',
            en: "I understand that fear... talking to people can feel dizzying. let's try tiny steps: a greeting, a small question. little by little." },
          { es: 'es válido sentir eso. no hace falta que seas el alma de la fiesta. ¿qué es lo que más te asusta de hablar con alguien?',
            en: "it's valid to feel that. you don't need to be the life of the party. what scares you the most about talking to someone?" },
        ],
      },
    ],
  },

  // ---------- Tema 5: falta de motivación y agotamiento ----------
  {
    id: 'motivacion',
    signals: false,
    expression: 'talking',
    keywords: ['sin energía', 'sin energia', 'sin motivación', 'sin motivacion', 'procrastin', 'no puedo levantarme', 'todo me cuesta'],
    groups: [
      {
        match: /no tengo ganas de (hacer )?(absolutamente )?nada|sin ganas de nada|no quiero hacer nada/,
        variants: [
          { es: 'entonces no vamos a empezar con una lista interminable. elegí una sola cosa pequeña: tomar agua, comer algo, abrir la ventana, o ducharte si podés. no tenés que ganarte el derecho a descansar siendo productivo.',
            en: "then we won't start with an endless list. pick just one small thing: drink water, eat something, open the window, or take a shower if you can. you don't have to earn the right to rest by being productive." },
          { es: 'mm... hay días así. no hace falta hacer todo. ¿probamos con una sola cosita mínima, como tomar agua o estirarte un poco?',
            en: "mm... there are days like that. you don't have to do everything. shall we try one tiny thing, like drinking water or stretching a little?" },
          { es: 'está bien no tener ganas. no te voy a pedir demasiado: una sola cosa chiquita hoy ya cuenta. y descansar también cuenta.',
            en: "it's okay to not feel like it. I won't ask too much: one tiny thing today already counts. and resting counts too." },
        ],
      },
      {
        match: /soy (muy |demasiado |tan )?perezos[oa]|soy un vago|soy una vaga/,
        variants: [
          { es: 'tal vez estés evitando algunas cosas, pero decirte perezoso no nos ayuda a entender por qué. ¿estás agotado, tenés miedo de equivocarte, o no sabés por dónde empezar? busquemos la causa antes de juzgarte.',
            en: "maybe you're avoiding some things, but calling yourself lazy doesn't help us understand why. are you exhausted, afraid of getting it wrong, or not sure where to start? let's look for the cause before judging you." },
          { es: 'mm, "perezoso" es una etiqueta fácil... ¿y si en realidad estás cansado o con miedo a fallar? contame qué te cuesta empezar.',
            en: "mm, \"lazy\" is an easy label... what if you're actually tired or afraid of failing? tell me what's hard to start." },
          { es: 'no creo que sea pereza sin más. a veces es cansancio o miedo disfrazado. ¿qué es lo que estás evitando?',
            en: "I don't think it's just laziness. sometimes it's tiredness or fear in disguise. what is it that you're avoiding?" },
        ],
      },
      {
        match: /no he logrado nada|no logr[eé] nada|no hice nada con mi vida/,
        variants: [
          { es: 'quiero que seamos justos con vos. ¿estás comparando tu vida real con la parte más linda de la vida de los demás? no hace falta haber conseguido cosas enormes para que tu vida valga. y si hay algo que querés cambiar, lo podemos volver pasos chiquitos.',
            en: "I want us to be fair to you. are you comparing your real life with the prettiest part of other people's lives? you don't need to have achieved huge things for your life to have value. and if there's something you want to change, we can turn it into small steps." },
          { es: 'mmm... eso suena a que te estás midiendo con una vara muy alta. tu vida tiene valor sin logros enormes. ¿hay algo que te gustaría cambiar? lo vemos de a pasos.',
            en: "mmm... that sounds like you're measuring yourself with a very high bar. your life has value without huge achievements. is there something you'd like to change? we'll take it step by step." },
          { es: 'no es una carrera, aunque a veces lo parezca. ¿qué te gustaría haber logrado? quizás podamos empezar por un paso chico.',
            en: "it's not a race, even if it sometimes seems like one. what would you have liked to achieve? maybe we can start with one small step." },
        ],
      },
    ],
  },

  // ---------- Tema 6: frustración, errores y fracasos ----------
  {
    id: 'fracaso',
    signals: false,
    expression: 'sad',
    keywords: ['arruiné todo', 'arruine todo', 'todo salió mal', 'todo salio mal'],
    groups: [
      {
        match: /fracas[eé]/,
        variants: [
          { es: 'lo siento... sé que cuando algo importa mucho, duele más no lograrlo. no te voy a decir que no pasa nada, porque quizá sí tenga consecuencias. pero podemos enfrentarlas sin tratarte como si vos fueras el error.',
            en: "I'm sorry... I know that when something matters a lot, not achieving it hurts even more. I won't tell you it's nothing, because it might have consequences. but we can face them without treating you as if you were the mistake." },
          { es: 'uf... eso debe doler. fallar en algo que importaba es duro. vos no sos ese fracaso, ¿sabés? contame qué pasó.',
            en: "ugh... that must hurt. failing at something that mattered is hard. you are not that failure, you know? tell me what happened." },
          { es: 'lamento que no haya salido como esperabas. podemos mirar con calma qué pasó y qué sigue, sin castigarte.',
            en: "I'm sorry it didn't turn out the way you hoped. we can calmly look at what happened and what comes next, without punishing you." },
        ],
      },
      {
        match: /decepcion[eé] a todos|los decepcion[eé]|las decepcion[eé]/,
        variants: [
          { es: 'puede que alguien esté decepcionado, y lo podemos hablar con honestidad. pero no sabemos que todos piensan lo mismo. ¿qué ocurrió exactamente? veamos qué podés reparar, qué podés aprender y qué cosas no dependen solo de vos.',
            en: "someone might be disappointed, and we can talk about that honestly. but we can't know that everyone thinks the same. what exactly happened? let's see what you can repair, what you can learn, and what doesn't depend only on you." },
          { es: 'mm... "todos" es mucha gente. ¿seguro que todos? contame qué pasó y vemos qué se puede arreglar y qué no depende de vos.',
            en: "mm... \"everyone\" is a lot of people. are you sure everyone? tell me what happened and we'll see what can be fixed and what doesn't depend on you." },
          { es: 'eso pesa... pero no podés leerle la mente a todos. ¿qué fue lo que pasó concretamente?',
            en: "that weighs on you... but you can't read everyone's mind. what exactly happened?" },
        ],
      },
      {
        match: /no quiero volver a intentar/,
        variants: [
          { es: 'podés tomarte un descanso. no tenés que demostrar tu fortaleza repitiendo algo que ahora te está haciendo daño. cuando estés listo/a, vemos si conviene intentarlo de otra forma o elegir otro camino. descansar no es rendirse para siempre.',
            en: "you can take a break. you don't have to prove your strength by repeating something that is hurting you now. when you're ready, we'll see whether it makes sense to try another way or choose another path. resting isn't giving up forever." },
          { es: 'está bien parar un rato. no hace falta insistir con algo que ahora te lastima. después vemos si hay otro camino.',
            en: "it's okay to stop for a while. there's no need to keep pushing at something that hurts you right now. later we'll see if there's another way." },
          { es: 'te entiendo... frenar no es fracasar. descansá, y cuando quieras lo pensamos juntos.',
            en: "I understand... stopping isn't failing. rest, and whenever you want we'll think about it together." },
        ],
      },
    ],
  },
  // ---------- Tema 7: vacío emocional ----------
  {
    id: 'vacio',
    signals: true,
    offerAdvice: true,
    expression: 'worried',
    keywords: ['vacío', 'vacio', 'entumecid', 'no siento nada', 'nada me importa'],
    groups: [
      {
        match: /me siento (muy |tan |totalmente |completamente )?vac[ií][oa]|siento (un |como un )?vac[ií]o|vac[ií]o (emocional|por dentro|interior|adentro)|hay un vac[ií]o|estoy vac[ií][oa]/,
        variants: [
          { es: 'gracias por ponerle nombre a eso. el vacío es difícil de explicar, y no hace falta que lo expliques bien: acá te escucho igual. ¿hace mucho que lo sentís, o apareció hace poco?',
            en: "thank you for putting a name to that. emptiness is hard to explain, and you don't need to explain it well: I'm listening anyway. have you felt it for a long time, or did it show up recently?" },
          { es: 'un vacío así pesa, aunque desde afuera no se vea. no estás exagerando ni estás roto/a. si querés, contame cómo es para vos: si es silencio, cansancio, o como si algo faltara.',
            en: "an emptiness like that weighs on you, even if it doesn't show from the outside. you're not exaggerating and you're not broken. if you want, tell me what it's like for you: if it's silence, tiredness, or as if something were missing." },
          { es: 'te creo. sentirse vacío/a no es algo que uno elija, y mucha gente lo pasa en silencio. no tenés que atravesarlo solo/a: estoy acá, a tu ritmo.',
            en: "I believe you. feeling empty isn't something a person chooses, and many people go through it in silence. you don't have to go through it alone: I'm here, at your pace." },
        ],
      },
      {
        match: /no siento nada|me siento (entumecid|insensible|anestesiad|apagad)|siento que nada me importa|nada me importa|todo me da igual|ya nada me emociona|nada me hace sentir/,
        variants: [
          { es: 'no sentir nada también es una forma de dolor, aunque parezca lo contrario. a veces la mente se apaga un poco para protegerse. no te exijas sentir de golpe: contame qué pasó antes de que empezara, si te acordás.',
            en: "feeling nothing is also a form of pain, even if it seems like the opposite. sometimes the mind switches off a little to protect itself. don't demand yourself to feel all at once: tell me what happened before it began, if you remember." },
          { es: 'gracias por contármelo. sentirse apagado/a o entumecido/a es más común de lo que parece, y no significa que no te importe la vida ni la gente. ¿hay algo que antes disfrutabas y ahora ya no?',
            en: "thank you for telling me. feeling switched off or numb is more common than it seems, and it doesn't mean you don't care about life or people. is there something you used to enjoy that you no longer do?" },
          { es: 'te escucho. cuando nada emociona, todo se vuelve gris y cansa mucho. no tenés que fingir que estás bien conmigo. contame, aunque sea poquito, cómo fue tu día.',
            en: "I'm listening. when nothing excites you, everything turns gray and it's very tiring. you don't have to pretend you're okay with me. tell me, even just a little, how your day was." },
        ],
      },
    ],
  },
];

// Busca si el mensaje encaja con alguna situación emocional.
// 1) primero coincidencias específicas (match), 2) si no hay, palabras clave sueltas.
// Devuelve { text, expression, signals } o null.
function findEmotionalReply(text) {
  for (const topic of EMOTIONAL_TOPICS) {
    for (const group of topic.groups) {
      if (group.match.test(text)) {
        const v = group.variants[Math.floor(Math.random() * group.variants.length)];
        return { text: v.es, expression: topic.expression, signals: topic.signals, topicId: topic.id, offerAdvice: !!topic.offerAdvice };
      }
    }
  }
  for (const topic of EMOTIONAL_TOPICS) {
    if (topic.keywords.some(k => text.includes(k))) {
      const group = topic.groups[Math.floor(Math.random() * topic.groups.length)];
      const v = group.variants[Math.floor(Math.random() * group.variants.length)];
      return { text: v.es, expression: topic.expression, signals: topic.signals, topicId: topic.id, offerAdvice: !!topic.offerAdvice };
    }
  }
  return null;
}
