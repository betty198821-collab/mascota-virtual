const MEMORY_MAX_MESSAGES = 500;

function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : ''));
}

// elige una variante evitando repetir la misma dos veces seguidas
function pickNoRepeat(list, state, key) {
  state.lastPick = state.lastPick || {};
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === state.lastPick[key]) i = (i + 1) % list.length;
  state.lastPick[key] = i;
  return list[i];
}

// ---------- 1. guardar mensajes ----------
// text = lo que entiende el cerebro (en modo inglés, la versión traducida al español);
// original = lo que la persona escribió de verdad (solo se pasa en modo inglés, para
// poder citarlo tal cual en el resumen y en los recuerdos)
function rememberUserMessage(state, text, original) {
  state.history = state.history || [];
  const entry = { text: text.slice(0, 500), at: Date.now() };
  if (original && original !== text) entry.orig = original.slice(0, 500);
  state.history.push(entry);
  if (state.history.length > MEMORY_MAX_MESSAGES) state.history.shift();
  state.msgSeq = (state.msgSeq || 0) + 1;
}

// ---------- 2. anotar temas serios ----------
function shownText(entry) { return (entry && (entry.orig || entry.text)) || ''; }

function markSerious(state, id, snippet) {
  if (snippet && state.rawCurrent) snippet = state.rawCurrent.trim().slice(0, 60); // modo inglés: citar lo que escribió
  const label = (typeof TOPIC_LABELS !== 'undefined' && TOPIC_LABELS[id]) ? TOPIC_LABELS[id].es : 'eso que me contaste';
  state.serious = { id, label, snippet: snippet || null, seq: state.msgSeq || 0, shifted: false };
  state.jojoMode = false; // un tema serio apaga cualquier modo que estuviera activo
  state.topicLog = state.topicLog || [];
  state.topicLog.push({ id, label, snippet: snippet || null, at: Date.now() });
  if (state.topicLog.length > 30) state.topicLog.shift();
}

// cuando cambiás de tema de golpe después de algo serio
const ABRUPT_SHIFT_LINES = [
  { es: `eh... espera. hace un momento me hablabas de {tema} y de golpe saltás a otra cosa. no puedo preocuparme por vos y cambiar de tema así, tan de la nada. ¿querés que sigamos con lo de antes?`,
    en: `uh... wait. a moment ago you were telling me about {tema} and suddenly you jump to something else. I can't worry about you and change the subject like that, out of nowhere. do you want to continue with what we were saying?` },
  { es: `uh... me dejaste fuera de lugar. estábamos con {tema}, algo serio, y de repente esto. no puedo cambiar tan rápido. ¿volvemos a lo anterior?`,
    en: `uh... you threw me off. we were on {tema}, something serious, and suddenly this. I can't switch that fast. shall we go back to what we were saying?` },
  { es: `perdón, pero no puedo dar ese salto así nomás. hace un momento hablábamos de {tema}. dame un segundo... ¿seguimos con eso?`,
    en: `sorry, but I can't make that jump just like that. a moment ago we were talking about {tema}. give me a second... shall we continue with that?` },
  { es: `n-no... no puedo preocuparme por vos en un momento y cambiar de tema tan de la nada al siguiente. me hablabas de {tema}. ¿cómo estás con eso?`,
    en: `n-no... I can't worry about you one moment and change the subject out of nowhere the next. you were telling me about {tema}. how are you with that?` },
  { es: `espera, espera... venías contándome sobre {tema} y ahora esto. me cuesta cambiar así de golpe. ¿querés volver a lo de antes?`,
    en: `wait, wait... you were telling me about {tema} and now this. it's hard for me to switch so suddenly. do you want to go back to what we were saying?` },
  { es: `eso me descolocó. hace nada estábamos en {tema}, algo importante. no quiero fingir que no pasó. ¿seguimos con eso?`,
    en: `that threw me off. just now we were on {tema}, something important. I don't want to pretend it didn't happen. shall we continue with that?` },
  { es: `ey, no puedo pasar de algo serio como {tema} a esto tan de repente. ¿preferís que sigamos con lo de antes?`,
    en: `hey, I can't go from something serious like {tema} to this so suddenly. would you rather we continue with what we were saying?` },
  { es: `mm... no te sigo el cambio. estábamos hablando de {tema} y me pareció importante. ¿necesitás cambiar de tema, o querés retomarlo?`,
    en: `mm... I can't follow the change. we were talking about {tema} and it seemed important to me. do you need to change the subject, or do you want to pick it back up?` },
  { es: `uf, qué salto. yo me quedé en {tema}, todavía. ¿podemos volver ahí un momento antes de seguir con otra cosa?`,
    en: `whoa, what a jump. I'm still on {tema}. can we go back there for a moment before moving on to something else?` },
  { es: `perdoname, pero no logro cambiar de tema tan de golpe después de lo que me contaste sobre {tema}. ¿cómo estás realmente?`,
    en: `forgive me, but I can't change the subject so suddenly after what you told me about {tema}. how are you really?` },
  { es: `me parece raro que cambies así de tema, tan de la nada, justo después de hablar de {tema}. si querés distraerte, está bien, pero avisame. ¿estás bien?`,
    en: `it feels strange that you change the subject like that, out of nowhere, right after talking about {tema}. if you want a distraction, that's okay, but let me know. are you okay?` },
  { es: `eh... eso no venía a cuento. me estabas hablando de {tema}. no puedo preocuparme por vos y saltar a esto así nomás. ¿seguimos con lo de antes?`,
    en: `uh... that came out of nowhere. you were telling me about {tema}. I can't worry about you and jump to this just like that. shall we continue with what we were saying?` },
];

