import { Suspense } from "react";
import OnboardingFlow from "./OnboardingFlow";

export const metadata = { title: "Create your DRIFT profile" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
