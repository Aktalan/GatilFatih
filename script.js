function pad(num, size) {
  const s = String(num);
  return s.length >= size ? s : "0".repeat(size - s.length) + s;
}

function makeCaseId() {
  const year = new Date().getFullYear();
  const n = Math.floor(Math.random() * 900000) + 100000;
  return `GF-${year}-${pad(n, 6)}`;
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function setupYear() {
  setText("[data-year]", String(new Date().getFullYear()));
}

function setupCaseId() {
  const id = makeCaseId();
  setText("[data-case-id]", id);
  return id;
}

function setupNav() {
  const toggle = $(".nav-toggle");
  const links = $("#nav-links");
  if (!toggle || !links) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    links.dataset.open = "false";
  };

  const open = () => {
    toggle.setAttribute("aria-expanded", "true");
    links.dataset.open = "true";
  };

  close();

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? close() : open();
  });

  $all("a", links).forEach((a) =>
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 760px)").matches) close();
    }),
  );

  document.addEventListener("click", (e) => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (toggle.contains(t) || links.contains(t)) return;
    close();
  });
}

function setupModal() {
  const dialog = $("[data-prop-modal]");
  const openers = $all("[data-open-prop]");
  if (!dialog) return;

  openers.forEach((btn) =>
    btn.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
    }),
  );
}

function setupToast() {
  const toast = $("[data-toast]");
  const close = $("[data-toast-close]");
  if (!toast) return { show: () => {} };

  const hide = () => {
    toast.hidden = true;
  };

  close?.addEventListener("click", hide);
  toast.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.closest("[data-toast-close]")) hide();
  });

  let timer = null;
  const show = (text) => {
    const body = $("[data-toast-body]", toast);
    if (body) body.textContent = text;
    toast.hidden = false;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(hide, 5000);
  };

  return { show };
}

function setupPropForm(caseId, toastApi) {
  const form = $("[data-prop-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim() || "Anonym";
    const channel = String(fd.get("channel") || "signal");
    const caseType = String(fd.get("caseType") || "beratung");

    const typeLabel =
      caseType === "planung" ? "Planung" : caseType === "reporting" ? "Reporting" : "Beratung";
    const channelLabel =
      channel === "courier" ? "Kurrier" : channel === "mail" ? "E‑Mail" : "Signal";

    const summary = `${caseId} · In Prüfung · ${typeLabel} · ${name} · ${channelLabel}`;
    setText("[data-prop-summary]", `Portal: ${summary}`);
    toastApi?.show?.(summary);
    form.reset();
  });
}

setupYear();
const caseId = setupCaseId();
setupNav();
setupModal();
const toastApi = setupToast();
setupPropForm(caseId, toastApi);
