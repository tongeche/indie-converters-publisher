'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type ExpandableBioProps = {
  authorName: string;
  shortBio: string | null;
  longBio: string | null;
};

export function ExpandableBio({ authorName, shortBio, longBio }: ExpandableBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!shortBio && !longBio) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
        Biography not yet available. Add author bio in Supabase to display here.
      </div>
    );
  }

  const hasLongBio = longBio && longBio.trim().length > 0;
  const displayBio = isExpanded && hasLongBio ? longBio : shortBio;

  return (
    <div className="mt-6">
      <div className="space-y-4 text-base leading-relaxed text-zinc-700">
        {displayBio?.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {hasLongBio && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Read full biography
            </>
          )}
        </button>
      )}
    </div>
  );
}
