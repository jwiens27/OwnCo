"use client";

import type { GuideId } from "@/lib/calculator/presets";
import { GUIDE_META } from "@/lib/calculator/presets";
import { InvestorPurchaseGuide } from "@/content/guides/investor-purchase";
import { InheritanceRentOutGuide } from "@/content/guides/inheritance-rent-out";
import { InheritanceOneLivesInGuide } from "@/content/guides/inheritance-one-lives-in";
import { InheritanceVacationGuide } from "@/content/guides/inheritance-vacation";

const GUIDE_CONTENT: Record<GuideId, React.ComponentType> = {
  "investor-purchase": InvestorPurchaseGuide,
  "inheritance-rent-out": InheritanceRentOutGuide,
  "inheritance-one-lives-in": InheritanceOneLivesInGuide,
  "inheritance-vacation": InheritanceVacationGuide,
};

export function ScenarioGuidePanel({
  guideId,
  onReset,
  onClose,
}: {
  guideId: GuideId;
  onReset: () => void;
  onClose: () => void;
}) {
  const meta = GUIDE_META[guideId];
  const Content = GUIDE_CONTENT[guideId];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 p-4 border-b">
        <div>
          <p className="text-xs text-muted-foreground">{meta.icon} Guide</p>
          <h2 className="font-semibold text-base">{meta.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
          aria-label="Close guide"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Content />
      </div>

      <div className="p-4 border-t">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