// si después del aviso de cambio brusco, dices que no quierés volver a eso
const SHIFT_RELEASE_LINES = [
  { es: `está bien. no te voy a obligar a volver a eso. seguimos con lo que vos quieras, pero si más tarde necesitás retomarlo, acá estoy.`,
    en: `that's okay. I won't force you to go back to it. we'll continue with whatever you want, but if you need to pick it up later, I'm here.` },
  { es: `entiendo. cambiemos de tema, entonces, a tu ritmo. lo de antes queda guardado por si querés volver.`,
    en: `I understand. let's change the subject, then, at your pace. what we said before stays saved in case you want to go back.` },
  { es: `de acuerdo, sin presión. seguimos con otra cosa. y si más tarde querés hablar de lo anterior, no lo olvido.`,
    en: `alright, no pressure. we'll move on to something else. and if you want to talk about the earlier thing later, I won't forget it.` },
];

//Las 48 variantes para volver a un tema serio.
const RECALL_LINES = [
  { es: `hace un rato me estabas contando sobre {tema}. no me olvidé. ¿querés seguir por ahí, con calma?`, en: `a while ago you were telling me about {tema}. I haven't forgotten. do you want to continue from there, calmly?` },
  { es: `estábamos hablando de {tema}, y me quedé pensando en eso. si querés, retomamos sin apuro.`, en: `we were talking about {tema}, and I kept thinking about it. if you want, we can pick it back up with no rush.` },
  { es: `todavía tengo presente lo que me contaste sobre {tema}. no tenemos que hablar de eso si no querés, pero acá sigo.`, en: `I still have in mind what you told me about {tema}. we don't have to talk about it if you don't want to, but I'm still here.` },
  { es: `volviendo a lo de antes... me hablabas de {tema}. ¿cómo te sentís ahora con eso?`, en: `going back to what we said... you were telling me about {tema}. how do you feel about it now?` },
  { es: `no me olvidé de que veníamos hablando de {tema}. ¿querés contarme un poco más, o preferís ir más despacio?`, en: `I haven't forgotten we were talking about {tema}. do you want to tell me a bit more, or would you rather go slower?` },
  { es: `recuerdo que me hablabas de {tema}. fue importante para mí que me lo contaras. ¿seguimos?`, en: `I remember you were telling me about {tema}. it mattered to me that you told me. shall we continue?` },
  { es: `hace un rato tocamos el tema de {tema}. si necesitás volver a eso, estoy.`, en: `a while ago we touched on {tema}. if you need to go back to that, I'm here.` },
  { es: `me quedé con lo que me dijiste sobre {tema}... ¿querés que sigamos hablando de eso, o necesitás un respiro?`, en: `I stayed with what you told me about {tema}... do you want us to keep talking about it, or do you need a breather?` },
  { es: `estábamos en {tema}, ¿no? por mí podemos retomarlo cuando te sientas listo/a.`, en: `we were on {tema}, weren't we? we can pick it back up whenever you feel ready.` },
  { es: `te escuché cuando me hablaste de {tema}, y sigo acá. ¿cómo venís desde entonces?`, en: `I heard you when you talked to me about {tema}, and I'm still here. how have you been since then?` },
  { es: `lo último serio que hablamos fue sobre {tema}. ¿querés volver a eso?`, en: `the last serious thing we talked about was {tema}. do you want to go back to it?` },
  { es: `sé que me hablabas de {tema}. no es un tema que se deje de lado así nomás. ¿cómo estás con eso?`, en: `I know you were telling me about {tema}. it's not a subject that gets set aside just like that. how are you with it?` },
  { es: `no perdí el hilo: hablábamos de {tema}. cuando quieras, seguimos, sin presión.`, en: `I didn't lose the thread: we were talking about {tema}. whenever you want, we continue, no pressure.` },
  { es: `me acuerdo de lo que me contaste sobre {tema}, y me importa. ¿hay algo más que quieras agregar?`, en: `I remember what you told me about {tema}, and it matters to me. is there anything else you'd like to add?` },
  { es: `antes me hablabas de {tema}. ¿te ayudó contarlo, o todavía pesa?`, en: `earlier you were telling me about {tema}. did it help to tell it, or does it still weigh on you?` },
  { es: `seguimos donde lo dejamos, si querés: me estabas hablando de {tema}.`, en: `we can continue where we left off, if you want: you were telling me about {tema}.` },
  { es: `tengo guardado lo que charlamos sobre {tema}. ¿querés que lo retomemos con cuidado?`, en: `I have saved what we talked about regarding {tema}. do you want us to pick it back up carefully?` },
  { es: `hace poco me abriste algo sobre {tema}. gracias por la confianza. ¿querés continuar?`, en: `not long ago you opened up to me about {tema}. thank you for the trust. do you want to continue?` },
  { es: `estuvimos hablando de {tema}, y no quiero que quede a medias. ¿cómo te sentís ahora?`, en: `we were talking about {tema}, and I don't want it left half-finished. how do you feel now?` },
  { es: `no me olvidé de lo de {tema}. podemos ir a tu ritmo, sin apurar nada.`, en: `I haven't forgotten about {tema}. we can go at your pace, without rushing anything.` },
  { es: `si querés volver a lo de {tema}, acá me tenés. y si no, también está bien.`, en: `if you want to go back to {tema}, I'm here. and if not, that's okay too.` },
  { es: `me quedé pensando en {tema}, en lo que me contaste. ¿cómo te fue desde entonces?`, en: `I kept thinking about {tema}, about what you told me. how have things gone since then?` },
  { es: `veníamos hablando de {tema}. ¿querés que sigamos, o preferís que te acompañe en silencio un ratito?`, en: `we had been talking about {tema}. do you want us to continue, or would you rather I keep you company in silence for a bit?` },
  { es: `lo que me contaste sobre {tema} sigue en mi cabeza. ¿hay algo que quisieras decir y no pudiste?`, en: `what you told me about {tema} is still on my mind. is there something you wanted to say and couldn't?` },
  { es: `hace un rato hablamos de {tema}. no te voy a presionar, pero si querés seguir, te escucho.`, en: `a while ago we talked about {tema}. I won't pressure you, but if you want to continue, I'm listening.` },
  { es: `recuerdo bien que me hablabas de {tema}. ¿necesitás que lo conversemos mejor?`, en: `I remember well that you were telling me about {tema}. do you need us to talk it through better?` },
  { es: `me importa lo que dijimos sobre {tema}. ¿te sentís un poco mejor, o igual que antes?`, en: `what we said about {tema} matters to me. do you feel a little better, or the same as before?` },
  { es: `todavía estoy en lo de {tema}, aunque haya pasado un rato. ¿seguimos?`, en: `I'm still on {tema}, even though some time has passed. shall we continue?` },
  { es: `esto que me contaste de {tema} no es poca cosa. cuando quieras, lo retomamos.`, en: `what you told me about {tema} is no small thing. whenever you want, we pick it back up.` },
  { es: `estábamos con {tema}. no hace falta que lo resuelvas hoy, pero podemos mirarlo juntos de nuevo.`, en: `we were on {tema}. you don't have to solve it today, but we can look at it together again.` },
  { es: `no dejé de pensar en lo de {tema}. ¿te parece si volvemos con calma?`, en: `I haven't stopped thinking about {tema}. would it be okay if we go back to it calmly?` },
  { es: `hace un rato me contabas sobre {tema}, ¿te acordás? yo sí. ¿cómo estás con eso?`, en: `a while ago you were telling me about {tema}, remember? I do. how are you with it?` },
  { es: `puedo retomar lo de {tema} cuando quieras. nada de apuro.`, en: `I can pick up {tema} whenever you want. no hurry at all.` },
  { es: `lo de {tema} sigue importando, aunque hayamos hablado de otras cosas. ¿querés volver?`, en: `{tema} still matters, even though we've talked about other things. do you want to go back?` },
  { es: `tengo presente que me hablabas de {tema}. ¿hay algo que te gustaría que yo hiciera distinto para acompañarte?`, en: `I keep in mind that you were telling me about {tema}. is there anything you'd like me to do differently to be there for you?` },
  { es: `antes charlamos sobre {tema}. gracias por habérmelo dicho. ¿cómo seguís?`, en: `earlier we chatted about {tema}. thank you for telling me. how are you doing?` },
  { es: `Oye sobre tu problema, tu {tema}, estas seguro que no quieres volver a hablar de eso? no quiero ser insistente pero bueno, trato de estar pendiente contigo, me importas ¿sabes?` },
  { es: `me dijiste "{frase}", y no se me va. hablábamos de {tema}. ¿querés seguir con eso?`, en: `you told me "{frase}", and it stays with me. we were talking about {tema}. do you want to continue with that?` },
  { es: `hace un rato me dijiste "{frase}". lo tengo presente. ¿cómo estás ahora?`, en: `a while ago you told me "{frase}". I keep it in mind. how are you now?` },
  { es: `recuerdo tus palabras: "{frase}". me importaron mucho. ¿querés que sigamos hablando de {tema}?`, en: `I remember your words: "{frase}". they mattered to me. do you want us to keep talking about {tema}?` },
  { es: `cuando me escribiste "{frase}", me quedé pensando. ¿querés retomar eso con calma?`, en: `when you wrote "{frase}" to me, I kept thinking. do you want to pick that back up calmly?` },
  { es: `"{frase}"... eso me contaste hace un rato. no lo dejé pasar. ¿cómo venís con eso?`, en: `"{frase}"... that's what you told me a while ago. I didn't let it slip by. how are you doing with it?` },
  { es: `todavía me acuerdo de que me dijiste "{frase}". estoy acá si querés profundizar.`, en: `I still remember that you told me "{frase}". I'm here if you want to go deeper.` },
  { es: `me hablabas de {tema} y me dijiste "{frase}". ¿hay algo que quisieras agregar?`, en: `you were telling me about {tema} and you said "{frase}". is there anything you'd like to add?` },
  { es: `tus palabras fueron "{frase}", y no quiero tomarlas a la ligera. ¿querés seguir hablando de eso?`, en: `your words were "{frase}", and I don't want to take them lightly. do you want to keep talking about it?` },
  { es: `no olvidé que dijiste "{frase}". ¿te parece si lo miramos juntos, de a poco?`, en: `I didn't forget that you said "{frase}". would it be okay to look at it together, little by little?` },
  { es: `hace un rato escribiste "{frase}" y me quedé con eso. sigo acá para escucharte.`, en: `a while ago you wrote "{frase}" and I stayed with that. I'm still here to listen to you.` },
  { es: `recuerdo que dijiste "{frase}" cuando hablábamos de {tema}. ¿cómo te sentís ahora con eso?`, en: `I remember you said "{frase}" when we were talking about {tema}. how do you feel about it now?` },
  { es: `me quedó grabado "{frase}". si querés retomarlo, te escucho con toda la calma.`, en: `"{frase}" stuck with me. if you want to pick it back up, I'll listen with all the calm.` },
];

