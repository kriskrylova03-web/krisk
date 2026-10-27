'use strict';
(() => {
  const cfg = window.AGENT_CARD;
  if (!cfg) return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = path => window.AGENT_CARD_ASSETS?.[path] || path;
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const contactDialog = $('#contact-dialog');
  const caseDialog = $('#case-dialog');
  let toastTimer;
  let activeTopic = '';

  document.title = `${cfg.name} — ваш агент по недвижимости | SRG`;
  $('meta[name="description"]').content = `${cfg.name} — ${cfg.role}. Продажа, покупка, аренда, новостройки и сопровождение сделки. ${cfg.city}.`;
  $$('[data-agent-name]').forEach(el => el.textContent = cfg.name);
  $$('[data-agent-role]').forEach(el => el.textContent = cfg.role);
  $$('[data-agent-city]').forEach(el => el.textContent = cfg.city);
  $$('[data-agent-phone]').forEach(el => el.textContent = cfg.phoneLabel);
  $$('[data-call]').forEach(el => el.href = 'tel:' + cfg.phone);
  $$('[data-agent-portrait]').forEach(el => {el.src = asset(cfg.portrait); el.alt = `${cfg.name}, агент по недвижимости`;});
  $('[data-agent-intro]').textContent = cfg.intro;
  $('[data-agent-about]').textContent = cfg.about;
  $$('[data-social]').forEach(el => el.href = cfg.socials[el.dataset.social]);
  $$('[data-demo-note]').forEach(el => el.hidden = !cfg.demoContacts);

  $('#agent-facts').innerHTML = cfg.facts.map(f => `<div class="fact"><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></div>`).join('');
  $('#specialty-grid').innerHTML = cfg.specialties.map((s,i) => `<article class="specialty-card"><img src="${asset('assets/images/'+s.icon+'-blue.png')}" alt="" width="43" height="43" loading="lazy"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><button class="text-action" type="button" data-specialty="${i}">Обсудить задачу${icon('arrow')}</button></article>`).join('');
  $('#case-grid').innerHTML = cfg.cases.map((c,i) => `<article class="case-card"><div class="case-visual"><span class="case-tag">${esc(c.tag)}</span><img src="${asset('assets/images/'+c.icon+'-blue.png')}" alt="" width="53" height="53" loading="lazy"><div class="case-metric"><strong>${esc(c.metric)}</strong><span>${esc(c.metricLabel)}</span></div></div><div class="case-copy"><p class="case-location">${esc(c.location)}</p><h3>${esc(c.title)}</h3><p>${esc(c.teaser)}</p><button class="text-action" type="button" data-case="${i}" aria-label="Открыть кейс: ${esc(c.title)}">Смотреть кейс${icon('arrow')}</button></div></article>`).join('');
  $('#review-track').innerHTML = cfg.reviews.map(r => `<article class="review-card"><div class="stars" aria-label="Оценка 5 из 5">${Array.from({length:5},()=>icon('star')).join('')}</div><blockquote>«${esc(r.text)}»</blockquote><div class="review-author"><span class="review-avatar" aria-hidden="true">${esc(r.initials)}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.detail)}</small></div></div></article>`).join('');

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => $('#toast').hidden = true, 3600);
  }
  function updateDialogState() {
    document.body.classList.toggle('dialog-open', $$('dialog').some(d => d.open));
  }
  function showContact(topic = '') {
    activeTopic = topic;
    $('#contact-context').textContent = topic || 'Расскажите о своей задаче — начнём с разговора.';
    if (caseDialog.open) caseDialog.close();
    if (!contactDialog.open) contactDialog.showModal();
    updateDialogState();
  }
  function showCase(index) {
    const c = cfg.cases[index];
    if (!c) return;
    $('#case-dialog-content').innerHTML = `<span class="case-tag">${esc(c.tag)}</span><h2 id="case-dialog-title">${esc(c.title)}</h2><p class="case-dialog-location">${esc(c.location)}</p><div class="case-detail"><h3>Задача</h3><p>${esc(c.task)}</p></div><div class="case-detail"><h3>Что сделали</h3><p>${esc(c.solution)}</p></div><div class="case-detail case-result"><h3>Результат</h3><p>${esc(c.result)}</p></div>`;
    $('#case-contact').dataset.topic = `Хочу обсудить похожую задачу: ${c.tag.toLowerCase()}`;
    caseDialog.showModal();
    updateDialogState();
  }
  function downloadContact() {
    const vEscape = v => String(v || '').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
    const lines = ['BEGIN:VCARD','VERSION:3.0',`N:${vEscape(cfg.lastName)};${vEscape(cfg.firstName)};;;`,`FN:${vEscape(cfg.name)}`,'ORG:SRG Недвижимость',`TITLE:${vEscape(cfg.role)}`,`TEL;TYPE=CELL:${cfg.phone}`,`NOTE:${vEscape(cfg.city)}`];
    if (!cfg.demoContacts) Object.values(cfg.socials).forEach(url => {if (url) lines.push('URL:' + url);});
    lines.push('END:VCARD');
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'], {type:'text/vcard;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = cfg.name.trim().replace(/\s+/g,'_') + '_SRG.vcf';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),30000);
    toast('Контакт подготовлен для сохранения');
  }
  async function copyPhone() {
    let copied = false;
    try {if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(cfg.phoneLabel);copied=true;}} catch (_) {}
    if (!copied) {
      const input = document.createElement('textarea');input.value=cfg.phoneLabel;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';
      const parent=contactDialog.open?contactDialog:document.body;parent.append(input);input.select();
      try {copied=document.execCommand('copy');} catch (_) {} input.remove();
    }
    toast(copied?'Номер телефона скопирован':'Выделите и скопируйте номер телефона');
  }
  const menuToggle=$('.menu-toggle');
  function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Открыть меню');$('#main-nav').classList.remove('is-open');}
  menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!open));menuToggle.setAttribute('aria-label',open?'Открыть меню':'Закрыть меню');$('#main-nav').classList.toggle('is-open',!open);});
  document.addEventListener('click',event=>{
    const specialty=event.target.closest('[data-specialty]');
    if(specialty){showContact(cfg.specialties[Number(specialty.dataset.specialty)].topic);return;}
    const caseButton=event.target.closest('[data-case]');
    if(caseButton){showCase(Number(caseButton.dataset.case));return;}
    if(event.target.closest('[data-contact]')){closeMenu();showContact();return;}
    if(event.target.closest('#case-contact')){showContact($('#case-contact').dataset.topic);return;}
    if(event.target.closest('[data-save-contact]')){downloadContact();return;}
    if(event.target.closest('[data-copy-phone]')){copyPhone();return;}
    if(event.target.closest('[data-close-dialog]')){event.target.closest('dialog').close();return;}
    const call=event.target.closest('[data-call]');
    if(call && cfg.demoContacts){event.preventDefault();showContact(activeTopic);return;}
    const social=event.target.closest('[data-social]');
    if(social && cfg.demoContacts){event.preventDefault();if(!contactDialog.open)showContact();toast('В шаблоне показаны примеры контактов агента');return;}
    if(event.target.closest('#main-nav a'))closeMenu();
    if(!event.target.closest('#main-nav,.menu-toggle'))closeMenu();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('close',updateDialogState);
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  });
  const track=$('#review-track');
  function updateReviews(){const cards=[...track.children];const index=cards.reduce((best,card,i)=>Math.abs(card.offsetLeft-track.firstElementChild.offsetLeft-track.scrollLeft)<Math.abs(cards[best].offsetLeft-track.firstElementChild.offsetLeft-track.scrollLeft)?i:best,0);$('#review-counter').textContent=`${index+1} / ${cards.length}`;$('[data-review-prev]').disabled=track.scrollLeft<=2;$('[data-review-next]').disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;}
  function moveReview(direction){const first=track.firstElementChild;if(!first)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;track.scrollBy({left:direction*(first.getBoundingClientRect().width+14),behavior:reduced?'instant':'smooth'});}
  $('[data-review-prev]').addEventListener('click',()=>moveReview(-1));
  $('[data-review-next]').addEventListener('click',()=>moveReview(1));
  track.addEventListener('scroll',updateReviews,{passive:true});
  track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();moveReview(event.key==='ArrowRight'?1:-1);}});
  window.addEventListener('resize',()=>{if(window.innerWidth>700)closeMenu();updateReviews();});
  updateReviews();
})();
