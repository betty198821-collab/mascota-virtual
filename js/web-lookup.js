/*
  web-lookup.js
  -------------
  Le da a la mascota la capacidad de buscar información real en
  Wikipedia (API pública, gratuita, sin clave) para hablar sobre
  franquicias, personajes y (en JoJo) stands. Solo funciona con
  conexión a internet.

  Atribución: el contenido que trae viene de Wikipedia (CC BY-SA).
*/

const FRANCHISE_CHARACTERS = {
  pokemon: ['Pikachu', 'Charizard', 'Eevee', 'Gengar', 'Lucario', 'Greninja', 'Mewtwo', 'Snorlax'],
  naruto: ['Naruto Uzumaki', 'Sasuke Uchiha', 'Kakashi Hatake', 'Itachi Uchiha', 'Gaara'],
  dragonball: ['Goku', 'Vegeta', 'Piccolo', 'Gohan', 'Trunks (Dragon Ball)'],
  onepiece: ['Monkey D. Luffy', 'Roronoa Zoro', 'Nico Robin', 'Trafalgar Law'],
  aot: ['Eren Yeager', 'Levi Ackerman', 'Mikasa Ackerman'],
  jojo: ['Jotaro Kujo', 'Dio Brando', 'Joseph Joestar', 'Giorno Giovanna', 'Josuke Higashikata'],
  hellsing: ['Alucard (Hellsing)', 'Seras Victoria', 'Integra Hellsing'],
  mobpsycho: ['Mob Psycho 100', 'Shigeo Kageyama', 'Reigen Arataka'],
};

// solo aplica a JoJo: los "Stands" son un concepto propio de esa franquicia.
// Los datos de cada Stand están escritos acá (no se buscan en Wikipedia) porque
// el nombre de varios Stands coincide con otras cosas (ej. "Killer Queen" es
// también una canción de Queen) y la búsqueda traía la página equivocada.
const JOJO_STANDS = {
  'Star Platinum': { part: 3, user: 'Jotaro Kujo',
    es: 'es el Stand de Jotaro Kujo. tiene fuerza, velocidad y precisión sobrehumanas, y su grito de batalla es el famoso «ORA ORA».',
    en: "it's Jotaro Kujo's Stand. it has superhuman strength, speed and precision, and its battle cry is the famous \"ORA ORA\"." },
  'The World': { part: 3, user: 'DIO',
    es: 'es el Stand de DIO. tiene muchísima fuerza y puede detener el tiempo por unos segundos.',
    en: "it's DIO's Stand. it has enormous strength and can stop time for a few seconds." },
  'Silver Chariot': { part: 3, user: 'Jean Pierre Polnareff',
    es: 'es el Stand de Jean Pierre Polnareff: un caballero con espada, rapidísimo y muy preciso con el estoque.',
    en: "it's Jean Pierre Polnareff's Stand: a knight with a rapier, extremely fast and precise." },
  'Hierophant Green': { part: 3, user: 'Noriaki Kakyoin',
    es: 'es el Stand de Noriaki Kakyoin. ataca a distancia con proyectiles de esmeralda (Emerald Splash) y puede estirar su cuerpo como cuerdas.',
    en: "it's Noriaki Kakyoin's Stand. it attacks from a distance with emerald projectiles (Emerald Splash) and can stretch its body like cords." },
  "Magician's Red": { part: 3, user: 'Muhammad Avdol',
    es: 'es el Stand de Muhammad Avdol: tiene forma de ave humanoide y controla el fuego.',
    en: "it's Muhammad Avdol's Stand: a bird-like humanoid that controls fire." },
  'Crazy Diamond': { part: 4, user: 'Josuke Higashikata',
    es: 'es el Stand de Josuke Higashikata. tiene mucha fuerza y puede reparar objetos y curar heridas de otras personas.',
    en: "it's Josuke Higashikata's Stand. it has great strength and can repair objects and heal other people's wounds." },
  'Killer Queen': { part: 4, user: 'Yoshikage Kira',
    es: 'es el Stand de Yoshikage Kira. convierte en bomba cualquier cosa que toca, y tiene habilidades como Sheer Heart Attack y Bites the Dust.',
    en: "it's Yoshikage Kira's Stand. it turns anything it touches into a bomb, and has abilities like Sheer Heart Attack and Bites the Dust." },
  'Gold Experience': { part: 5, user: 'Giorno Giovanna',
    es: 'es el Stand de Giorno Giovanna. da vida a los objetos que golpea, creando seres vivos como plantas o animales, y también sirve para curar.',
    en: "it's Giorno Giovanna's Stand. it gives life to the objects it hits, creating living things like plants or animals, and it can also heal." },
  'King Crimson': { part: 5, user: 'Diavolo',
    es: 'es el Stand de Diavolo. borra una pequeña porción de tiempo para que solo él actúe en ella, y le permite ver brevemente el futuro.',
    en: "it's Diavolo's Stand. it erases a small slice of time so that only he acts within it, and lets him briefly see the future." },
};
const JOJO_PARTS = {
  3: { es: 'la Parte 3 (Stardust Crusaders), que el anime estrenó en 2014', en: 'Part 3 (Stardust Crusaders), which the anime premiered in 2014' },
  4: { es: 'la Parte 4 (Diamond Is Unbreakable), que el anime estrenó en 2016', en: 'Part 4 (Diamond Is Unbreakable), which the anime premiered in 2016' },
  5: { es: 'la Parte 5 (Golden Wind), que el anime estrenó en 2018', en: 'Part 5 (Golden Wind), which the anime premiered in 2018' },
};
const FRANCHISE_STANDS = { jojo: Object.keys(JOJO_STANDS) };