// si no hay un tema serio guardado, pero sí mensajes anteriores
const RECALL_GENERIC_LINES = [
  { es: `hace un rato me dijiste "{frase}". ¿querés que sigamos con eso?`, en: `a while ago you told me "{frase}". do you want us to continue with that?` },
  { es: `lo último que recuerdo de antes es que me dijiste "{frase}". ¿querés retomarlo?`, en: `the last thing I remember from before is that you told me "{frase}". do you want to pick it back up?` },
  { es: `me acuerdo de que me escribiste "{frase}". ¿hay algo más sobre eso que quieras contarme?`, en: `I remember you wrote "{frase}" to me. is there more about that you want to tell me?` },
  { es: `tengo guardado que dijiste "{frase}". ¿seguimos por ahí?`, en: `I have saved that you said "{frase}". shall we continue from there?` },
  { es: `antes me contaste "{frase}". si querés volver a eso, acá estoy.`, en: `earlier you told me "{frase}". if you want to go back to that, I'm here.` },
];
const RECALL_NONE_LINES = [
  { es: `todavía no me contaste nada importante... ¿querés empezar ahora? te escucho.`, en: `you haven't told me anything important yet... do you want to start now? I'm listening.` },
  { es: `no tengo guardado nada serio de antes. si querés contarme algo, acá estoy.`, en: `I don't have anything serious saved from before. if you want to tell me something, I'm here.` },
  { es: `no recuerdo que hayamos hablado de algo así todavía. ¿querés que empecemos?`, en: `I don't remember us talking about something like that yet. do you want us to start?` },
];

