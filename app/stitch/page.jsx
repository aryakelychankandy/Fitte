import { Suspense } from "react";
import StitchClient from "./StitchClient";

export const metadata = { title: "DRIFT Custom Stitch" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StitchClient />
    </Suspense>
  );
}