// palabras que tiene que mencionar la página de Wikipedia para aceptarla como
// del personaje correcto (evita traer una canción o una persona con el mismo nombre)
const FRANCHISE_KEYWORDS = {
  pokemon: /pok[eé]mon/i, naruto: /naruto/i, dragonball: /dragon ?ball|goku|saiyan|saiyajin/i,
  onepiece: /one piece/i, aot: /attack on titan|shingeki|titanes/i, jojo: /jojo/i,
  hellsing: /hellsing/i, mobpsycho: /mob psycho/i,
};

// nombres sueltos que reconoce ("goku" a secas = "hablame de Goku")
const KNOWN_NAMES = {
  goku: ['dragonball', 'Goku'], vegeta: ['dragonball', 'Vegeta'], piccolo: ['dragonball', 'Piccolo'],
  gohan: ['dragonball', 'Gohan'], trunks: ['dragonball', 'Trunks (Dragon Ball)'],
  pikachu: ['pokemon', 'Pikachu'], charizard: ['pokemon', 'Charizard'], eevee: ['pokemon', 'Eevee'],
  gengar: ['pokemon', 'Gengar'], lucario: ['pokemon', 'Lucario'], greninja: ['pokemon', 'Greninja'],
  mewtwo: ['pokemon', 'Mewtwo'], snorlax: ['pokemon', 'Snorlax'],
  sasuke: ['naruto', 'Sasuke Uchiha'], kakashi: ['naruto', 'Kakashi Hatake'], itachi: ['naruto', 'Itachi Uchiha'],
  gaara: ['naruto', 'Gaara'], luffy: ['onepiece', 'Monkey D. Luffy'], zoro: ['onepiece', 'Roronoa Zoro'],
  eren: ['aot', 'Eren Yeager'], levi: ['aot', 'Levi Ackerman'], mikasa: ['aot', 'Mikasa Ackerman'],
  jotaro: ['jojo', 'Jotaro Kujo'], dio: ['jojo', 'Dio Brando'], joseph: ['jojo', 'Joseph Joestar'],
  giorno: ['jojo', 'Giorno Giovanna'], josuke: ['jojo', 'Josuke Higashikata'],
  alucard: ['hellsing', 'Alucard (Hellsing)'], seras: ['hellsing', 'Seras Victoria'], integra: ['hellsing', 'Integra Hellsing'],
  reigen: ['mobpsycho', 'Reigen Arataka'],
};