const RECALL_LAST_LINES = [
  { es: `lo último que me dijiste fue: "{frase}".`, en: `the last thing you told me was: "{frase}".` },
  { es: `me dijiste "{frase}", justo antes de esto.`, en: `you told me "{frase}", right before this.` },
  { es: `lo último que recuerdo es "{frase}".`, en: `the last thing I remember is "{frase}".` },
];
const RECALL_LAST_NONE_LINES = [
  { es: `todavía no me dijiste nada antes de esto.`, en: `you haven't told me anything before this yet.` },
  { es: `no tengo nada anterior guardado, esto es lo primero que me decís.`, en: `I have nothing earlier saved, this is the first thing you tell me.` },
];
const RECALL_FIRST_LINES = [
  { es: `lo primero que me dijiste fue: "{frase}".`, en: `the first thing you told me was: "{frase}".` },
  { es: `al principio me escribiste "{frase}".`, en: `at the beginning you wrote "{frase}" to me.` },
  { es: `lo primero que recuerdo de vos es "{frase}".`, en: `the first thing I remember from you is "{frase}".` },
];
const SEARCH_FOUND_LINES = [
  { es: `sobre "{palabra}" me dijiste: "{frase}".`, en: `about "{palabra}" you told me: "{frase}".` },
  { es: `lo recuerdo: cuando hablaste de "{palabra}" me escribiste "{frase}".`, en: `I remember it: when you talked about "{palabra}" you wrote "{frase}".` },
  { es: `acerca de "{palabra}", lo que tengo guardado es: "{frase}".`, en: `about "{palabra}", what I have saved is: "{frase}".` },
  { es: `me acuerdo de "{palabra}": dijiste "{frase}".`, en: `I remember "{palabra}": you said "{frase}".` },
];
const SEARCH_NONE_LINES = [
  { es: `no recuerdo que me hayas dicho algo sobre "{palabra}". ¿me lo contás?`, en: `I don't remember you telling me anything about "{palabra}". will you tell me?` },
  { es: `sobre "{palabra}" no tengo nada guardado. ¿querés contarme?`, en: `I have nothing saved about "{palabra}". do you want to tell me?` },
  { es: `mm, "{palabra}" no aparece en lo que hablamos. ¿me explicás?`, en: `mm, "{palabra}" doesn't appear in what we've talked about. will you explain?` },
];



