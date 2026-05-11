import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  delayMs?: number;
  perLetterMs?: number;
  as?: "span" | "div";
}

/**
 * Letter-by-letter stagger reveal with a slight bounce.
 * Uses CSS only — no animation libraries.
 */
const LetterStagger = ({ text, className, delayMs = 0, perLetterMs = 35, as = "span" }: Props) => {
  const Tag = as as any;
  return (
    <Tag className={cn("inline-block no-clip", className)} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block opacity-0 translate-y-[0.4em]"
          style={{
            animation: `letterPop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
            animationDelay: `${delayMs + i * perLetterMs}ms`,
            whiteSpace: ch === " " ? "pre" : "normal",
          }}
        >
          {ch}
        </span>
      ))}
      <style>{`
        @keyframes letterPop {
          0%   { opacity: 0; transform: translateY(0.45em) scale(0.96); }
          70%  { opacity: 1; transform: translateY(-0.06em) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </Tag>
  );
};

export default LetterStagger;