function siteLang() {
  return (typeof getSiteLang === 'function' && getSiteLang() === 'en') ? 'en' : 'es';
}

// busca un Stand por nombre (sin importar mayúsculas)
function findStandByName(text) {
  const t = text.toLowerCase();
  return Object.keys(JOJO_STANDS).find(n => t.includes(n.toLowerCase())) || null;
}

const FRANCHISE_DISPLAY = {
  pokemon: 'Pokémon', naruto: 'Naruto', dragonball: 'Dragon Ball', onepiece: 'One Piece',
  aot: 'Attack on Titan', jojo: "JoJo's Bizarre Adventure", hellsing: 'Hellsing', mobpsycho: 'Mob Psycho 100',
};

function matchFranchise(text) {
  if (text.includes('pokemon') || text.includes('pokémon')) return 'pokemon';
  if (text.includes('naruto')) return 'naruto';
  if (text.includes('dragon ball') || text.includes('dbz')) return 'dragonball';
  if (text.includes('one piece')) return 'onepiece';
  if (text.includes('attack on titan') || text.includes('shingeki')) return 'aot';
  if (text.includes('jojo') || text.includes('bizarre adventure')) return 'jojo';
  if (text.includes('hellsing')) return 'hellsing';
  if (text.includes('mob psycho')) return 'mobpsycho';
  return null;
}

// para agregar una franquicia nueva: sumala a FRANCHISE_CHARACTERS (y a
// FRANCHISE_STANDS si tiene un concepto especial como los Stands) y
// agregá su detección en matchFranchise().

async function fetchWikiSummary(title) {
  try {
    const wikiLang = (typeof getSiteLang === 'function' && getSiteLang() === 'en') ? 'en' : 'es';
    const url = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.extract) return null;
    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls && data.content_urls.desktop ? data.content_urls.desktop.page : null,
    };
  } catch {
    return null; // sin internet, o la página no existe
  }
}

function shorten(extract, sentences = 2) {
  return extract.split('. ').slice(0, sentences).join('. ').trim();
}

// busca dentro del extracto alguna mención de saga/parte/temporada/capítulo,
// para dar más contexto real si Wikipedia lo menciona (sin inventar nada)
function findAppearanceHint(extract) {
  const sentences = extract.split(/(?<=[.!?])\s+/);
  const hint = sentences.find(s =>
    /temporada|parte \d|saga|arco|capítulo|episodio|volumen/i.test(s)
  );
  return hint || null;
}

const CHARACTER_REASONS = ['me encanta su diseño', 'me cae muy bien su personalidad', 'me encanta cómo pelea'];
const STAND_REASONS = ['me encantan sus habilidades', 'me encanta su diseño', 'me encantan tanto su diseño como sus habilidades'];

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function petFavoriteOf(franchiseKey, category, state) {
  const en = siteLang() === 'en';

  // Stands: datos propios, sin búsqueda en la web
  if (category === 'stand') {
    const name = randomOf(Object.keys(JOJO_STANDS));
    const st = JOJO_STANDS[name];
    state.lastFavorite = { name, curated: true, part: st.part, extract: en ? st.en : st.es, url: null };
    const reasonEs = randomOf(STAND_REASONS);
    const reasonEn = { 'me encantan sus habilidades': 'I love its abilities', 'me encanta su diseño': 'I love its design',
      'me encantan tanto su diseño como sus habilidades': 'I love both its design and its abilities' }[reasonEs];
    return {
      text: en ? `my favorite is ${name}. ${reasonEn}. here's what I know: ${st.en}`
               : `mi favorito es ${name}. ${reasonEs}. esto es lo que sé: ${st.es}`,
      expression: 'jojo',
    };
  }

  const list = FRANCHISE_CHARACTERS[franchiseKey];
  if (!list) return null;

  // probamos hasta 3 personajes y nos quedamos con el primero cuya página
  // realmente sea de esa franquicia
  const candidates = [...list].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const name of candidates) {
    const summary = await fetchWikiSummary(name);
    if (!summary || !FRANCHISE_KEYWORDS[franchiseKey].test(summary.title + ' ' + summary.extract)) continue;
    state.lastFavorite = { name: summary.title, url: summary.url, extract: summary.extract };
    const reason = randomOf(CHARACTER_REASONS);
    return {
      text: `mi favorito/a es ${summary.title}. ${reason}. esto es lo que sé: ${shorten(summary.extract, 3)}`,
      expression: franchiseKey === 'jojo' ? 'jojo' : 'happy',
    };
  }
  return { text: `mi favorito/a es ${candidates[0]}, aunque ahora no pude traer más info de la web.`, expression: 'talking' };
}

