"use client";

import GarmentIcon from "./GarmentIcon";
import { colorInfo, toVocabColor } from "@/data/colors";

const MATERIAL_TO_FABRIC = {
  linen: "linen", denim: "denim", satin: "satin", fleece: "fleece", jersey: "jersey",
  "cotton jersey": "jersey", "wool blend": "suiting", "rayon crepe": "crepe", rayon: "crepe",
  "cotton poplin": "poplin", poplin: "poplin", cotton: "poplin",
};

export const fabricKeyFor = (material = "") => MATERIAL_TO_FABRIC[material.toLowerCase()];

export default function WardrobeThumb({ item, size = 96, className = "" }) {
  const hex = colorInfo(toVocabColor(item.color)).hex;
  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.image} alt={item.name} className={`h-full w-full object-cover ${className}`} draggable={false} />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`} style={{ background: `linear-gradient(160deg, ${hex}22, #EFEEEA 70%)` }}>
      <GarmentIcon type={item.type} color={hex} fabric={fabricKeyFor(item.material)} size={size} />
    </div>
  );
}
