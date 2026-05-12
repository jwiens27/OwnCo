"use client";

import { GUIDE_META, type GuideId } from "@/lib/calculator/presets";

const GUIDE_ORDER: GuideId[] = [
  "investor-purchase",
  "inheritance-rent-out",
  "inheritance-one-lives-in",
  "inheritance-vacation",
];

export function ScenarioGuideDialog({
  onSelect,
  onClose,
}: {
  onSelect: (id: GuideId) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Choose a Scenario Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {GUIDE_ORDER.map((id) => {
            const meta = GUIDE_META[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <p className="font-medium text-sm">{meta.title}</p>
                  <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