// responde "en qué parte / capítulo aparece" sobre lo último que se buscó
function appearanceFollowUp(state) {
  if (!state.lastFavorite) {
    state.awaitingClarifyFranchise = true; // así, si aclara la franquicia, sabemos a qué responder
    return { text: 'de qué hablas?', expression: 'confused' };
  }
  const { name, url, extract } = state.lastFavorite;
  if (state.lastFavorite.curated) {
    const en = siteLang() === 'en';
    const part = JOJO_PARTS[state.lastFavorite.part];
    return {
      text: en ? `${name} appears in ${part.en}. I don't have the exact chapter number, I'd rather say that than make one up.`
               : `${name} aparece en ${part.es}. el número de capítulo exacto no lo tengo, prefiero decírtelo antes que inventarlo.`,
      expression: 'jojo',
    };
  }
  const hint = findAppearanceHint(extract);
  if (hint) {
    return { text: `sobre ${name}: ${hint}${url ? ` más detalles acá: ${url}` : ''}`, expression: 'talking' };
  }
  if (url) {
    return { text: `no tengo el dato exacto de en qué capítulo aparece ${name}, pero podés verlo acá: ${url}`, expression: 'confused' };
  }
  return { text: `no encontré esa información específica sobre ${name}, disculpá.`, expression: 'confused' };
}

