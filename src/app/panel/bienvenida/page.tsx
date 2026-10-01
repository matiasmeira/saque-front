import { Suspense } from "react";

import { WizardOnboarding } from "@/components/panel/wizard-onboarding/wizard-onboarding";

export default function PanelBienvenida() {
  // useSearchParams (para `?nuevo=1`) exige un límite de Suspense.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <WizardOnboarding />
    </Suspense>
  );
}
