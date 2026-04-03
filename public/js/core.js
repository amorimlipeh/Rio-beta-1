
(function () {
  window.RIOCore = window.RIOCore || {};

  window.RIOCore.showModule = function (id) {
    document.querySelectorAll('.module').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  };

  window.RIOCore.safeHtml = function (id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  window.RIOCore.safeText = function (id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  window.RIOCore.safeFetchJson = async function (url, fallback) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return fallback;
      return await r.json();
    } catch (e) {
      return fallback;
    }
  };

  console.log('RIOCore carregado sem alterar layout base');
})();