// ---------- guardian de los modos ----------
// Mientras hablan de algo serio, no se puede activar ningún modo (Verity, JoJo,
// el Stand, etc...). Para un modo nuevo que se agregue en el futuro, hara lo mismo donde se active:
//   if (isSeriousContextActive(state)) return modeBlockedReply(state, 'clave');
// y agregá su nombre en MODE_LABELS.
const MODE_LABELS = {
  verity: { es: 'el modo Verity', en: 'Verity mode' },
  jojo:   { es: 'el modo JoJo', en: 'JoJo mode' },
  stand:  { es: 'la animación de mi Stand', en: 'my Stand animation' },
  zip:    { es: 'el cierre en la boca', en: 'the zipper on my mouth' },
};

const MODE_BLOCKED_LINES = [
  { es: `ahora no. estamos hablando de algo importante y no voy a activar {modo} en medio de esto. si más tarde querés, lo vemos.`, en: `not now. we're talking about something important and I won't activate {modo} in the middle of this. if you want, later we'll see.` },
  { es: `eso lo dejamos para después. ahora me importa más cómo estás que activar {modo}.`, en: `we'll leave that for later. right now how you are matters more to me than activating {modo}.` },
  { es: `perdón, pero no es momento de activar {modo}. primero terminemos de hablar de lo que me contaste.`, en: `sorry, but it's not the time to activate {modo}. first let's finish talking about what you told me.` },
  { es: `no quiero activar {modo} ahora: me parece que lo que estás viviendo es más importante. cuando te sientas mejor, lo hacemos.`, en: `I don't want to activate {modo} now: what you're going through seems more important. when you feel better, we'll do it.` },
  { es: `mm, no. con lo que me estabas contando, activar {modo} no me parece apropiado. ¿seguimos con lo de antes?`, en: `mm, no. with what you were telling me, activating {modo} doesn't seem appropriate. shall we continue with what we were saying?` },
  { es: `ahora no, de verdad. {modo} puede esperar; vos no. ¿cómo estás?`, en: `not now, really. {modo} can wait; you can't. how are you?` },
  { es: `entiendo que quieras cambiar de aire, pero no voy a activar {modo} mientras hablamos de algo así de serio.`, en: `I understand you want a change of air, but I won't activate {modo} while we're talking about something this serious.` },
  { es: `no voy a activar {modo} ahora. primero lo importante: lo que me contaste. ¿querés seguir con eso?`, en: `I won't activate {modo} now. first what matters: what you told me. do you want to continue with that?` },
];

