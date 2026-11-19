const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const RES_KEY = "kys_reservations";
const USER_ID = "local-student";
const SERVICE_SLOTS = [
  { id: "11:00", end: "12:00", capacity: 150 },
  { id: "12:00", end: "13:00", capacity: 250 },
  { id: "13:00", end: "14:00", capacity: 150 },
  { id: "14:00", end: "15:00", capacity: 150 },
  { id: "15:00", end: "16:00", capacity: 150 },
  { id: "16:00", end: "17:00", capacity: 150 }
];
const DELIVERY = {
  ye: { label: "Yemekhanede Ye", icon: "🍽️", description: "Yemeğini yemekhanede tüket." },
  goturu: { label: "Al Götür", icon: "🥡", description: "Yemeğini paket olarak teslim al." }
};
const findSlot = id => SERVICE_SLOTS.find(slot => slot.id === id);
const slotLabel = id => {
  const slot = findSlot(id);
  return slot ? `${slot.id} – ${slot.end}` : id;
};
const ISTANBUL_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});

function istanbulClock(now = new Date()) {
  const parts = Object.fromEntries(ISTANBUL_CLOCK.formatToParts(now).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function bookingDateAllowed(date, current = istanbulClock().date) {
  const tomorrow = parseKey(current);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date === current || date === dateKey(tomorrow);
}

function timePassed(date, time) {
  const now = istanbulClock();
  return date < now.date || (date === now.date && time <= now.time);
}

const DATE_NOTICE = "Yalnızca bugün ve yarın için rezervasyon yapabilirsiniz.";
const DUPLICATE_NOTICE = "Bu tarih için zaten bir rezervasyonunuz bulunmaktadır.";
const slotEnded = (date, id) => timePassed(date, findSlot(id)?.end || id);
const formatDate = date => parseKey(date).toLocaleDateString("tr-TR", { dateStyle: "full" });
const activeFor = (date, records) => records.filter(r => r.date === date && r.status === "active");
const ownReservation = (date, records) => records.find(r => r.date === date && r.userId === USER_ID);
const slotRemaining = (date, slot, records) => Math.max(0, slot.capacity - activeFor(date, records).filter(r => r.slot === slot.id).length);

function getPortions(date, dishId, records) {
  const key = dateKey(date);
  const reserved = activeFor(key, records).filter(r => r.items.some(item => item.id === dishId)).length;
  return Math.max(0, MAX_PORTIONS - reserved);
}

function loadRes() {
  let raw;
  try { raw = JSON.parse(localStorage.getItem(RES_KEY)); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  const entries = raw.filter(r => r && typeof r.id === "string" && typeof r.date === "string" && Array.isArray(r.items));
  const occupied = new Set(entries.filter(r => r.version === 2 && r.userId === USER_ID && r.status === "active")
    .map(r => r.date));
  return entries.map(r => {
    if (r.version === 2) {
      const items = r.items.map(item => COMPLEMENTARY_PRODUCTS.includes(item.id) && item.category !== "extras"
        ? { ...item, category: "extras" }
        : item);
      return { ...r, items };
    }
    const mapped = r.slot?.replace(/:..$/, ":00");
    const menu = getMenu(parseKey(r.date));
    const slot = findSlot(mapped);
    const dishes = menu?.flatMap(category => category.dishes) || [];
    const items = r.items.map(name => {
      const match = dishes.find(dish => dish.id === name);
      return { id: name, name, category: match?.category || legacyCategory(name) };
    });
    let status = r.status;
    let migratedSlot = r.slot;
    if (status === "active") {
      if (timePassed(r.date, r.slot)) status = "completed";
      else if (!slot || !menu || slotEnded(r.date, mapped) || occupied.has(r.date)) status = "legacy";
      else {
        occupied.add(r.date);
        migratedSlot = mapped;
      }
    }
    return { version: 2, id: r.id, userId: r.userId || USER_ID, date: r.date, items,
      slot: migratedSlot, legacyTime: migratedSlot === r.slot && status !== "active",
      type: r.type, status, created: r.created };
  });
}

function legacyCategory(name) {
  if (COMPLEMENTARY_PRODUCTS.includes(name)) return "extras";
  if (["Sütlaç", "Revani"].includes(name)) return "dessert";
  return CATEGORIES.find(category => ROTATION.some(row => row[category.position] === name))?.id || "side";
}

function escapedText(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function saveRes(records) {
  localStorage.setItem(RES_KEY, JSON.stringify(records));
}

function updateRecords(task) {
  return navigator.locks ? navigator.locks.request(RES_KEY, () => task(loadRes())) : Promise.resolve().then(() => task(loadRes()));
}

const dlg = document.createElement("dialog");
dlg.className = "booking-dialog";
dlg.setAttribute("aria-labelledby", "booking-title");
document.body.appendChild(dlg);

function openReserve(date, editing) {
  const key = dateKey(date);
  const menu = getMenu(date);
  const openingError = creationError(loadRes());
  if (openingError) return openingError;

  function creationError(records) {
    if (!menu) return "Hafta sonu rezervasyon yapılamaz.";
    if (editing) return "";
    if (!bookingDateAllowed(key)) return DATE_NOTICE;
    return ownReservation(key, records) ? DUPLICATE_NOTICE : "";
  }
  const dishes = menu.flatMap(category => category.dishes);
  const selected = new Map();
  for (const item of editing?.items || []) {
    const dish = dishes.find(d => d.id === item.id);
    if (dish) selected.set(dish.category, dish);
  }
  let slotId = editing?.slot || "";
  let type = editing?.type || "";
  let busy = false;

  function validate(records) {
    const error = creationError(records);
    if (error) return error;
    if (editing && !activeFor(key, records).some(r => r.id === editing.id && r.userId === USER_ID)) return "Bu rezervasyon artık düzenlenemiyor.";
    if (!selected.size) return "En az bir yemek seç.";
    const inventory = records.filter(r => r.id !== editing?.id);
    if ([...selected.values()].some(dish => getPortions(date, dish.id, inventory) === 0)) return "Seçtiğin yemeklerden biri tükendi.";
    const slot = findSlot(slotId);
    if (!slot) return "Bir saat aralığı seç.";
    if (slotEnded(key, slot.id) || slotRemaining(key, slot, inventory) === 0) return "Seçtiğin saat aralığı artık uygun değil.";
    if (!Object.hasOwn(DELIVERY, type)) return "Teslim şeklini seç.";
    return "";
  }

  function paint(message = "") {
    const records = loadRes();
    const inventory = records.filter(r => r.id !== editing?.id);
    dlg.innerHTML = `<div class="dialog-heading"><h2 id="booking-title">${editing ? "Rezervasyonu Düzenle" : "Rezervasyon Yap"}</h2>
      <button type="button" class="btn" data-close aria-label="Kapat">×</button></div>
      <p class="booking-date">${formatDate(key)}</p>
      <section><h3>Yemek seçimi <small>En az bir yemek seç</small></h3>
      ${menu.map(category => `<fieldset class="category-${category.id}"><legend>${category.label}</legend><div class="choice-grid">
        ${category.dishes.map((dish, index) => {
          const left = getPortions(date, dish.id, inventory);
          return `<button class="choice" data-food="${category.id}-${index}" aria-pressed="${selected.get(category.id)?.id === dish.id}" ${left ? "" : "disabled"}>
            <span aria-hidden="true">${dish.icon}</span> <strong>${dish.name}</strong><small>${left ? left + " porsiyon kaldı" : "Tükendi"}</small></button>`;
        }).join("")}</div></fieldset>`).join("")}</section>
      <section><h3>Saat aralığı <small>Zorunlu</small></h3><div class="choice-grid">
        ${SERVICE_SLOTS.map(slot => {
          const left = slotRemaining(key, slot, inventory);
          const ended = slotEnded(key, slot.id);
          return `<button class="choice slot" data-slot="${slot.id}" aria-pressed="${slotId === slot.id}" ${ended || !left ? "disabled" : ""}>
            <strong>${slotLabel(slot.id)}</strong><small>${ended ? "Saat aralığı sona erdi" : left ? left + "/" + slot.capacity + " kişilik yer kaldı" : "Kontenjan dolu"}</small>
            <progress aria-label="Doluluk" value="${slot.capacity - left}" max="${slot.capacity}"></progress></button>`;
        }).join("")}</div></section>
      <section><h3>Teslim şekli <small>Zorunlu</small></h3><div class="choice-grid">
        ${Object.entries(DELIVERY).map(([id, opt]) => `<button class="choice" data-type="${id}" aria-pressed="${type === id}">
          <span aria-hidden="true">${opt.icon}</span> <strong>${opt.label}</strong><small>${opt.description}</small></button>`).join("")}
      </div></section>
      <section class="booking-summary" aria-live="polite"><h3>Rezervasyon özeti</h3>
        <dl><dt>Tarih</dt><dd>${formatDate(key)}</dd>
        <dt>Yemekler</dt><dd>${[...selected.values()].map(dish => dish.name).join(", ") || "Seçilmedi"}</dd>
        <dt>Saat aralığı</dt><dd>${slotId ? slotLabel(slotId) : "Seçilmedi"}</dd>
        <dt>Teslim şekli</dt><dd>${DELIVERY[type]?.label || "Seçilmedi"}</dd></dl>
      </section>
      <p class="sub" role="status">${message || validate(records)}</p>
      <div class="actions"><button class="btn" data-close>Vazgeç</button>
      <button id="confirm-booking" class="btn primary" ${busy || validate(records) ? "disabled" : ""}>${editing ? "Değişiklikleri Kaydet" : "Rezervasyonu Onayla"}</button></div>`;

    function refresh(button, attribute) {
      const anchor = button.getAttribute(attribute);
      const scroll = dlg.scrollTop;
      paint();
      dlg.scrollTop = scroll;
      [...dlg.querySelectorAll("[" + attribute + "]")].find(el => el.getAttribute(attribute) === anchor)?.focus({ preventScroll: true });
    }
    dlg.querySelectorAll("[data-close]").forEach(button => button.onclick = () => dlg.close());
    dlg.querySelectorAll("[data-food]").forEach(button => button.onclick = () => {
      const [category, index] = button.dataset.food.split("-");
      const dish = menu.find(group => group.id === category).dishes[index];
      if (selected.get(category)?.id === dish.id) selected.delete(category);
      else selected.set(category, dish);
      refresh(button, "data-food");
    });
    dlg.querySelectorAll("[data-slot]").forEach(button => button.onclick = () => {
      slotId = button.dataset.slot;
      refresh(button, "data-slot");
    });
    dlg.querySelectorAll("[data-type]").forEach(button => button.onclick = () => {
      type = button.dataset.type;
      refresh(button, "data-type");
    });
    dlg.querySelector("#confirm-booking").onclick = async event => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      dlg.inert = true;
      try {
        const result = await updateRecords(current => {
          const error = validate(current);
          if (error) return { error };
          const record = {
            version: 2, id: editing?.id || crypto.randomUUID(), userId: USER_ID,
            date: key, items: [...selected.values()].map(({ id, name, category }) => ({ id, name, category })),
            slot: slotId, type, status: "active", created: editing?.created || Date.now()
          };
          saveRes([...current.filter(r => r.id !== editing?.id), record]);
          return { record };
        });
        dlg.inert = false;
        if (!dlg.open) return;
        if (result.error) { busy = false; paint(result.error); return; }
        dlg.innerHTML = `<h2 id="booking-title">${editing ? "Rezervasyon güncellendi" : "Rezervasyon onaylandı"}</h2>
          <p>${formatDate(key)} · ${slotLabel(slotId)}</p><p class="sub">Kod: ${escapedText(result.record.id)}</p><div class="actions"><button class="btn primary">Kapat</button></div>`;
        busy = false;
        dlg.querySelector("button").onclick = () => dlg.close();
        dlg.querySelector("button").focus();
      } catch {
        dlg.inert = false;
        if (!dlg.open) return;
        busy = false;
        paint("Rezervasyon kaydedilemedi. Tekrar dene.");
      }
    };
  }

  paint();
  dlg.oncancel = event => { if (busy) event.preventDefault(); };
  dlg.addEventListener("close", render, { once: true });
  dlg.showModal();
  dlg.scrollTop = 0;
}

function resStatus(r) {
  if (r.status === "cancelled") return ["İptal edildi", "out"];
  if (r.status === "legacy") return ["Eski kayıt", ""];
  if (r.status === "completed" || slotEnded(r.date, r.slot)) return ["Tamamlandı", "ok"];
  return ["Aktif", "act"];
}

function renderProfile() {
  const list = loadRes().filter(r => r.userId === USER_ID).sort((a, b) => (b.date + b.slot).localeCompare(a.date + a.slot));
  view.innerHTML = `<div class="datebar"><h2>Rezervasyonlarım</h2></div>
    ${list.length ? `<div class="grid">${list.map((r, index) => {
      const [label, cls] = resStatus(r);
      return `<article class="card"><h3>${formatDate(r.date)} <span class="pill ${cls}">${label}</span></h3>
        <p class="sub">${escapedText(r.legacyTime ? r.slot : slotLabel(r.slot))} · ${DELIVERY[r.type]?.label || "Belirtilmedi"}</p>
        <p class="sub reservation-code">Kod: ${escapedText(r.id)}</p>
        <ul class="plain">${r.items.map(item => `<li>${escapedText(item.name)}</li>`).join("")}</ul>
        ${cls === "act" ? `<div class="actions"><button class="btn" data-edit="${index}">Düzenle</button>
          <button class="btn danger" data-cancel="${index}">İptal et</button></div>` : ""}
      </article>`;
    }).join("")}</div>` : '<p class="closed">Henüz rezervasyonun yok.</p>'}
    <p id="profile-status" class="sub" role="status"></p>`;

  view.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => {
    const record = list[button.dataset.edit];
    openReserve(parseKey(record.date), record);
  });
  view.querySelectorAll("[data-cancel]").forEach(button => button.onclick = async () => {
    if (!confirm("Rezervasyonu iptal etmek istediğine emin misin?")) return;
    button.disabled = true;
    try {
      await updateRecords(records => {
        const record = records.find(r => r.id === list[button.dataset.cancel].id && r.userId === USER_ID);
        if (record?.status === "active" && !slotEnded(record.date, record.slot)) {
          record.status = "cancelled";
          saveRes(records);
        }
      });
      render();
    } catch {
      button.disabled = false;
      $("#profile-status").textContent = "Rezervasyon iptal edilemedi. Tekrar dene.";
    }
  });
}
