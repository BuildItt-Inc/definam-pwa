import type { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  tone?: 'jade' | 'gold';
  icon?: LucideIcon;
  iconStyle?: 'pill' | 'bare';
  title?: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}

export function InfoCard({
  tone = 'jade',
  icon: Icon,
  iconStyle = 'pill',
  title,
  body,
  children,
  className,
}: InfoCardProps) {
  const shell = [
    'rounded-xl border',
    tone === 'jade' ? 'bg-ink-tint border-ink-tint-border' : 'bg-ink-2/10 border-gold/30',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (children !== undefined) {
    return <div className={shell}>{children}</div>;
  }

  // gold tone never renders a pill — always bare
  const usePill = !!Icon && iconStyle === 'pill' && tone === 'jade';

  return (
    <div className={`${shell} flex items-start gap-3 p-4`}>
      {Icon && (
        usePill ? (
          <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={17} strokeWidth={2} className="text-white" aria-hidden />
          </div>
        ) : (
          <Icon
            size={20}
            strokeWidth={2}
            className={`flex-shrink-0 mt-0.5 ${tone === 'jade' ? 'text-ink' : 'text-ink-2'}`}
            aria-hidden
          />
        )
      )}
      <div>
        {title && (
          <p className={`text-[13px] font-bold leading-none mb-1 ${tone === 'jade' ? 'text-ink-dark' : 'text-ink-2'}`}>
            {title}
          </p>
        )}
        {body && (
          <p className={`text-[12px] leading-snug ${tone === 'jade' ? 'text-ink-body' : 'text-ink-2/80'}`}>
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
