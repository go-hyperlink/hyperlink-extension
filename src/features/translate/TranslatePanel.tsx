import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { translationService, SUPPORTED_LANGUAGES } from '../../services/translate/translationService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const TranslatePanel: React.FC = () => {
  const { pageContext, featureProps, showToast } = useHyperlink();
  const [sourceText, setSourceText] = useState(featureProps.text || pageContext.selectedText || '');
  const [targetLang, setTargetLang] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (featureProps.text) {
      setSourceText(featureProps.text);
      if (featureProps.autoTranslate) {
        setLoading(true);
        translationService.translateText(featureProps.text, targetLang)
          .then(res => {
            setTranslatedText(res);
            showToast({ type: 'success', title: 'Translation Complete' });
          })
          .catch(e => showToast({ type: 'error', title: 'Translation Error', message: e.message }))
          .finally(() => setLoading(false));
      }
    }
  }, [featureProps.text, featureProps.autoTranslate, featureProps._ts]);

  const handleTranslate = async () => {
    const text = sourceText || document.body.innerText.slice(0, 3000);
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await translationService.translateText(text, targetLang);
      setTranslatedText(res);
      showToast({ type: 'success', title: 'Translation Complete' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Translation Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    showToast({ type: 'success', title: 'Translation Copied' });
  };

  return (
    <PanelContainer
      title="Translate"
      iconName="Languages"
      subtitle="Context-preserving language translation"
    >
      <div className="space-y-4">
        {/* Source Text Preview/Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Source (Auto-detected)</span>
            {pageContext.selectedText && (
              <button
                onClick={() => setSourceText(pageContext.selectedText || '')}
                className="text-sky-400 hover:underline text-[11px]"
              >
                Use selected text
              </button>
            )}
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter or select text from page..."
            rows={3}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-sky-400 resize-none"
          />
        </div>

        {/* Target Language Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Target Language</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full bg-[#0a0e18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-sky-400/40"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        <HyperlinkButton
          onClick={handleTranslate}
          loading={loading}
          variant="primary"
          icon="Languages"
          className="w-full"
        >
          Translate Text
        </HyperlinkButton>

        {/* Translated Output */}
        {translatedText && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-sky-400">Result</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                <HyperlinkIcon name="Copy" size={12} />
                Copy
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-100 leading-relaxed whitespace-pre-wrap select-text cursor-text">
              {translatedText}
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
