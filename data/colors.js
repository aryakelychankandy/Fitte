// The DRIFT colour vocabulary. `temp` is the colour temperature, `depth` its
// lightness, `neutral` marks colours that pair with almost anything.
export const COLORS = [
  { name: "Black", hex: "#111111", temp: "neutral", depth: "dark", neutral: true },
  { name: "White", hex: "#F4F2EC", temp: "neutral", depth: "light", neutral: true },
  { name: "Cream", hex: "#E7DFCF", temp: "warm", depth: "light", neutral: true },
  { name: "Beige", hex: "#CDB99A", temp: "warm", depth: "light", neutral: true },
  { name: "Camel", hex: "#B58B5B", temp: "warm", depth: "mid", neutral: true },
  { name: "Brown", hex: "#5A4636", temp: "warm", depth: "dark", neutral: true },
  { name: "Stone", hex: "#B8AFA0", temp: "neutral", depth: "light", neutral: true },
  { name: "Grey", hex: "#8C8C88", temp: "neutral", depth: "mid", neutral: true },
  { name: "Charcoal", hex: "#3A3A3A", temp: "neutral", depth: "dark", neutral: true },
  { name: "Navy", hex: "#2C3A4B", temp: "cool", depth: "dark", neutral: true },
  { name: "Light Denim", hex: "#8FA9C7", temp: "cool", depth: "light", neutral: true },
  { name: "Denim Blue", hex: "#5F7FA3", temp: "cool", depth: "mid", neutral: true },
  { name: "Dark Denim", hex: "#34496A", temp: "cool", depth: "dark", neutral: true },
  { name: "Sage", hex: "#7C8570", temp: "neutral", depth: "mid", neutral: false },
  { name: "Olive", hex: "#6B6B3A", temp: "warm", depth: "mid", neutral: false },
  { name: "Forest", hex: "#33422F", temp: "neutral", depth: "dark", neutral: false },
  { name: "Emerald", hex: "#1F7A5A", temp: "cool", depth: "mid", neutral: false },
  { name: "Teal", hex: "#2E7C80", temp: "cool", depth: "mid", neutral: false },
  { name: "Red", hex: "#B3261E", temp: "warm", depth: "mid", neutral: false },
  { name: "Rust", hex: "#B5532A", temp: "warm", depth: "mid", neutral: false },
  { name: "Terracotta", hex: "#C8744F", temp: "warm", depth: "mid", neutral: false },
  { name: "Mustard", hex: "#D9A526", temp: "warm", depth: "light", neutral: false },
  { name: "Maroon", hex: "#5C1F1A", temp: "warm", depth: "dark", neutral: false },
  { name: "Berry", hex: "#8C2B4F", temp: "cool", depth: "dark", neutral: false },
  { name: "Pink", hex: "#D98FA0", temp: "cool", depth: "light", neutral: false },
  { name: "Dusty Rose", hex: "#C99A9A", temp: "neutral", depth: "light", neutral: false },
  { name: "Lavender", hex: "#B7A7D6", temp: "cool", depth: "light", neutral: false },
  { name: "Cobalt", hex: "#2A52BE", temp: "cool", depth: "mid", neutral: false },
  { name: "Sky Blue", hex: "#A9C9E8", temp: "cool", depth: "light", neutral: false },
];

export const COLOR_BY_NAME = Object.fromEntries(COLORS.map((c) => [c.name, c]));

export const colorInfo = (name) =>
  COLOR_BY_NAME[name] || { name, hex: "#999999", temp: "neutral", depth: "mid", neutral: true };

// Shop colours use brand names (Ecru, Ink, Stone…). Map them to the vocabulary.
export const SHOP_COLOR_ALIAS = {
  Ecru: "Cream",
  Ink: "Black",
  Pink: "Pink",
  Grey: "Grey",
};
export const toVocabColor = (name) => SHOP_COLOR_ALIAS[name] || name;
