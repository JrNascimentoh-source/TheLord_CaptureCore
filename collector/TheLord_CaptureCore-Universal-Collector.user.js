// ==UserScript==
// @name         TheLord CaptureCore — Universal Collector
// @namespace    thelord-capturecore
// @version      0.1.0
// @description  Captura resultados Aviator por instância e envia eventos ao painel CaptureCore que abriu a tela
// @match        *://*/*
// @exclude      *://jrnascimentoh-source.github.io/*
// @exclude      *://*.jrnascimentoh-source.github.io/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const IS_ROOT = !!readCaptureConfig(location.href);
  const TOP_URL_MESSAGE = 'thelord-capturecore-top-url';
  const FRAME_EVENT = 'THELORD_CAPTURECORE_FRAME_EVENT';
  const SELF_URL = location.href;
  const APP_ORIGIN = 'https://jrnascimentoh-source.github.io';
  let topUrl = IS_ROOT ? SELF_URL : '';
  let instanceId = '';
  let dashboardOrigin = '';

  function parseUrl(value) { try { return new URL(value); } catch (_) { return null; } }
  function isBetDoPovoUrl(value) {
    const parsed = parseUrl(value);
    return !!parsed && /(^|\.)betdopovo\./i.test(parsed.hostname);
  }
  function gameFromUrl(value) {
    const parsed = parseUrl(value);
    if (!parsed || !isBetDoPovoUrl(value)) return 'aviator';
    return parsed.searchParams.get('via') === '4' ? 'aviatorvip' : 'aviator2';
  }
  function readCaptureConfig(value) {
    const parsed = parseUrl(value);
    if (!parsed) return null;
    const id = parsed.searchParams.get('_capturecore_instance') || '';
    const origin = parsed.searchParams.get('_capturecore_origin') || '';
    if (!id || origin !== APP_ORIGIN) return null;
    return { instanceId: id, dashboardOrigin: origin };
  }
  function applyTopUrl(value) {
    topUrl = value;
    const config = readCaptureConfig(value);
    if (config) { instanceId = config.instanceId; dashboardOrigin = config.dashboardOrigin; }
  }
  function forwardTopUrl(value) {
    for (let i = 0; i < window.frames.length; i++) {
      try { window.frames[i].postMessage({ type: TOP_URL_MESSAGE, url: value }, '*'); } catch (_) {}
    }
  }
  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === TOP_URL_MESSAGE && !IS_ROOT && event.source === window.parent && typeof data.url === 'string') {
      applyTopUrl(data.url);
      forwardTopUrl(data.url);
      return;
    }
    if (IS_ROOT && data.type === FRAME_EVENT && typeof data.instanceId === 'string' && data.instanceId === instanceId) {
      sendToDashboard(data.kind, data.data);
    }
  });
  if (IS_ROOT) {
    applyTopUrl(SELF_URL);
    forwardTopUrl(SELF_URL);
    setInterval(() => forwardTopUrl(SELF_URL), 1500);
  }

  function sendToDashboard(kind, data) {
    if (!IS_ROOT || !instanceId || dashboardOrigin !== APP_ORIGIN || window.parent === window) return;
    try {
      window.parent.postMessage({
        type: 'THELORD_CAPTURECORE_EVENT',
        version: 1,
        instanceId,
        kind,
        data: data ?? null
      }, dashboardOrigin);
    } catch (_) {}
  }
  function emit(kind, data) {
    if (!instanceId || dashboardOrigin !== APP_ORIGIN) return;
    if (IS_ROOT) sendToDashboard(kind, data);
    else {
      try { window.parent.postMessage({ type: FRAME_EVENT, instanceId, kind, data: data ?? null }, '*'); } catch (_) {}
    }
  }

  function resolveGame() {
    return new Promise(resolve => {
      const selfIsBet = isBetDoPovoUrl(SELF_URL);
      const selfParsed = parseUrl(SELF_URL);
      const selfViaVip = !!selfParsed && selfParsed.searchParams.get('via') === '4';
      if (IS_ROOT) return resolve(gameFromUrl(SELF_URL));
      if (selfIsBet && selfViaVip) return resolve('aviatorvip');
      const referrer = document.referrer || '';
      const referrerParsed = parseUrl(referrer);
      if (isBetDoPovoUrl(referrer) && referrerParsed && referrerParsed.searchParams.get('via') === '4') return resolve('aviatorvip');
      const referrerIsBet = isBetDoPovoUrl(referrer);
      let betAncestor = false;
      try {
        const ancestors = location.ancestorOrigins;
        betAncestor = !!(ancestors && Array.from(ancestors).some(origin => isBetDoPovoUrl(origin)));
      } catch (_) {}
      const started = Date.now();
      const wait = setInterval(() => {
        if (topUrl) {
          clearInterval(wait);
          resolve(gameFromUrl(topUrl));
        } else if (Date.now() - started > 4000) {
          clearInterval(wait);
          resolve(selfIsBet || betAncestor || referrerIsBet ? 'aviator2' : 'aviator');
        }
      }, 200);
    });
  }

  resolveGame().then(start);

  function start(GAME) {
    const GAME_LABEL = GAME === 'aviatorvip' ? 'Aviator VIP' : 'Aviator';
    const host = location.hostname;
    const signatureKey = 'thelord_capturecore_signature_v1_' + (instanceId || 'unlinked');
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:4px;left:4px;z-index:2147483647;background:#000c;color:#ffc72c;font:11px sans-serif;padding:3px 6px;border-radius:6px;pointer-events:none';
    badge.textContent = 'CaptureCore [' + GAME_LABEL + ']: ' + (instanceId ? 'conectando' : 'abra pelo painel');
    function showBadge() {
      if (IS_ROOT && document.body && !document.body.contains(badge)) document.body.appendChild(badge);
    }
    if (IS_ROOT) { showBadge(); setInterval(showBadge, 2000); }

    function parseMultiplier(text) {
      let raw = String(text || '').trim().replace(/[x×]$/i, '').replace(/\s/g, '');
      if (!/^\d[\d.,]*$/.test(raw)) return NaN;
      const dot = raw.lastIndexOf('.');
      const comma = raw.lastIndexOf(',');
      if (dot >= 0 && comma >= 0) {
        const decimal = dot > comma ? '.' : ',';
        raw = raw.split(decimal === '.' ? ',' : '.').join('').replace(decimal, '.');
      } else if (comma >= 0) {
        raw = /^\d{1,3}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
      } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, '');
      return Number(raw);
    }
    function read() {
      let elements = [...document.querySelectorAll(
        '.payouts-block .payout, app-stats-widget .payout, .payouts-wrapper .bubble-multiplier, ' +
        '.payouts-block .bubble-multiplier, .payouts .payout, app-bubble-multiplier, ' +
        '[class*="payout"] [class*="multiplier"], .result-history .bubble-multiplier'
      )];
      if (!elements.length) {
        const candidates = [...document.querySelectorAll('div,span')].filter(element =>
          element.children.length === 0 &&
          /^\s*\d[\d.,\s]*[x×]\s*$/i.test(element.textContent || '') &&
          Number.isFinite(parseMultiplier(element.textContent))
        );
        if (candidates.length >= 3) {
          const firstTop = Math.min(...candidates.map(element => element.getBoundingClientRect().top));
          elements = candidates.filter(element => Math.abs(element.getBoundingClientRect().top - firstTop) < 6)
            .sort((a,b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        }
      }
      return elements.map(element => parseMultiplier(element.textContent))
        .filter(value => Number.isFinite(value) && value >= 1 && value < 1000000);
    }

    let lastSignature = null;
    let observedSignature = null;
    let observedCount = 0;
    try { lastSignature = localStorage.getItem(signatureKey) || null; } catch (_) {}
    if (IS_ROOT && instanceId) {
      emit('heartbeat', { game: GAME, host });
      setInterval(() => emit('heartbeat', { game: GAME, host }), 15000);
    }
    setInterval(() => {
      const values = read();
      if (!values.length) return;
      showBadge();
      const signature = values.slice(0, 8).join('|');
      if (signature === observedSignature) observedCount++;
      else { observedSignature = signature; observedCount = 1; }
      if (lastSignature === null) {
        if (observedCount < 3) return;
        lastSignature = signature;
        try { localStorage.setItem(signatureKey, signature); } catch (_) {}
        badge.textContent = 'CaptureCore [' + GAME + ']: ativo · ' + host;
        return;
      }
      if (signature !== lastSignature && observedCount >= 3) {
        lastSignature = signature;
        try { localStorage.setItem(signatureKey, signature); } catch (_) {}
        const value = values[0];
        emit('round', { game: GAME, value, detectedAt: new Date().toISOString(), host });
        badge.textContent = 'CaptureCore: capturada ' + value + 'x';
      }
    }, 1000);
  }
})();
