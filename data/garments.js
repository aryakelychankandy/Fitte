// Custom-stitch garment catalogue. Prices in ₹.
//  metres  – fabric needed for a standard-size body (scaled to your measurements)
//  stitch  – base made-to-measure stitching fee
// Every garment's first option is `fit`, which drives ease in lib/fit.js.

const c = (v, price = 0, note) => ({ v, price, note });

export const EXTRAS = {
  pocket: { label: "Chest pocket", price: 60 },
  piping: { label: "Contrast piping", price: 150 },
  monogram: { label: "Tonal monogram embroidery", price: 199 },
  lining: { label: "Full lining", price: 220 },
  halflining: { label: "Half lining", price: 150 },
  deeppockets: { label: "Deep side pockets", price: 60 },
  embroidery: { label: "Hand-embroidered placket", price: 349 },
  express: { label: "Express stitching (4–5 days)", price: 299 },
};

export const GARMENTS = [
  {
    key: "tee", label: "T-shirt", category: "top", metres: 1.4, stitch: 250, formality: 1, warmth: 2,
    blurb: "Heavyweight everyday tee, cut to your shoulders.",
    fabrics: ["jersey", "cotlin", "poplin"], defaultFabric: "jersey",
    options: [
      { key: "fit", label: "Fit", choices: [c("Oversized"), c("Relaxed"), c("Regular"), c("Slim")], def: "Relaxed" },
      { key: "neckline", label: "Neckline", choices: [c("Crew"), c("V-neck"), c("Boat")], def: "Crew" },
      { key: "sleeve", label: "Sleeve", choices: [c("Short"), c("Three-quarter", 20), c("Long", 40)], def: "Short" },
      { key: "length", label: "Length", choices: [c("Cropped"), c("Regular"), c("Longline", 30)], def: "Regular" },
    ],
    extras: ["pocket", "piping", "monogram", "express"],
  },
  {
    key: "shirt", label: "Shirt", category: "top", metres: 1.8, stitch: 350, formality: 3, warmth: 2,
    blurb: "A shirt that finally fits your shoulders and arms.",
    fabrics: ["linen", "cotlin", "poplin", "dobby", "crepe"], defaultFabric: "linen",
    options: [
      { key: "fit", label: "Fit", choices: [c("Oversized"), c("Relaxed"), c("Regular"), c("Tailored", 100)], def: "Relaxed" },
      { key: "collar", label: "Collar", choices: [c("Point"), c("Band"), c("Camp / Cuban")], def: "Point" },
      { key: "sleeve", label: "Sleeve", choices: [c("Short"), c("Long"), c("Roll-up tabs", 40)], def: "Long" },
      { key: "placket", label: "Placket", choices: [c("Classic"), c("Hidden buttons", 80)], def: "Classic" },
    ],
    extras: ["pocket", "monogram", "piping", "express"],
  },
  {
    key: "crop", label: "Crop top", category: "top", metres: 0.9, stitch: 220, formality: 2, warmth: 1,
    blurb: "Cropped exactly where you want it to land.",
    fabrics: ["jersey", "poplin", "satin", "crepe", "cotlin"], defaultFabric: "poplin",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Regular"), c("Fitted")], def: "Fitted" },
      { key: "neckline", label: "Neckline", choices: [c("Square"), c("Round"), c("Halter", 60), c("Corset bodice", 180)], def: "Square" },
      { key: "sleeve", label: "Sleeve", choices: [c("Sleeveless"), c("Short"), c("Long", 40)], def: "Sleeveless" },
    ],
    extras: ["piping", "express"],
  },
  {
    key: "hoodie", label: "Hoodie", category: "top", metres: 2.2, stitch: 550, formality: 1, warmth: 4,
    blurb: "Brushed-fleece hoodie with the drop you choose.",
    fabrics: ["fleece", "jersey"], defaultFabric: "fleece",
    options: [
      { key: "fit", label: "Fit", choices: [c("Oversized"), c("Relaxed"), c("Regular")], def: "Oversized" },
      { key: "closure", label: "Closure", choices: [c("Pullover"), c("Full zip", 90)], def: "Pullover" },
      { key: "pocket", label: "Pocket", choices: [c("Kangaroo"), c("Side seam")], def: "Kangaroo" },
    ],
    extras: ["monogram", "piping", "express"],
  },
  {
    key: "trousers", label: "Trousers", category: "bottom", metres: 1.9, stitch: 400, formality: 3, warmth: 2,
    blurb: "Waist, hip and inseam cut to your numbers — no more tailor alterations.",
    fabrics: ["twill", "suiting", "cotlin", "linen", "cord", "crepe"], defaultFabric: "twill",
    options: [
      { key: "fit", label: "Fit", choices: [c("Slim"), c("Regular"), c("Relaxed"), c("Tailored", 100)], def: "Regular" },
      { key: "rise", label: "Rise", choices: [c("Mid"), c("High")], def: "Mid" },
      { key: "pleats", label: "Pleats", choices: [c("Flat front"), c("Single pleat", 40), c("Double pleat", 80)], def: "Flat front" },
      { key: "hem", label: "Hem", choices: [c("Plain"), c("Cuffed", 40)], def: "Plain" },
    ],
    extras: ["halflining", "deeppockets", "monogram", "express"],
  },
  {
    key: "wide", label: "Wide-leg pants", category: "bottom", metres: 2.4, stitch: 450, formality: 3, warmth: 2,
    blurb: "Fluid wide-leg pants balanced to your height and hip.",
    fabrics: ["crepe", "twill", "linen", "cotlin", "suiting", "satin", "denim"], defaultFabric: "crepe",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Wide"), c("Oversized", 60, "Extra wide")], def: "Wide" },
      { key: "rise", label: "Rise", choices: [c("Mid"), c("High")], def: "High" },
      { key: "waistband", label: "Waistband", choices: [c("Zip & button"), c("Half elastic")], def: "Zip & button" },
    ],
    extras: ["deeppockets", "halflining", "express"],
  },
  {
    key: "shorts", label: "Shorts", category: "bottom", metres: 1.1, stitch: 250, formality: 1, warmth: 1,
    blurb: "Lightweight shorts at the exact length you like.",
    fabrics: ["cotlin", "linen", "twill", "dobby", "jersey"], defaultFabric: "cotlin",
    options: [
      { key: "fit", label: "Fit", choices: [c("Regular"), c("Relaxed"), c("Tailored", 60)], def: "Relaxed" },
      { key: "length", label: "Length", choices: [c("Above knee"), c("Knee"), c("Bermuda")], def: "Knee" },
      { key: "waistband", label: "Waistband", choices: [c("Drawstring"), c("Zip & button")], def: "Drawstring" },
    ],
    extras: ["deeppockets", "express"],
  },
  {
    key: "skirt", label: "Skirt", category: "bottom", metres: 1.6, stitch: 300, formality: 3, warmth: 1,
    blurb: "From slip to pleated — cut to your waist and hip.",
    fabrics: ["satin", "crepe", "poplin", "denim", "linen"], defaultFabric: "crepe",
    options: [
      { key: "fit", label: "Fit", choices: [c("Regular"), c("Fitted"), c("Relaxed")], def: "Regular" },
      { key: "shape", label: "Shape", choices: [c("A-line"), c("Pencil"), c("Pleated", 120), c("Bias slip", 120)], def: "A-line" },
      { key: "length", label: "Length", choices: [c("Mini"), c("Midi"), c("Maxi", 60)], def: "Midi" },
    ],
    extras: ["lining", "express"],
  },
  {
    key: "dress", label: "Dress", category: "dress", metres: 2.8, stitch: 650, formality: 3, warmth: 2,
    blurb: "Bust, waist and hip all in the right place.",
    fabrics: ["crepe", "satin", "poplin", "linen", "cotlin", "dobby"], defaultFabric: "crepe",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Regular"), c("Fitted")], def: "Regular" },
      { key: "silhouette", label: "Silhouette", choices: [c("A-line"), c("Shirt dress"), c("Wrap", 120), c("Slip", 150)], def: "A-line" },
      { key: "neckline", label: "Neckline", choices: [c("Round"), c("V-neck"), c("Square")], def: "Round" },
      { key: "sleeve", label: "Sleeve", choices: [c("Sleeveless"), c("Short"), c("Full", 60)], def: "Short" },
      { key: "length", label: "Length", choices: [c("Mini"), c("Midi"), c("Maxi", 80)], def: "Midi" },
    ],
    extras: ["lining", "piping", "express"],
  },
  {
    key: "kurta", label: "Kurta", category: "top", metres: 2.5, stitch: 500, formality: 3.5, warmth: 2,
    blurb: "Festive or everyday kurta, drafted to your shoulder and chest.",
    fabrics: ["cotlin", "linen", "poplin", "dobby", "crepe", "satin"], defaultFabric: "cotlin",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Regular"), c("Tailored", 100)], def: "Regular" },
      { key: "neckline", label: "Neckline", choices: [c("Mandarin"), c("Round"), c("Notch")], def: "Mandarin" },
      { key: "sleeve", label: "Sleeve", choices: [c("Full"), c("Three-quarter"), c("Short")], def: "Full" },
      { key: "length", label: "Length", choices: [c("Hip"), c("Knee"), c("Calf", 60)], def: "Knee" },
    ],
    extras: ["piping", "embroidery", "monogram", "express"],
  },
  {
    key: "jacket", label: "Overshirt / Jacket", category: "layer", metres: 2.3, stitch: 900, formality: 2, warmth: 3,
    blurb: "A layer that sits right over your shoulders.",
    fabrics: ["denim", "twill", "cord", "suiting", "cotlin"], defaultFabric: "twill",
    options: [
      { key: "fit", label: "Fit", choices: [c("Oversized"), c("Relaxed"), c("Regular")], def: "Relaxed" },
      { key: "collar", label: "Collar", choices: [c("Point"), c("Band"), c("Shawl", 60)], def: "Point" },
      { key: "closure", label: "Closure", choices: [c("Buttons"), c("Zip", 90)], def: "Buttons" },
    ],
    extras: ["pocket", "lining", "monogram", "express"],
  },
  {
    key: "blazer", label: "Blazer", category: "layer", metres: 2.4, stitch: 1100, formality: 4, warmth: 3,
    blurb: "A properly tailored blazer, without the tailor's price.",
    fabrics: ["suiting", "twill", "linen", "cotlin", "crepe"], defaultFabric: "suiting",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Regular"), c("Tailored", 150)], def: "Regular" },
      { key: "lapel", label: "Lapel", choices: [c("Notch"), c("Peak", 100), c("Shawl", 100)], def: "Notch" },
      { key: "buttons", label: "Buttons", choices: [c("Single-breasted"), c("Double-breasted", 150)], def: "Single-breasted" },
    ],
    extras: ["lining", "monogram", "express"],
  },
  {
    key: "set", label: "Co-ord set", category: "set", metres: 3.6, stitch: 850, formality: 3, warmth: 2,
    blurb: "Matching top and bottom, cut as one outfit.",
    fabrics: ["crepe", "cotlin", "linen", "satin", "twill", "poplin"], defaultFabric: "cotlin",
    options: [
      { key: "fit", label: "Fit", choices: [c("Relaxed"), c("Regular")], def: "Relaxed" },
      { key: "top", label: "Top", choices: [c("Shirt"), c("Tee"), c("Crop", -60)], def: "Shirt" },
      { key: "bottom", label: "Bottom", choices: [c("Trousers"), c("Wide-leg"), c("Shorts", -100)], def: "Wide-leg" },
    ],
    extras: ["piping", "monogram", "express"],
  },
];

export const GARMENT_BY_KEY = Object.fromEntries(GARMENTS.map((g) => [g.key, g]));
export const DELIVERY_FREE_ABOVE = 1999;
export const DELIVERY_FEE = 99;
export const STITCH_LEAD_DAYS = "7–9 days";