// ¿están hablando de algo serio ahora mismo? (los temas de crisis duran más)
function isSeriousContextActive(state) {
  const s = state.serious;
  if (!s) return false;
  if (state.awaitingSafety || state.awaitingAdvice || state.awaitingContinue || state.awaitingReturn) return true;
  const diff = (state.msgSeq || 0) - s.seq;
  return diff <= (s.id === 'crisis' ? 20 : 8);
}

function modeBlockedReply(state, modeKey) {
  const label = MODE_LABELS[modeKey] ? MODE_LABELS[modeKey].es : modeKey;
  const line = pickNoRepeat(MODE_BLOCKED_LINES, state, 'modeblocked');
  return { text: fillTemplate(line.es, { modo: label }), expression: 'neutral' };
}

// cuando contestás "sí" a "¿querés seguir hablando de eso?"
const CONTINUE_LINES = [
  { es: `entonces contame, te escucho con calma. ¿qué es lo que más pesa ahora? y si en algún momento querés que te cuente cosas que le han servido a otras personas, decime "sí".`, en: `then tell me, I'm listening calmly. what weighs on you the most now? and if at some point you want me to tell you things that have helped other people, say "yes".` },
  { es: `gracias por querer seguir. empezá por donde te sea más fácil, sin apuro. yo te escucho, y cuando quieras puedo contarte algunas ideas que ayudan. ¿querés?`, en: `thank you for wanting to continue. start wherever is easiest for you, no rush. I'm listening, and whenever you want I can tell you some ideas that help. do you want that?` },
  { es: `acá estoy. ¿cómo te sentís hoy con eso que me contaste? no hace falta que ordenes las palabras. y si preferís ideas para sentirte mejor, decime "sí".`, en: `I'm here. how do you feel today about what you told me? you don't have to put the words in order. and if you'd rather have ideas to feel better, say "yes".` },
  { es: `bien. entonces seguimos con calma. ¿hay algo puntual que te esté pesando más que lo demás? puedo escucharte, y también contarte cosas que pueden ayudar, si querés.`, en: `good. then we continue calmly. is there something specific weighing on you more than the rest? I can listen, and also tell you things that can help, if you want.` },
  { es: `te escucho. contame lo que quieras de eso, a tu ritmo. y si en algún momento querés consejos, solo pedímelos.`, en: `I'm listening. tell me whatever you want about it, at your pace. and if at some point you want advice, just ask me.` },
  { es: `gracias por confiar de nuevo. ¿qué es lo que necesitás ahora: que te escuche, o que te cuente algunas ideas para sentirte mejor?`, en: `thank you for trusting again. what do you need now: for me to listen, or to tell you some ideas to feel better?` },
];

