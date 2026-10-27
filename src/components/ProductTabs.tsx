"use client";

import { useState, type ReactNode } from "react";

export type Tab = { id: string; label: string; content: ReactNode };

/** Filson-style tab row; panels are rendered on the server and passed in. */
export default function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div role="tablist" className="no-scrollbar flex gap-8 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`eyebrow -mb-px shrink-0 border-b-2 pb-3 transition ${
              active === tab.id
                ? "border-teal text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="pt-10"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
