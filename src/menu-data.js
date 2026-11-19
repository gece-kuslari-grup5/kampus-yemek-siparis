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

const DISH_ART = {
  "Makarna": "🍝", "Fırın makarna": "🍝", "Ispanaklı börek": "🥐",
  "Turşu": "🥒", "Sütlaç": "🍮", "Revani": "🍰", "Cacık": "🥛", "Ayran": "🥛", "Yoğurt": "🥣"
};

export { CATEGORIES, COMPLEMENTARY_PRODUCTS, MAX_PORTIONS, ROTATION, getMenu };
