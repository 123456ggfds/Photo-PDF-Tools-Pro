import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument } from "pdf-lib";
import { Scissors, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplitFile { name: string; bytes: Uint8Array; pages: string }

export function ToolPdfSplit() {
  const { t } = useI18n();
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; pageCount: number } | null>(null);
  const [mode, setMode] = useState<"each" | "range">("each");
  const [rangeInput, setRangeInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<SplitFile[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    f.arrayBuffer().then(async buf => {
      const doc = await PDFDocument.load(buf);
      setFile({ name: f.name, data: buf, pageCount: doc.getPageCount() });
      setResults([]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const parseRanges = (input: string, total: number): number[][] => {
    const parts = input.split(",").map(s => s.trim()).filter(Boolean);
    const result: number[][] = [];
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        const start = Math.max(1, a);
        const end = Math.min(total, b);
        if (start <= end) result.push(Array.from({ length: end - start + 1 }, (_, i) => start + i - 1));
      } else {
        const p = Number(part);
        if (p >= 1 && p <= total) result.push([p - 1]);
      }
    }
    return result;
  };

  const split = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const srcDoc = await PDFDocument.load(file.data);
      const total = srcDoc.getPageCount();
      const outputs: SplitFile[] = [];

      if (mode === "each") {
        for (let i = 0; i < total; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          outputs.push({ name: `page-${i + 1}.pdf`, bytes, pages: `${i + 1}` });
        }
      } else {
        const groups = parseRanges(rangeInput, total);
        for (const group of groups) {
          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, group);
          pages.forEach(p => newDoc.addPage(p));
          const label = group.length === 1 ? `${group[0] + 1}` : `${group[0] + 1}-${group[group.length - 1] + 1}`;
          const bytes = await newDoc.save();
          outputs.push({ name: `pages-${label}.pdf`, bytes, pages: label });
        }
      }
      setResults(outputs);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadOne = (sf: SplitFile) => {
    const blob = new Blob([new Uint8Array(sf.bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sf.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => results.forEach(downloadOne);

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${isDragActive ? "border-violet-400 bg-violet-500/10" : "border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        <input {...getInputProps()} />
        <Scissors className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{t("pdf_drop_hint")}</p>
        <p className="text-xs text-white/25 mt-1">{t("pdf_only")}</p>
      </div>

      {file && (
        <>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{file.pageCount} {t("pdf_pages")}</p>
          </div>

          {/* Mode */}
          <div className="flex gap-2">
            {(["each", "range"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl border text-sm py-2 font-medium transition-colors ${mode === m ? "border-violet-500/50 bg-violet-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}
              >
                {t(m === "each" ? "pdf_split_each_page" : "pdf_split_by_range")}
              </button>
            ))}
          </div>

          {mode === "range" && (
            <div>
              <label className="text-xs text-white/40 uppercase tracking-[0.15em] block mb-1.5">{t("pdf_range_hint")}</label>
              <input
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder="1-3, 5, 7-9"
                className="w-full rounded-xl border border-white/15 bg-white/5 text-white text-sm px-3 py-2.5 outline-none focus:border-violet-400/50 placeholder-white/25"
              />
            </div>
          )}

          <Button
            onClick={split}
            disabled={processing || (mode === "range" && !rangeInput.trim())}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold h-10 gap-2"
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_split_action")}
          </Button>
        </>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 uppercase tracking-[0.15em]">{t("pdf_split_results")} ({results.length})</span>
            <button onClick={downloadAll} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">{t("pdf_download_all")}</button>
          </div>
          <div className="max-h-[220px] overflow-auto pr-1 flex flex-col gap-2">
          {results.map((sf, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{sf.name}</p>
                <p className="text-xs text-white/35">{t("pdf_pages")} {sf.pages}</p>
              </div>
              <button onClick={() => downloadOne(sf)} className="text-white/40 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
