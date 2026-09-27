import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { extractorService, ExtractedImage, ExtractedTable } from '../../services/extract/extractorService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  ChevronRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Check, 
  Sparkles,
  Table as TableIcon
} from 'lucide-react';

type ExtractCategory = 'emails' | 'phoneNumbers' | 'links' | 'prices' | 'headings' | 'images' | 'tables';

export const ExtractPanel: React.FC = () => {
  const { openFeatureWithProps, addToast } = useHyperlink();
  const [category, setCategory] = useState<ExtractCategory>('images');
  const [data, setData] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  
  // Table inspection state
  const [selectedTable, setSelectedTable] = useState<ExtractedTable | null>(null);

  // Image batch downloading state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [downloadedImgUrls, setDownloadedImgUrls] = useState<Set<string>>(new Set());

  const runExtraction = (cat = category) => {
    setSelectedTable(null);
    switch (cat) {
      case 'emails':
        setData(extractorService.extractEmails());
        break;
      case 'phoneNumbers':
        setData(extractorService.extractPhoneNumbers().map(p => ({ phone: p })));
        break;
      case 'links':
        setData(extractorService.extractLinks());
        break;
      case 'prices':
        setData(extractorService.extractPrices());
        break;
      case 'headings':
        setData(extractorService.extractHeadings());
        break;
      case 'images':
        setData(extractorService.extractImages());
        break;
      case 'tables':
        setData(extractorService.extractTables());
        break;
    }
  };

  useEffect(() => {
    runExtraction(category);
  }, [category]);

  const filteredData = data.filter(item => {
    if (!filterQuery) return true;
    try {
      const str = JSON.stringify(item).toLowerCase();
      return str.includes(filterQuery.toLowerCase());
    } catch {
      return true;
    }
  });

  const handleCopy = async () => {
    if (data.length === 0) return;
    let text = '';
    if (category === 'tables') {
      text = extractorService.tablesToCSV(data);
    } else {
      text = extractorService.toCSV(data);
    }
    await navigator.clipboard.writeText(text);
    addToast(`Copied ${data.length} ${category} to clipboard`, 'success');
  };

  const handleDownloadCsv = () => {
    if (data.length === 0) return;
    let csv = '';
    if (category === 'tables') {
      csv = extractorService.tablesToCSV(data);
    } else {
      csv = extractorService.toCSV(data);
    }
    extractorService.download(csv, `hyperlink-extracted-${category}.csv`, 'csv');
    addToast(`Downloaded CSV (${data.length} records)`, 'success');
  };

  const handleDownloadJson = () => {
    if (data.length === 0) return;
    const json = JSON.stringify(data, null, 2);
    extractorService.download(json, `hyperlink-extracted-${category}.json`, 'json');
    addToast(`Downloaded JSON (${data.length} records)`, 'success');
  };

  const handleSave = () => {
    openFeatureWithProps('save', {
      type: 'article',
      title: `Extracted ${data.length} ${category}`,
      initialText: JSON.stringify(data, null, 2)
    });
  };

  // Image Downloads: Single
  const handleDownloadSingleImage = async (e: React.MouseEvent, img: ExtractedImage) => {
    e.stopPropagation();
    addToast(`Downloading ${img.filename}...`, 'info');
    const ok = await extractorService.downloadImage(img);
    if (ok) {
      setDownloadedImgUrls(prev => new Set(prev).add(img.src));
      addToast(`Downloaded ${img.filename}`, 'success');
    } else {
      addToast('Download failed', 'error');
    }
  };

  // Image Downloads: Combined / All
  const handleDownloadAllImages = async () => {
    if (data.length === 0 || category !== 'images') return;
    const images = data as ExtractedImage[];
    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: images.length });
    addToast(`Starting download of ${images.length} images...`, 'info');

    try {
      const count = await extractorService.downloadAllImages(images, (curr, total) => {
        setDownloadProgress({ current: curr, total });
      });
      addToast(`Successfully downloaded ${count} of ${images.length} images`, 'success');
    } catch {
      addToast('Error during batch download', 'error');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(null);
    }
  };

  const handleCopyImageUrl = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    addToast('Image URL copied', 'success');
  };

  const categories: Array<{ id: ExtractCategory; label: string; icon: string }> = [
    { id: 'images', label: 'Images', icon: 'Camera' },
    { id: 'emails', label: 'Emails', icon: 'Sparkles' },
    { id: 'phoneNumbers', label: 'Phones', icon: 'Zap' },
    { id: 'links', label: 'Links', icon: 'Globe' },
    { id: 'prices', label: 'Prices', icon: 'Bookmark' },
    { id: 'headings', label: 'Headings', icon: 'FileText' },
    { id: 'tables', label: 'Tables', icon: 'Database' },
  ];

  return (
    <PanelContainer
      title="Content Extractor"
      iconName="Database"
      subtitle={selectedTable ? selectedTable.title : `Extracted ${data.length} ${category}`}
      headerActions={
        <div className="flex items-center gap-1">
          {selectedTable ? (
            <button
              onClick={() => setSelectedTable(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
              title="Back to tables"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => runExtraction()}
              title="Re-scan DOM"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <HyperlinkIcon name="RefreshCw" size={14} />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Category Pills (Hidden when inspecting a single table) */}
        {!selectedTable && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/25 border border-sky-400/40 text-white shadow-sm'
                      : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Input (when not inspecting table) */}
        {!selectedTable && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={`Filter ${data.length} ${category}...`}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-sky-400"
              />
            </div>

            {/* Special Combined Download Button for Images */}
            {category === 'images' && data.length > 0 && (
              <button
                onClick={handleDownloadAllImages}
                disabled={isDownloadingAll}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                title="Download all images to your downloads folder"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloadingAll ? 'animate-bounce' : ''}`} />
                <span>
                  {isDownloadingAll && downloadProgress
                    ? `${downloadProgress.current}/${downloadProgress.total}`
                    : `Download All (${data.length})`}
                </span>
              </button>
            )}
          </div>
        )}

        {/* --- DETAILED TABLE INSPECTOR VIEW --- */}
        {selectedTable ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div>
                <h4 className="text-xs font-bold text-white">{selectedTable.title}</h4>
                <p className="text-[10px] text-slate-400">
                  {selectedTable.colCount} columns • {selectedTable.rowCount} rows
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    const csv = extractorService.tableToCSV(selectedTable);
                    await navigator.clipboard.writeText(csv);
                    addToast('Table CSV copied to clipboard', 'success');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy CSV</span>
                </button>
                <button
                  onClick={() => {
                    const csv = extractorService.tableToCSV(selectedTable);
                    extractorService.download(csv, `${selectedTable.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, 'csv');
                    addToast('Table CSV downloaded', 'success');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-sky-500/30"
                >
                  <Download className="w-3 h-3" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Scrollable Formatted HTML Table */}
            <div className="max-h-[380px] overflow-auto rounded-xl border border-white/10 bg-black/30">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/15 text-slate-200">
                  <tr>
                    {selectedTable.headers.map((h, i) => (
                      <th key={i} className="p-2 font-semibold border-r border-white/10 last:border-r-0 whitespace-nowrap">
                        {h || `Col ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {selectedTable.rows.length === 0 ? (
                    <tr>
                      <td colSpan={selectedTable.headers.length || 1} className="p-4 text-center text-slate-500">
                        No rows found in this table
                      </td>
                    </tr>
                  ) : (
                    selectedTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.03]">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-white/5 last:border-r-0 max-w-xs truncate">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* --- CATEGORY LIST RESULTS VIEW --- */
          <div className="max-h-[400px] overflow-y-auto space-y-2 p-1.5 bg-white/[0.02] rounded-2xl border border-white/5">
            {filteredData.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No {category} found on this page.
              </div>
            ) : (
              filteredData.map((item, idx) => {
                if (category === 'tables') {
                  const table = item as ExtractedTable;
                  const colLen = table?.headers?.length ?? 0;
                  const rowLen = table?.rows?.length ?? 0;

                  return (
                    <div
                      key={table.id || idx}
                      onClick={() => setSelectedTable(table)}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400">
                          <TableIcon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {table.title || `Table #${idx + 1}`}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {colLen} columns • {rowLen} rows
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-white">
                        <span className="text-[10px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          View & Export
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                }

                if (category === 'images') {
                  const img = item as ExtractedImage;
                  const isDownloaded = downloadedImgUrls.has(img.src);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 text-xs text-slate-200 transition-all"
                    >
                      {/* Image Preview & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-xs truncate">
                              {img.filename}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono text-slate-300 uppercase shrink-0">
                              {img.format}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                            {img.width && img.height && (
                              <span>{img.width}×{img.height}px</span>
                            )}
                            <span className="truncate">{img.alt || img.src}</span>
                          </div>
                        </div>
                      </div>

                      {/* Download Separately & Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleCopyImageUrl(e, img.src)}
                          title="Copy Image URL"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={img.src}
                          target="_blank"
                          rel="noreferrer"
                          title="Open original in new tab"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => handleDownloadSingleImage(e, img)}
                          title="Download Image"
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                            isDownloaded
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {isDownloaded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }

                // Default entity renderers (emails, phones, links, prices, headings)
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs text-slate-200 transition-colors"
                  >
                    {category === 'emails' && (
                      <div className="flex flex-col">
                        <span className="font-mono text-sky-300 font-semibold">{item.email}</span>
                        {item.sourceContext && (
                          <span className="text-[10px] text-slate-400 mt-0.5">{item.sourceContext}</span>
                        )}
                      </div>
                    )}
                    {category === 'phoneNumbers' && (
                      <span className="font-mono text-emerald-300 font-semibold">{item.phone}</span>
                    )}
                    {category === 'links' && (
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-white truncate">{item.text}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-sky-400 hover:underline truncate mt-0.5"
                        >
                          {item.url}
                        </a>
                      </div>
                    )}
                    {category === 'prices' && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 font-mono text-sm">{item.price}</span>
                        <span className="text-[10px] text-slate-400">{item.currency}</span>
                      </div>
                    )}
                    {category === 'headings' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                          H{item.level}
                        </span>
                        <span className="text-white truncate">{item.text}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Global Export Buttons */}
        {!selectedTable && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <HyperlinkButton
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              icon="Copy"
              disabled={data.length === 0}
            >
              Copy
            </HyperlinkButton>

            <HyperlinkButton
              onClick={handleDownloadCsv}
              variant="secondary"
              size="sm"
              icon="Download"
              disabled={data.length === 0}
            >
              CSV
            </HyperlinkButton>

            <HyperlinkButton
              onClick={handleDownloadJson}
              variant="secondary"
              size="sm"
              icon="FileDown"
              disabled={data.length === 0}
            >
              JSON
            </HyperlinkButton>

            <HyperlinkButton
              onClick={handleSave}
              variant="primary"
              size="sm"
              icon="Bookmark"
              disabled={data.length === 0}
            >
              Save
            </HyperlinkButton>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
