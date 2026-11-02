import React from 'react';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown:
 * - **bold text** -> <strong>
 * - `code` -> <code>
 * - *italic* -> <em>
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match bold (**text**), inline code (`code`), or italic (*text*)
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-charcoal-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-800 text-blue-600 dark:text-brand-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-slate-800 dark:text-charcoal-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

/**
 * Renders structured assistant messages with bold text, bullet points,
 * numbered lists, and inline formatting.
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line -> paragraph spacer
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Bullet point: * or - or •
        const bulletMatch = line.match(/^(\s*)[*\-•]\s+(.*)$/);
        if (bulletMatch) {
          const isSubBullet = bulletMatch[1].length > 1;
          return (
            <div key={lineIdx} className={`flex items-start gap-2 ${isSubBullet ? 'ml-4' : 'ml-1'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-400 mt-1.5 shrink-0" />
              <div className="flex-1 text-slate-800 dark:text-charcoal-200">
                {parseInline(bulletMatch[2])}
              </div>
            </div>
          );
        }

        // Numbered list item: 1. or 2. etc.
        const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numberMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 ml-1">
              <span className="font-bold text-blue-600 dark:text-brand-400 text-[11px] shrink-0 mt-0.5">
                {numberMatch[2]}.
              </span>
              <div className="flex-1 text-slate-800 dark:text-charcoal-200">
                {parseInline(numberMatch[3])}
              </div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={lineIdx} className="text-slate-800 dark:text-charcoal-200">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};
