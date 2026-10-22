import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata = { title: "Shop DRIFT" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ShopClient />
    </Suspense>
  );
}
