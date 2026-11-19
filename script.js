// ===== VERİ KATMANI: ileride getMenu(date) gerçek API çağrısıyla değiştirilecek =====
const ROTATION = [
  ["Ezogelin çorbası", "Tavuk sote", "Bulgur pilavı", "Cacık"],
  ["Mercimek çorbası", "Kuru fasulye", "Pirinç pilavı", "Turşu"],
  ["Domates çorbası", "Etli nohut", "Makarna", "Sütlaç"],
  ["Tarhana çorbası", "Orman kebabı", "Şehriyeli pilav", "Revani"],
  ["Yayla çorbası", "Fırın makarna", "Ispanaklı börek", "Ayran"]
];

const CATEGORIES = [
  { id: "soup", label: "Çorba", position: 0, icon: "🥣" },
  { id: "main", label: "Ana Yemek", position: 1, icon: "🍲" },
  { id: "side", label: "Yardımcı Yemek", position: 2, icon: "🍚" },
  { id: "extras", label: "Tamamlayıcı Ürünler", position: 4, icon: "🥗" },
  { id: "dessert", label: "Tatlı", position: 3, icon: "🍮" }
];
const COMPLEMENTARY_PRODUCTS = ["Ayran", "Cacık", "Turşu", "Yoğurt", "Mevsim salatası", "Çoban salatası"];
const MAX_PORTIONS = 500;

function getMenu(date) {
  if ([0, 6].includes(date.getDay())) return null;
  const day = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 1)) / 864e5);
  const indexes = [day % ROTATION.length, (day + 2) % ROTATION.length];
  return CATEGORIES.map(category => {
    let names;
    switch (category.id) {
      case "extras":
        names = COMPLEMENTARY_PRODUCTS;
        break;
      case "dessert":
        names = day % 2 ? [ROTATION[3][3], ROTATION[2][3]] : [ROTATION[2][3], ROTATION[3][3]];
        break;
      default:
        names = indexes.map(index => ROTATION[index][category.position]);
    }
    const dishes = names.map(name => ({ id: name, name, category: category.id, icon: DISH_ART[name] || category.icon }));
    return { ...category, dishes };
  });
}

function portionStatus(left) {
  return left <= 0 ? { cls: "out", label: "Tükendi" }
    : left < MAX_PORTIONS * .3 ? { cls: "low", label: "Azalıyor" }
    : { cls: "ok", label: "Yeterli" };
}

// ===== ARAYÜZ =====
const $ = s => document.querySelector(s);
const view = $("#view");
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
let mode = "daily";
const pageHistory = [];
let today = parseKey(istanbulClock().date);
let cur = new Date(today);
let weekRef;
let monthRef = new Date(cur.getFullYear(), cur.getMonth(), 1);

const same = (a, b) => a.toDateString() === b.toDateString();

const CALENDAR_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>';
const DISH_ART = {
  "Makarna": "🍝", "Fırın makarna": "🍝", "Ispanaklı börek": "🥐",
  "Turşu": "🥒", "Sütlaç": "🍮", "Revani": "🍰", "Cacık": "🥛", "Ayran": "🥛", "Yoğurt": "🥣"
};
const DESCRIPTIONS = {
  "Yayla çorbası": "Yoğurt, pirinç ve nane ile hazırlanan hafif çorba.",
  "Tavuk sote": "Taze sebzelerle sotelenmiş, baharatlı tavuk.",
  "Pirinç pilavı": "Tereyağlı, tane tane geleneksel pirinç pilavı.",
  "Ayran": "Soğuk, taze ve ferahlatıcı klasik ayran."
};

function mealCard(menu, records) {
  return `<section class="meal">
    <div class="meal-heading"><div><h3>Günün Menüsü</h3><p class="sub">11:00 – 17:00</p></div></div>
    ${menu.map(category => `<section class="menu-category">
      <h4>${category.label}</h4>
      <div class="dish-grid">${category.dishes.map(dish => {
        const left = getPortions(cur, dish.id, records);
        const status = portionStatus(left);
        return `<article class="dish ${status.cls}">
          <div class="dish-art art-${category.position}" aria-hidden="true">
            ${left ? "" : '<span class="sold-out">Tükendi</span>'}<span>${dish.icon}</span>
          </div>
          <div class="dish-content">
            <div class="eyebrow">${category.label}</div>
            <h5>${dish.name}</h5>
            ${DESCRIPTIONS[dish.name] ? `<p class="sub">${DESCRIPTIONS[dish.name]}</p>` : ""}
            <span class="availability"><span class="dot ${status.cls}"></span>${left ? `${left} porsiyon kaldı` : "Tükendi"}</span>
          </div>
        </article>`;
      }).join("")}</div>
    </section>`).join("")}
  </section>`;
}

function relativeDay(date) {
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return same(date, today) ? "Bugün" : same(date, tomorrow) ? "Yarın" : DAYS[date.getDay()];
}

