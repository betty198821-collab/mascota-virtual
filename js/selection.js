// empieza a contar cuánto tiempo lleva abierta la pestaña (lo usa el chat)
if (!sessionStorage.getItem('siteOpenedAt')) sessionStorage.setItem('siteOpenedAt', String(Date.now()));

document.querySelectorAll('.pet-card[data-pet]').forEach(card => {
  const goToChat = () => {
    const pet = card.dataset.pet;
    localStorage.setItem('selectedPet', pet);
    window.location.href = 'chat.html';
  };

  card.querySelector('.select-btn').addEventListener('click', goToChat);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter') goToChat();
  });
});

// textos según el idioma elegido en Configuración (translate.js)
function applySelectionLang() {
  if (typeof getSiteLang !== 'function' || typeof UI_STRINGS === 'undefined') return;
  const lang = getSiteLang();
  const u = UI_STRINGS[lang];
  document.documentElement.lang = lang;

  const title = document.getElementById('selTitle');
  if (title) {
    // la última palabra lleva el efecto glitch
    const words = u.selectionTitle.split(' ');
    const last = words.pop();
    title.innerHTML = `${words.join(' ')} <span class="glitch-text" data-text="${last}">${last}</span>`;
  }
  const sub = document.getElementById('selSubtitle');
  if (sub) sub.textContent = u.selectionSubtitle;
  const menuLink = document.getElementById('menuLink');
  if (menuLink) menuLink.textContent = u.backToMenu;
  const soonDesc = document.getElementById('soonDesc');
  if (soonDesc) soonDesc.textContent = u.comingSoonDesc;
  const soonBtn = document.getElementById('soonBtn');
  if (soonBtn) soonBtn.textContent = u.comingSoon;

  const name = document.getElementById('mainPetName');
  const desc = document.getElementById('mainPetDesc');
  const btn = document.getElementById('mainPetBtn');
  const verity = typeof isVerityModeActive === 'function' && isVerityModeActive();

  if (verity) {
    // si el modo Verity está activo, la tarjeta principal se muestra como Verity
    const img = document.getElementById('mainPetImage');
    const fallback = document.getElementById('mainPetFallback');
    if (img) img.src = VERITY_INFO.face;
    if (fallback) fallback.textContent = 'V';
    if (name) name.textContent = VERITY_INFO.name;
    if (desc) desc.textContent = lang === 'en' ? VERITY_INFO.descriptionEn : VERITY_INFO.description;
    if (btn) btn.textContent = u.selectButton(VERITY_INFO.name);
  } else {
    if (desc) desc.textContent = u.petDesc404;
    if (btn) btn.textContent = u.selectButton('Error 404');
  }
}

applySelectionLang();
