'use strict';

(() => {
  // 10 de novembro de 2026, 00:00 no fuso de São Paulo (UTC-03:00).
  const releaseTime = new Date('2026-11-10T00:00:00-03:00').getTime();
  const $ = (selector) => document.querySelector(selector);
  const header = $('#header');
  const menuButton = $('#menuToggle');
  const mobileNav = $('#mobileNav');
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function updateCountdown() {
    const ms = Math.max(0, releaseTime - Date.now());
    const total = Math.floor(ms / 1000);
    const values = {
      cdDays: Math.floor(total / 86400),
      cdHours: Math.floor((total % 86400) / 3600),
      cdMins: Math.floor((total % 3600) / 60),
      cdSecs: total % 60,
    };
    Object.entries(values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value).padStart(2, '0');
    });
    const state = $('#countdownState');
    if (ms === 0) state.textContent = 'A DATA ANUNCIADA CHEGOU. ACOMPANHE AS NOVIDADES OFICIAIS.';
    else state.textContent = 'CONTAGEM REGRESSIVA ATIVA. MARQUE A DATA.';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Relógio simulado do visor. Não representa uma gravação real.
  const clockStart = performance.now();
  function updatePlayerClock() {
    const elapsed = Math.floor((performance.now() - clockStart) / 1000);
    const seconds = elapsed % 60;
    const minutes = Math.floor(elapsed / 60) % 60;
    const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    $('#playerClock').textContent = `${hh}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:00`;
  }
  updatePlayerClock();
  setInterval(updatePlayerClock, 1000);

  const visionToggle = $('#visionToggle');
  const visionPlayer = $('#visionPlayer');
  visionToggle.addEventListener('click', () => {
    const active = visionPlayer.classList.toggle('is-active');
    visionToggle.setAttribute('aria-pressed', String(active));
    $('#visionToggleText').textContent = active ? 'EFEITO BODYCAM: LIGADO' : 'EFEITO BODYCAM: DESLIGADO';
  });

  // Menu adaptado para telas menores.
  function closeMenu() {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
  }
  menuButton.addEventListener('click', () => {
    const isOpening = mobileNav.hidden;
    mobileNav.hidden = !isOpening;
    menuButton.setAttribute('aria-expanded', String(isOpening));
    menuButton.setAttribute('aria-label', isOpening ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', isOpening);
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) closeMenu(); });

  // Estado da barra de navegação e seção atual.
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  function refreshScrollState() {
    header.classList.toggle('scrolled', window.scrollY > 30);
    const active = [...document.querySelectorAll('main section[id]')]
      .filter(section => ['inicio', 'experiencia', 'arquivos', 'lancamento'].includes(section.id))
      .reduce((result, section) => section.getBoundingClientRect().top <= 180 ? section.id : result, 'inicio');
    navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${active}`));
  }
  window.addEventListener('scroll', refreshScrollState, { passive: true });
  refreshScrollState();

  // Galeria ampliável, sem dependências externas.
  const modal = $('#imageModal');
  const modalImage = $('#modalImage');
  let opener = null;
  document.querySelectorAll('.gallery-item').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      modalImage.src = button.dataset.image;
      modalImage.alt = button.querySelector('img').alt;
      $('#modalCaption').textContent = button.dataset.caption;
      modal.showModal();
      document.body.classList.add('modal-open');
    });
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    modalImage.removeAttribute('src');
    if (opener) opener.focus();
  });

  // Cria convite de calendário de dia inteiro; não presume horário de estreia.
  $('#calendarBtn').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PONTO CEGO//PRE-LANCAMENTO//PT-BR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:ponto-cego-lancamento-20261110@site-local',
      'DTSTAMP:20261105T120000Z',
      'DTSTART;VALUE=DATE:20261110',
      'DTEND;VALUE=DATE:20261111',
      'SUMMARY:PONTO CEGO - Data anunciada de lançamento',
      'DESCRIPTION:Lançamento anunciado para 10/11/2026. Acompanhe atualizações oficiais do projeto.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PONTO-CEGO-10-11-2026.ics';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('DATA SALVA! ABRA O ARQUIVO .ICS PARA ADICIONAR AO CALENDÁRIO.');
  });

  // Compartilha o link só quando o site estiver hospedado; offline compartilha o anúncio.
  $('#shareBtn').addEventListener('click', async () => {
    const hosted = location.protocol === 'https:' || location.protocol === 'http:';
    const text = 'PONTO CEGO — FPS com estética bodycam em uma floresta noturna. Lançamento anunciado para 10/11/2026.';
    const url = hosted ? location.origin + location.pathname : undefined;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PONTO CEGO — 10.11.2026', text, ...(url ? { url } : {}) });
        return;
      }
      const value = url ? `${text}\n${url}` : text;
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea');
        field.value = value;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        const success = document.execCommand('copy');
        field.remove();
        if (!success) throw new Error('Cópia indisponível');
      }
      showToast(url ? 'LINK E ANÚNCIO COPIADOS!' : 'ANÚNCIO COPIADO!');
    } catch (error) {
      if (error.name !== 'AbortError') showToast('NÃO FOI POSSÍVEL COMPARTILHAR NESTE NAVEGADOR.');
    }
  });
})();
