'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, RotateCcw, ArrowRight } from 'lucide-react';
import { InstallAppButton } from '@/components/ui/InstallAppButton';

/** A self-contained teaching sample; no account, saved progress or API calls. */
export default function LandingSample() {
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const firstAnswer = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const correct = answer === 5;

  return (
    <section id="sample" aria-labelledby="sample-heading" className="bg-white px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-[620px]">
          <p className="font-body mb-3 text-xs font-bold uppercase tracking-widest text-brand-dark">Try it before you choose</p>
          <h2 id="sample-heading" className="font-heading mb-4 font-bold text-ink">A small lesson. A clearer understanding.</h2>
          <p className="font-body text-muted">Try this free mathematics sample. No account or payment needed.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 rounded-3xl border border-border bg-bg-0 p-6 sm:p-8">
            <p className="mb-4 flex items-center gap-2 font-semibold text-brand-dark"><BookOpen size={19} aria-hidden /> Learn: keep both sides equal</p>
            <p className="font-body mb-5 text-ink-2">Think of an equation as a balanced scale. To find the unknown number, undo each operation on both sides.</p>
            <ol className="space-y-3 text-base text-ink-2">
              <li className="rounded-xl border border-border bg-white p-4"><strong>Start:</strong> 2x + 3 = 11</li>
              <li className="rounded-xl border border-border bg-white p-4"><strong>Subtract 3:</strong> 2x = 8</li>
              <li className="rounded-xl border border-border bg-white p-4"><strong>Divide by 2:</strong> x = 4</li>
            </ol>
          </div>
          <div id="sample-question" tabIndex={-1} className="min-w-0 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <form className="sample-interaction" onSubmit={(event) => { event.preventDefault(); setChecked(true); }}>
              <fieldset disabled={!ready}>
                <legend className="mb-4 font-semibold text-ink">Practice: if 3x + 2 = 17, what is x?</legend>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 5, 6].map((choice) => (
                    <label key={choice} className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 font-semibold ${answer === choice ? 'border-brand-dark bg-bg-2 text-brand-dark' : 'border-border-2 text-ink hover:bg-bg-0'}`}>
                      <input ref={choice === 3 ? firstAnswer : undefined} type="radio" name="sample-answer" value={choice} checked={answer === choice} onChange={() => { setAnswer(choice); setChecked(false); }} className="accent-green-700" />
                      {choice}
                    </label>
                  ))}
                </div>
              </fieldset>
              {!ready && <p role="status" className="mt-3 text-sm text-muted">Preparing your question…</p>}
              <button type="submit" disabled={!ready || answer === null} className="mt-4 min-h-12 w-full rounded-xl bg-brand-dark px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">Check my answer</button>
              <div role="status" aria-live="polite" aria-atomic="true" className="mt-4">
                {checked && <p className={`font-body rounded-xl p-4 ${correct ? 'bg-bg-2 text-brand-dark' : 'bg-amber-50 text-amber-900'}`}>
                  {correct ? 'Correct! Subtract 2 from both sides to get 3x = 15. Divide by 3 to get x = 5.' : `Not quite. For x = ${answer}, 3 × ${answer} + 2 = ${3 * (answer ?? 0) + 2}, rather than 17. Subtract 2 first, then divide by 3. Choose another answer and try again.`}
                </p>}
              </div>
              {checked && <button type="button" onClick={() => { setAnswer(null); setChecked(false); firstAnswer.current?.focus(); }} className="min-h-11 py-2 font-semibold text-brand-dark underline underline-offset-4">Try again</button>}
            </form>
            <noscript><p className="font-body mb-4">Practice: if 3x + 2 = 17, what is x? Think through your answer, then open the explanation below.</p><style>{'.sample-interaction { display: none; }'}</style></noscript>
            <details className="mt-4 rounded-xl border border-border p-4">
              <summary className="cursor-pointer font-medium text-ink">See the worked solution</summary>
              <p className="font-body mt-3 text-muted">Subtract 2 from both sides: 3x = 15. Divide both sides by 3: x = 5. Check it: 3 × 5 + 2 = 17.</p>
            </details>
            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-2 flex items-start gap-2 font-semibold text-brand-dark"><RotateCcw size={19} className="shrink-0" aria-hidden /> Review: bring the idea back</p>
              <p className="font-body text-muted">In Recall, studied topics return for scheduled review. This sample does not save progress.</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/pay/individual" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-dark underline underline-offset-4">Get individual access <ArrowRight size={17} aria-hidden /></Link>
          <Link href="/join" className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4">Use your school code</Link>
          <InstallAppButton variant="outline" />
        </div>
      </div>
    </section>
  );
}