// ---------- 3. cambio brusco de tema ----------
// cosas "livianas" que, dichas de golpe después de algo serio, descolocan
function isLightTopic(text) {
  if (typeof tryMath === 'function' && tryMath(text)) return true;
  return /chocolate|comida favorita|color favorito|helado|pizza|pokemon|pokémon|naruto|dragon ball|one piece|jojo|\bstand\b|hellsing|mob psycho|anime|verity|thatmob|monstruo|tumblr|cu[aá]ntos a[nñ]os|como te llamas|cómo te llamás|(qu[eé]|qui[eé]n) es |hablame de|háblame de|cu[eé]ntame sobre|sabes sobre|mi .{0,25} favorit[oa] es|jaja|jeje|\bxd\b|\blol\b|eres lindo|sos lindo|videojuego|juego favorito|pel[ií]cula|f[uú]tbol/.test(text);
}

// señales de que sigue hablando del tema serio (no es un cambio brusco)
function continuesSeriousTopic(text) {
  if (typeof findEmotionalReply === 'function' && findEmotionalReply(text)) return true;
  return /triste|llor|solo\b|sola\b|ansied|miedo|deprim|dolor|cansad|mal\b|nadie|odio|fracas|culpa|no puedo|ayuda/.test(text);
}

function checkAbruptShift(text, state) {
  const s = state.serious;
  if (!s || s.shifted) return null;
  const diff = (state.msgSeq || 0) - s.seq; // mensajes desde el tema serio
  if (diff < 1 || diff > 3) return null;

  const t = text.toLowerCase();
  if (continuesSeriousTopic(t) || !isLightTopic(t)) return null;

  s.shifted = true;
  state.awaitingReturn = true;
  const line = pickNoRepeat(ABRUPT_SHIFT_LINES, state, 'shift');
  return { text: fillTemplate(line.es, { tema: s.label }), expression: 'confused' };
}

// ---------- 4. preguntas sobre lo que ya hablamos ----------
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function recallSeriousTopic(state) {
  const last = state.topicLog && state.topicLog[state.topicLog.length - 1];
  if (!last) return null;
  const usable = RECALL_LINES.filter(l => !l.es.includes('{frase}') || last.snippet);
  const line = pickNoRepeat(usable, state, 'recall');
  if (state.serious) { state.serious.seq = state.msgSeq || 0; state.serious.shifted = false; }
  state.awaitingContinue = true; // si contestás "sí", sigue con CONTINUE_LINES
  return { text: fillTemplate(line.es, { tema: last.label, frase: last.snippet || '' }), expression: 'worried' };
}

