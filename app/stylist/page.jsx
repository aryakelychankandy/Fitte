import { Suspense } from "react";
import StylistClient from "./StylistClient";

export const metadata = { title: "DRIFT Stylist" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StylistClient />
    </Suspense>
  );
}