function renderDaily() {
  const m = getMenu(cur);
  const records = loadRes();
  const existing = ownReservation(dateKey(cur), records);
  const dateAllowed = bookingDateAllowed(dateKey(cur));
  const canReserve = m && dateAllowed && !existing
    && SERVICE_SLOTS.some(slot => !slotEnded(dateKey(cur), slot.id) && slotRemaining(dateKey(cur), slot, records) > 0)
    && m.some(category => category.dishes.some(dish => getPortions(cur, dish.id, records) > 0));
  const dateText = `${cur.getDate()} ${MONTHS[cur.getMonth()]} ${cur.getFullYear()} ${DAYS[cur.getDay()]}`;
  if (!weekRef) {
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    weekRef = new Date(cur >= today && cur <= end ? today : cur);
  }
  const first = weekRef;
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return `<button class="day-tab" data-date="${dateKey(date)}" aria-pressed="${same(date, cur)}">
      ${CALENDAR_ICON}<span><strong>${relativeDay(date)}</strong><small>${date.getDate()} ${MONTHS[date.getMonth()]}</small></span>
    </button>`;
  }).join("");

  view.innerHTML = `
    <div class="intro">
      <p class="eyebrow">${dateText}</p>
      <h2>${same(cur, today) ? "Bugünün Menüsü" : relativeDay(cur) + " Menüsü"}</h2>
      <p class="sub">Yemeğini seç, saatini ayır ve sıra beklemeden teslim al.</p>
    </div>
    <div class="booking-toolbar"><div class="date-strip">
      <button class="btn week-arrow" id="prev" aria-label="Önceki hafta">‹</button>
      <div class="date-tabs" aria-label="Menü tarihleri">${dates}</div>
      <button class="btn week-arrow" id="next" aria-label="Sonraki hafta">›</button>
    </div>
    <div class="booking-control"><button class="btn primary" id="reserve" aria-describedby="booking-notice" ${canReserve ? "" : "disabled"}>Rezervasyon Yap</button>
      <div id="booking-notice" class="sub booking-note" role="status">
        ${!dateAllowed ? `<p>${DATE_NOTICE}</p>` : ""}
        ${existing ? `<p>${DUPLICATE_NOTICE}</p>` : ""}
      </div>
    </div></div>
    ${m ? mealCard(m, records) : '<div class="closed">Bugün yemekhane kapalı.</div>'}`;

  for (const [id, offset] of [["prev", -7], ["next", 7]]) {
    $("#" + id).onclick = () => {
      cur = new Date(first);
      cur.setDate(first.getDate() + offset);
      weekRef = new Date(cur);
      render();
      $("#" + id).focus();
    };
  }
  view.querySelectorAll("[data-date]").forEach(button => button.onclick = () => {
    cur = parseKey(button.dataset.date);
    render();
    const active = view.querySelector('[aria-pressed="true"].day-tab');
    active.focus({ preventScroll: true });
    active.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  $("#reserve").onclick = () => {
    const error = openReserve(cur);
    if (error) {
      $("#reserve").disabled = true;
      $("#booking-notice").textContent = error;
    }
  };
}

function renderMonthly() {
  const y = monthRef.getFullYear(), mo = monthRef.getMonth();
  const count = new Date(y, mo + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, index) => new Date(y, mo, index + 1)).flatMap(date => {
    const menu = getMenu(date);
    if (!menu) return [];
    const current = same(date, today);
    return `<article class="card month-day${current ? " is-today" : ""}">
      <h3>${formatDate(dateKey(date))}${current ? ' <span class="today-label">Bugün</span>' : ""}</h3>
      ${menu.map(category => `<section class="month-category category-${category.id}">
        <h4>${category.label}</h4>
        <ul class="month-dishes">${category.dishes.map(dish => `<li><span aria-hidden="true">${dish.icon}</span> ${dish.name}</li>`).join("")}</ul>
      </section>`).join("")}
      <button class="btn month-details" data-day="${date.getDate()}">Günlük Menüyü Aç</button>
    </article>`;
  });
  view.innerHTML = `
    <div class="datebar">
      <button class="btn" id="pm" aria-label="Önceki ay">‹</button>
      <h2>${MONTHS[mo]} ${y}</h2>
      <button class="btn" id="nm" aria-label="Sonraki ay">›</button>
    </div>
    <div class="grid month-grid">${days.join("")}</div>`;
  for (const [id, offset] of [["pm", -1], ["nm", 1]]) {
    $("#" + id).onclick = () => {
      monthRef = new Date(y, mo + offset, 1);
      render();
      $("#" + id).focus();
    };
  }
  view.querySelectorAll("[data-day]").forEach(button => button.onclick = () => {
    cur = new Date(y, mo, Number(button.dataset.day));
    weekRef = null;
    navigate("daily");
  });
}

function navigate(next, back = false) {
  if (mode !== next && !back) pageHistory.push(mode);
  mode = next;
  render();
  window.scrollTo(0, 0);
}

function syncToday() {
  const date = parseKey(istanbulClock().date);
  if (same(date, today)) return false;
  if (same(cur, today)) {
    if (same(monthRef, new Date(today.getFullYear(), today.getMonth(), 1))) {
      monthRef = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    cur = new Date(date);
    weekRef = null;
  }
  today = date;
  return true;
}

function render() {
  syncToday();
  $("#appBack").hidden = mode === "daily";
  $("#tabDaily").classList.toggle("active", mode === "daily");
  $("#tabMonthly").classList.toggle("active", mode === "monthly");
  $("#tabProfile").classList.toggle("active", mode === "profile");
  document.querySelectorAll("nav .tab").forEach(tab => {
    if (tab.classList.contains("active")) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  mode === "daily" ? renderDaily() : mode === "monthly" ? renderMonthly() : renderProfile();
}

$("#tabDaily").onclick = () => navigate("daily");
$("#tabMonthly").onclick = () => {
  if (mode !== "monthly") monthRef = new Date(cur.getFullYear(), cur.getMonth(), 1);
  navigate("monthly");
};
$("#tabProfile").onclick = () => navigate("profile");
$(".brand-link").onclick = event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate("daily");
};
$("#appBack").onclick = () => navigate(pageHistory.pop() || "daily", true);
const refreshDate = () => { if (syncToday()) render(); };
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDate(); });
setInterval(refreshDate, 1000);
render();
