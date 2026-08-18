import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument } from "pdf-lib";
import { FileSymlink, Download, Loader2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bytesToBlobPart } from "@/lib/blob";

type PdfSource = { data: ArrayBuffer; name: string; pageCount: number };

export function ToolPdfReorder() {
  const { t } = useI18n();
  const [source, setSource] = useState<PdfSource | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (accepted: File[]) => {
    const selected = accepted[0];
    if (!selected) return;
    try {
      const data = await selected.arrayBuffer();
      const document = await PDFDocument.load(data, { ignoreEncryption: true });
      const pageCount = document.getPageCount();
      setSource({ data, name: selected.name, pageCount });
      setOrder(Array.from({ length: pageCount }, (_, index) => index));
      setBytes(null);
      setError("");
    } catch {
      setSource(null);
      setOrder([]);
      setBytes(null);
      setError(t("pdf_load_error"));
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const movePage = (position: number, direction: -1 | 1) => {
    const nextPosition = position + direction;
    if (nextPosition < 0 || nextPosition >= order.length) return;
    setOrder(current => {
      const next = [...current];
      [next[position], next[nextPosition]] = [next[nextPosition], next[position]];
      return next;
    });
    setBytes(null);
  };

  const reverseOrder = () => {
    setOrder(current => [...current].reverse());
    setBytes(null);
  };

  const run = async () => {
    if (!source || order.length !== source.pageCount) return;
    setProcessing(true);
    setError("");
    try {
      const input = await PDFDocument.load(source.data, { ignoreEncryption: true });
      const output = await PDFDocument.create();
      const pages = await output.copyPages(input, order);
      pages.forEach(page => output.addPage(page));
      setBytes(await output.save({ useObjectStreams: true }));
    } catch {
      setError(t("pdf_processing_error"));
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!bytes || !source) return;
    const url = URL.createObjectURL(new Blob([bytesToBlobPart(bytes)], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "reordered-" + source.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"}`}>
        <input {...getInputProps()} />
        <FileSymlink className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{source?.name || t("pdf_drop_hint")}</p>
        <p className="text-xs text-white/25 mt-1">{source ? source.pageCount + " " + t("pdf_pages") : t("pdf_only")}</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      {source && <>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-white/45 leading-relaxed">{t("pdf_reorder_hint")}</p>
          <Button type="button" onClick={reverseOrder} variant="outline" size="sm" className="h-8 shrink-0 border-white/15 bg-white/5 text-xs">
            <RotateCcw className="mr-1.5 w-3.5 h-3.5" />
            {t("pdf_reverse_order")}
          </Button>
        </div>

        <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/10">
          {order.map((sourceIndex, position) => <div key={sourceIndex} className="flex items-center gap-3 bg-white/[0.025] px-3 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">{position + 1}</span>
            <span className="flex-1 text-sm text-white/75">{t("pdf_page_label")} {sourceIndex + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => movePage(position, -1)} disabled={position === 0} aria-label={t("pdf_move_up")} className="rounded-md p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><ChevronUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => movePage(position, 1)} disabled={position === order.length - 1} aria-label={t("pdf_move_down")} className="rounded-md p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><ChevronDown className="w-4 h-4" /></button>
            </div>
          </div>)}
        </div>

        <Button onClick={run} disabled={processing} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-10 font-semibold">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("processing")}</> : t("pdf_reorder_action")}
        </Button>
      </>}

      {bytes && <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10 font-bold shadow-lg"><Download className="w-4 h-4 mr-2" />{t("pdf_download_pdf")}</Button>}
    </div>
  );
}
