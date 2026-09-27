import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useHyperlink } from '../../context/HyperlinkContext';

interface MarkdownViewProps {
  content: string;
  className?: string;
  forceLight?: boolean;
}

// Code Block with Copy Button
const CodeBlock: React.FC<{ code: string; language?: string; isLight?: boolean }> = ({ code, language, isLight }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative my-3 rounded-xl overflow-hidden border shadow-lg group select-text ${
        isLight
          ? 'bg-slate-50 border-black/[0.1] shadow-black/5'
          : 'bg-[#070912]/85 border-white/[0.08] shadow-lg'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-mono select-none ${
          isLight
            ? 'bg-black/[0.03] border-black/[0.06] text-slate-600'
            : 'bg-white/[0.03] border-white/[0.05] text-zinc-400'
        }`}
      >
        <span className="uppercase tracking-wider font-semibold">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
            isLight
              ? 'hover:bg-black/[0.06] text-slate-600 hover:text-slate-900'
              : 'hover:bg-white/[0.08] text-zinc-400 hover:text-white'
          }`}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-emerald-600 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre
        className={`p-3 text-[11px] font-mono overflow-x-auto scrollbar-thin select-text ${
          isLight ? 'text-slate-900' : 'text-zinc-200'
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Render inline formatting: code, bold-italic, bold, italic, links, and <br>
const renderInlineSpans = (text: string, isLight: boolean): React.ReactNode => {
  if (!text) return null;

  // Regex to split by inline markdown elements
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] border select-text ${
            isLight
              ? 'bg-black/[0.05] text-indigo-800 border-black/[0.08]'
              : 'bg-white/[0.06] text-indigo-300 border-white/[0.08]'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <strong key={i} className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
          <em className="italic">{part.slice(3, -3)}</em>
        </strong>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className={`italic ${isLight ? 'text-slate-700 font-medium' : 'text-zinc-300'}`}>
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('[') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noreferrer"
            className={`underline underline-offset-2 transition-colors font-medium ${
              isLight ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'
            }`}
          >
            {match[1]}
          </a>
        );
      }
    }

    return part;
  });
};

// Split by <br>, <br/>, <br />
const renderInlineWithBr = (text: string, isLight: boolean): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/<br\s*\/?>/gi);
  if (parts.length === 1) {
    return renderInlineSpans(text, isLight);
  }

  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {renderInlineSpans(part, isLight)}
      {index < parts.length - 1 && <br />}
    </React.Fragment>
  ));
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '', forceLight }) => {
  let isLight = false;
  try {
    const ctx = useHyperlink();
    isLight = forceLight !== undefined ? forceLight : ctx.isLightMode;
  } catch {
    isLight = !!forceLight;
  }

  if (!content) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block detection
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push(
        <CodeBlock key={`code_${i}`} code={codeLines.join('\n')} language={lang} isLight={isLight} />
      );
      continue;
    }

    // 2. Table detection
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('-')
    ) {
      const headerLine = line.trim();
      const headers = headerLine
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      i += 2; // skip header and separator
      const rows: string[][] = [];

      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowCells = lines[i]
          .trim()
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
        i++;
      }

      blocks.push(
        <div
          key={`table_${i}`}
          className={`w-full my-3 overflow-x-auto rounded-xl border shadow-md select-text scrollbar-thin ${
            isLight
              ? 'border-black/[0.08] bg-white/80'
              : 'border-white/[0.08] bg-[#0b0f19]/70'
          }`}
        >
          <table className="w-full border-collapse text-xs text-left">
            <thead
              className={`border-b font-bold select-text ${
                isLight
                  ? 'bg-black/[0.03] text-slate-900 border-black/[0.08]'
                  : 'bg-white/[0.04] text-white border-white/[0.08]'
              }`}
            >
              <tr>
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className={`px-3.5 py-2 text-left font-bold tracking-wide border-r last:border-r-0 ${
                      isLight ? 'border-black/[0.05]' : 'border-white/[0.04]'
                    }`}
                  >
                    {renderInlineWithBr(h, isLight)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y select-text ${isLight ? 'divide-black/[0.05]' : 'divide-white/[0.04]'}`}>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`transition-colors ${
                    isLight
                      ? 'hover:bg-black/[0.02] even:bg-black/[0.01]'
                      : 'hover:bg-white/[0.025] even:bg-white/[0.01]'
                  }`}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-3.5 py-2 align-top leading-relaxed border-r last:border-r-0 select-text ${
                        isLight
                          ? 'border-black/[0.05] text-slate-900'
                          : 'border-white/[0.04] text-zinc-200'
                      }`}
                    >
                      {renderInlineWithBr(cell, isLight)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 3. Headings
    if (line.startsWith('#### ')) {
      blocks.push(
        <h4
          key={`h4_${i}`}
          className={`text-xs font-bold mt-2 mb-1 select-text ${
            isLight ? 'text-slate-900' : 'text-zinc-300'
          }`}
        >
          {renderInlineWithBr(line.slice(5), isLight)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h3
          key={`h3_${i}`}
          className={`text-xs font-bold tracking-wide mt-3 mb-1 flex items-center gap-1.5 select-text ${
            isLight ? 'text-indigo-900' : 'text-indigo-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              isLight ? 'bg-indigo-600 shadow-[0_0_6px_#4f46e5]' : 'bg-indigo-400 shadow-[0_0_6px_#818cf8]'
            }`}
          />
          <span>{renderInlineWithBr(line.slice(4), isLight)}</span>
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h2
          key={`h2_${i}`}
          className={`text-sm font-bold mt-3.5 mb-1.5 pb-1 border-b select-text ${
            isLight
              ? 'text-slate-950 border-black/[0.08]'
              : 'text-white border-white/[0.06]'
          }`}
        >
          {renderInlineWithBr(line.slice(3), isLight)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push(
        <h1
          key={`h1_${i}`}
          className={`text-base font-extrabold mt-4 mb-2 pb-1.5 border-b select-text ${
            isLight
              ? 'text-slate-950 border-black/[0.1]'
              : 'text-white border-white/[0.08]'
          }`}
        >
          {renderInlineWithBr(line.slice(2), isLight)}
        </h1>
      );
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      blocks.push(
        <hr
          key={`hr_${i}`}
          className={`my-3 border-t ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}
        />
      );
      i++;
      continue;
    }

    // 5. Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote_${i}`}
          className={`border-l-2 pl-3 py-1 my-2 rounded-r-lg italic text-xs leading-relaxed select-text ${
            isLight
              ? 'border-indigo-600 bg-indigo-50/50 text-slate-800'
              : 'border-indigo-400 bg-white/[0.02] text-zinc-300'
          }`}
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{renderInlineWithBr(ql, isLight)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    // 6. Lists
    const isListItem = (l: string) => /^\s*([-*•]|\d+\.)\s+/.test(l);
    if (isListItem(line)) {
      const listItems: { text: string; isOrdered: boolean }[] = [];
      while (i < lines.length && isListItem(lines[i])) {
        const itemLine = lines[i];
        const isOrd = /^\s*\d+\.\s+/.test(itemLine);
        const itemText = itemLine.replace(/^\s*([-*•]|\d+\.)\s+/, '');
        listItems.push({ text: itemText, isOrdered: isOrd });
        i++;
      }

      const isAllOrdered = listItems.every((item) => item.isOrdered);

      if (isAllOrdered) {
        blocks.push(
          <ol
            key={`ol_${i}`}
            className={`space-y-1.5 my-2 pl-5 list-decimal select-text font-normal ${
              isLight ? 'text-slate-900' : 'text-zinc-200'
            }`}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1 select-text">
                {renderInlineWithBr(item.text, isLight)}
              </li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul
            key={`ul_${i}`}
            className={`space-y-1.5 my-2 pl-3 select-text font-normal ${
              isLight ? 'text-slate-900' : 'text-zinc-200'
            }`}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed select-text">
                <span
                  className={`mt-1.5 text-[6px] leading-none shrink-0 ${
                    isLight ? 'text-indigo-600' : 'text-indigo-400'
                  }`}
                >
                  ●
                </span>
                <span className="flex-1 select-text">{renderInlineWithBr(item.text, isLight)}</span>
              </li>
            ))}
          </ul>
        );
      }
      continue;
    }

    // 7. Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 8. Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('> ') &&
      !lines[i].trim().startsWith('|') &&
      !isListItem(lines[i]) &&
      lines[i].trim() !== '---'
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p
          key={`p_${i}`}
          className={`my-1.5 leading-relaxed select-text ${
            isLight ? 'text-slate-900 font-normal' : 'text-zinc-200'
          }`}
        >
          {renderInlineWithBr(paraLines.join(' '), isLight)}
        </p>
      );
    }
  }

  return (
    <div
      className={`markdown-content select-text cursor-text text-xs leading-relaxed ${
        isLight ? 'text-slate-900' : 'text-zinc-200'
      } ${className}`}
    >
      {blocks}
    </div>
  );
};