function handleMemoryQuestions(text, state) {
  const tn = stripAccents(text.toLowerCase()).trim();
  const hist = state.history || [];
  // los mensajes de antes, sin contar el que se está procesando ahora
  const earlier = hist.length && hist[hist.length - 1].text === text.slice(0, 500) ? hist.slice(0, -1) : hist;

  // después de "¿querés seguir hablando de eso?" (cuando retomó un tema serio)
  if (state.awaitingContinue) {
    state.awaitingContinue = false;
    if (/^(si|dale|claro|ok|bueno|vale|por favor|aja|quiero|yes)\b/.test(tn)) {
      state.awaitingAdvice = true;
      return { text: pickNoRepeat(CONTINUE_LINES, state, 'continue').es, expression: 'worried' };
    }
    if (/^(no|mejor no|otra cosa|nah|nop)\b/.test(tn)) {
      return { text: pickNoRepeat(SHIFT_RELEASE_LINES, state, 'release').es, expression: 'neutral' };
    }
  }

  // después de "¿querés volver a lo de antes?"
  if (state.awaitingReturn) {
    state.awaitingReturn = false;
    if (/^(si|dale|claro|ok|bueno|vale|volvamos|sigamos|por favor|aja)\b/.test(tn)) {
      const r = recallSeriousTopic(state);
      if (r) return r;
    }
    if (/^(no|mejor no|otra cosa|nah|nop)\b/.test(tn)) {
      return { text: pickNoRepeat(SHIFT_RELEASE_LINES, state, 'release').es, expression: 'neutral' };
    }
  }

  if (/lo ultimo que (te )?dije|ultima cosa que te dije|what was the last thing i (said|told)/.test(tn)) {
    if (!earlier.length) return { text: pickNoRepeat(RECALL_LAST_NONE_LINES, state, 'lastnone').es, expression: 'talking' };
    const line = pickNoRepeat(RECALL_LAST_LINES, state, 'last');
    return { text: fillTemplate(line.es, { frase: shownText(earlier[earlier.length - 1]) }), expression: 'talking' };
  }

  if (/lo primero que te dije|primera cosa que te dije|what was the first thing i (said|told)/.test(tn)) {
    if (!earlier.length) return { text: pickNoRepeat(RECALL_LAST_NONE_LINES, state, 'lastnone').es, expression: 'talking' };
    const line = pickNoRepeat(RECALL_FIRST_LINES, state, 'first');
    return { text: fillTemplate(line.es, { frase: shownText(earlier[0]) }), expression: 'talking' };
  }

  // "qué te dije de X" -> busca en todo lo que escribiste
  const search = tn.match(/(?:que|lo que) te (?:dije|conte) (?:de|sobre|acerca de) (.+)/) || tn.match(/lo que dije (?:de|sobre) (.+)/);
  if (search) {
    const word = search[1].replace(/[?!.¿¡"']/g, '').trim();
    if (word.length >= 2) {
      for (let i = earlier.length - 1; i >= 0; i--) {
        if (stripAccents(earlier[i].text.toLowerCase()).includes(word)) {
          const line = pickNoRepeat(SEARCH_FOUND_LINES, state, 'found');
          return { text: fillTemplate(line.es, { palabra: word, frase: shownText(earlier[i]) }), expression: 'talking' };
        }
      }
      const none = pickNoRepeat(SEARCH_NONE_LINES, state, 'searchnone');
      return { text: fillTemplate(none.es, { palabra: word }), expression: 'confused' };
    }
  }

  // "de qué hablábamos", "volvamos a lo de antes"
  if (/de que (estabamos|hablabamos|veniamos hablando)|volvamos a lo de antes|sigamos con lo de antes|retomemos|lo que te (conte|dije)|te acuerdas de lo que|recuerdas lo que te|what were we talking about|do you remember what i (told|said)/.test(tn)) {
    const r = recallSeriousTopic(state);
    if (r) return r;
    if (earlier.length) {
      const line = pickNoRepeat(RECALL_GENERIC_LINES, state, 'generic');
      return { text: fillTemplate(line.es, { frase: shownText(earlier[earlier.length - 1]) }), expression: 'talking' };
    }
    return { text: pickNoRepeat(RECALL_NONE_LINES, state, 'none').es, expression: 'talking' };
  }

  return null;
}

// para el traductor (translate.js los lee desde acá)
const MEMORY_TEMPLATE_LINES = [
  ...ABRUPT_SHIFT_LINES, ...RECALL_LINES, ...RECALL_GENERIC_LINES, ...RECALL_LAST_LINES,
  ...RECALL_FIRST_LINES, ...SEARCH_FOUND_LINES, ...SEARCH_NONE_LINES, ...MODE_BLOCKED_LINES,
];
const MEMORY_PLAIN_LINES = [...SHIFT_RELEASE_LINES, ...RECALL_NONE_LINES, ...RECALL_LAST_NONE_LINES, ...CONTINUE_LINES];
