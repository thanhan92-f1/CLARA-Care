"use client";

import { useState } from "react";
import type { FaqItem } from "@/components/landing/clara-kp3-data";

type Props = {
  items: readonly FaqItem[];
};

export default function LandingFaqAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const opened = openIndex === index;
        return (
          <div
            key={item.question}
            className={[
              "overflow-hidden rounded-2xl border transition-all duration-200",
              opened
                ? "border-blue-300 bg-slate-900/90 shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_18px_46px_-30px_rgba(37,99,235,0.8)]"
                : "border-slate-700 bg-slate-900/75"
            ].join(" ")}
          >
            <h3>
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left"
                onClick={() => setOpenIndex(opened ? -1 : index)}
                aria-expanded={opened}
              >
                <span className="text-base font-semibold text-slate-100">{item.question}</span>
                <span
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg font-semibold transition",
                    opened
                      ? "border-blue-300 bg-blue-100/90 text-blue-700"
                      : "border-slate-600 bg-slate-800 text-slate-200"
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {opened ? "−" : "+"}
                </span>
              </button>
            </h3>
            {opened ? (
              <div className="border-t border-slate-700 px-5 pb-5 pt-4">
                <p className="text-sm leading-7 text-slate-300">{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
