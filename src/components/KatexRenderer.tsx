'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KatexRendererProps {
  content: string;
  className?: string;
}

export const KatexRenderer: React.FC<KatexRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by code blocks ``` first
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const renderMathAndText = (text: string, keyPrefix: string) => {
    // Replace $$block$$ first, then $inline$
    const tokens: React.ReactNode[] = [];
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g;
    let tLast = 0;
    let mMatch: RegExpExecArray | null;

    while ((mMatch = mathRegex.exec(text)) !== null) {
      if (mMatch.index > tLast) {
        tokens.push(
          <span key={`${keyPrefix}_t_${tLast}`} style={{ whiteSpace: 'pre-wrap' }}>
            {text.substring(tLast, mMatch.index)}
          </span>
        );
      }

      const mathStr = mMatch[0];
      const isBlock = mathStr.startsWith('$$');
      const formula = isBlock ? mathStr.slice(2, -2) : mathStr.slice(1, -1);

      try {
        const html = katex.renderToString(formula, {
          displayMode: isBlock,
          throwOnError: false
        });
        tokens.push(
          <span
            key={`${keyPrefix}_m_${mMatch.index}`}
            dangerouslySetInnerHTML={{ __html: html }}
            className={isBlock ? 'block my-2 text-center overflow-x-auto' : 'inline-block mx-0.5'}
          />
        );
      } catch (err) {
        tokens.push(<code key={`${keyPrefix}_err_${mMatch.index}`}>{mathStr}</code>);
      }

      tLast = mathRegex.lastIndex;
    }

    if (tLast < text.length) {
      tokens.push(
        <span key={`${keyPrefix}_t_end`} style={{ whiteSpace: 'pre-wrap' }}>
          {text.substring(tLast)}
        </span>
      );
    }

    return tokens;
  };

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text_${lastIndex}`}>
          {renderMathAndText(content.substring(lastIndex, match.index), `t_${lastIndex}`)}
        </span>
      );
    }

    const lang = match[1] || 'text';
    const code = match[2];
    parts.push(
      <pre key={`code_${match.index}`} className="my-2 p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto font-mono">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text_end`}>
        {renderMathAndText(content.substring(lastIndex), `t_end`)}
      </span>
    );
  }

  return <div className={`leading-relaxed ${className}`}>{parts}</div>;
};
