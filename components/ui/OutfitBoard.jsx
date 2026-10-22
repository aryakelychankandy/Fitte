"use client";

import { useEffect, useState } from "react";
import GarmentIcon from "./GarmentIcon";
import { cutoutFor } from "@/lib/cutout";
import { colorInfo, toVocabColor } from "@/data/colors";
import { fabricKeyFor } from "./WardrobeThumb";

// A styled flat-lay of the outfit built from the real photos of the pieces in
// the person's wardrobe — shown exactly as photographed, with the studio
// backdrop lifted off so the pieces sit together on one board.

function usePhoto(item) {
  const [src, setSrc] = useState(item?.image || null);
  useEffect(() => {
    let live = true;
    setSrc(item?.image || null);
    if (item?.image) cutoutFor(item.image).then((c) => { if (live && c) setSrc(c); });
    return () => { live = false; };
  }, [item?.image]);
  return src;
}

function Piece({ item, box, z, rotate = 0, shadow = true }) {
  const src = usePhoto(item);
  const style = { left: `${box[0]}%`, top: `${box[1]}%`, width: `${box[2]}%`, height: `${box[3]}%`, zIndex: z, transform: rotate ? `rotate(${rotate}deg)` : undefined };
  const hex = colorInfo(toVocabColor(item.color)).hex;
  return (
    <div className="absolute flex items-center justify-center transition-all duration-500" style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item.name} draggable={false} className="max-h-full max-w-full object-contain" style={shadow ? { filter: "drop-shadow(0 8px 10px rgba(30,25,15,.22))" } : undefined} />
      ) : (
        <GarmentIcon type={item.type} color={hex} fabric={fabricKeyFor(item.material)} size={200} className="max-h-full max-w-full" />
      )}
    </div>
  );
}

export default function OutfitBoard({ pieces = {}, className = "" }) {
  const { dress, top, bottom, layer, shoes } = pieces;
  let layout = [];
  if (dress) {
    layout = [
      layer && ["layer", layer, [0, 8, 58, 66], 1, -4],
      ["dress", dress, layer ? [24, 4, 72, 80] : [8, 3, 84, 86], 2, 0],
      shoes && ["shoes", shoes, [64, 78, 34, 21], 3, 0],
    ];
  } else {
    layout = [
      bottom && ["bottom", bottom, top || layer ? [12, 40, 58, 58] : [18, 6, 64, 90], 1, 0],
      layer && ["layer", layer, [0, 3, 62, 46], 2, -4],
      top && ["top", top, layer ? [34, 6, 64, 44] : [8, 3, 84, 48], 3, 0],
      shoes && ["shoes", shoes, [66, 76, 33, 22], 4, 0],
    ];
  }
  if (!bottom && !dress && top && !layer) layout = [["top", top, [8, 18, 84, 62], 3, 0], shoes && ["shoes", shoes, [66, 76, 33, 22], 4, 0]];
  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-3xl ${className}`} style={{ background: "radial-gradient(120% 90% at 30% 15%, #F6F4EF 0%, #ECE9E2 70%, #E4E0D7 100%)" }}>
      {layout.filter(Boolean).map(([slot, item, box, z, rot]) => <Piece key={slot + item.id} item={item} box={box} z={z} rotate={rot} />)}
    </div>
  );
}