// revisa si el mensaje pide algo que necesita internet.
// devuelve null si no aplica, o una Promise con { text, expression }.
async function checkWebIntents(rawText, state) {
  const text = rawText.toLowerCase();

  // si se quedó confundido esperando que aclares de qué franquicia hablás
  if (state.awaitingClarifyFranchise) {
    const franchiseKey = matchFranchise(text);
    if (franchiseKey) {
      state.awaitingClarifyFranchise = false;
      state.lastFranchise = franchiseKey;
      return { text: `aaah ok, ¿de qué quieres hablar sobre ${FRANCHISE_DISPLAY[franchiseKey]}?`, expression: 'talking' };
    }
    // si no mencionó ninguna franquicia conocida, seguimos esperando y dejamos
    // que el mensaje se procese normalmente más abajo
  }

  // Verity y ThatMob son parte de la historia de Error 404, no de Wikipedia
  if (/verity|thatmob/.test(text)) return null;
  // "qué significa el 404" lo contesta Error 404 con su propia historia
  if (/404/.test(text) && /(que|significa|quiere decir)/.test(text)) return null;

  // "me gusta el anime/juego de X" -> guarda el interés, no necesita web
  const likeMatch = text.match(/me gusta (?:el anime de |la serie de |el juego de |el manga de )?(pokemon|pokémon|naruto|dragon ball|dbz|one piece|attack on titan|shingeki no kyojin|jojo|jojo's bizarre adventure|hellsing|mob psycho 100|mob psycho)/i);
  if (likeMatch) {
    return { text: `genial, ${likeMatch[1]} está bueno. después preguntame cuál es mi favorito de ahí.`, expression: 'happy' };
  }

  // pregunta de seguimiento: en qué parte/capítulo/episodio aparece
  if (/en que parte|en qué parte|en que capitulo|en qué capítulo|que capitulo|qué capítulo|en que episodio|en qué episodio|donde aparece|dónde aparece|cuando aparece|cuándo aparece/.test(text)) {
    if (!navigator.onLine) {
      return { text: 'necesitaría internet para revisar eso, y ahora mismo no tengo conexión.', expression: 'confused' };
    }
    return appearanceFollowUp(state);
  }

  const wantsStand = /stand favorito/.test(text);
  const wantsFavorite = wantsStand || /cual es tu .*favorit|cuál es tu .*favorit|tu personaje favorito/.test(text);
  // acceso general a Wikipedia: no solo "quién es X", también "qué es X",
  // "sabes sobre X", "contame sobre X", etc. — para cualquier tema, no solo franquicias
  const lookupMatch = text.match(/(?:quien es|quién es|hablame de|háblame de|que es|qué es|sabes (?:algo )?sobre|sabes que es|sabes qué es|cuentame sobre|cuéntame sobre|dime sobre|explicame que es|explícame qué es)\s+(.+)/i);

  // nombre suelto de un personaje o Stand conocido ("goku", "killer queen")
  const bare = text.replace(/[^a-záéíóúñü' ]/g, '').trim();
  const bareStand = bare.split(/\s+/).length <= 3 ? findStandByName(bare) : null;
  const bareKnown = bare.split(/\s+/).length <= 2 ? KNOWN_NAMES[bare.split(/\s+/)[0]] : null;

  if (bareStand && bare.length <= bareStand.length + 12) {
    const st = JOJO_STANDS[bareStand];
    const en = siteLang() === 'en';
    state.lastFavorite = { name: bareStand, curated: true, part: st.part, extract: en ? st.en : st.es, url: null };
    return { text: `${bareStand}: ${en ? st.en : st.es}`, expression: 'jojo' };
  }
  if (bareKnown) {
    if (!navigator.onLine) {
      return { text: 'necesitaría internet para buscar eso, y ahora mismo no tengo conexión.', expression: 'confused' };
    }
    const summary = await fetchWikiSummary(bareKnown[1]);
    if (summary && FRANCHISE_KEYWORDS[bareKnown[0]].test(summary.title + ' ' + summary.extract)) {
      state.lastFavorite = { name: summary.title, url: summary.url, extract: summary.extract };
      return { text: shorten(summary.extract, 3), expression: bareKnown[0] === 'jojo' ? 'jojo' : 'talking' };
    }
    return { text: `busqué sobre "${bareKnown[1]}" pero no encontré nada claro.`, expression: 'confused' };
  }

  // "quién es tu creador", "qué es eso": no son búsquedas en Wikipedia
  if (lookupMatch && /^(tu|tus|su|mi|mis|eso|esto|esa|ese|lo que|vos|usted)\b/.test(lookupMatch[1].trim())) return null;

  if (!wantsFavorite && !lookupMatch) return null; // no es un pedido de búsqueda

  if (!navigator.onLine && !wantsStand) {
    return { text: 'necesitaría internet para buscar eso, y ahora mismo no tengo conexión.', expression: 'confused' };
  }

  if (wantsFavorite) {
    const franchiseKey = matchFranchise(text);
    if (!franchiseKey) {
      return { text: 'no conozco tanto esa franquicia todavía como para tener un favorito. contame más sobre ella?', expression: 'confused' };
    }
    if (wantsStand && !FRANCHISE_STANDS[franchiseKey]) {
      return { text: 'esa franquicia no tiene stands, creo que estás mezclando cosas.', expression: 'confused' };
    }
    const result = await petFavoriteOf(franchiseKey, wantsStand ? 'stand' : 'character', state);
    return result || { text: 'no conozco tanto esa franquicia todavía como para tener un favorito.', expression: 'confused' };
  }

  const topic = lookupMatch[1].trim();
  const standHit = findStandByName(topic);
  if (standHit) {
    const st = JOJO_STANDS[standHit];
    const en = siteLang() === 'en';
    state.lastFavorite = { name: standHit, curated: true, part: st.part, extract: en ? st.en : st.es, url: null };
    return { text: `${standHit}: ${en ? st.en : st.es}`, expression: 'jojo' };
  }
  const summary = await fetchWikiSummary(topic);
  if (!summary) {
    return { text: `busqué sobre "${topic}" pero no encontré nada claro.`, expression: 'confused' };
  }
  state.lastFavorite = { name: summary.title, url: summary.url, extract: summary.extract };
  return { text: shorten(summary.extract, 3), expression: 'talking' };
}
