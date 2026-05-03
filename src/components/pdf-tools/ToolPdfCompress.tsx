import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Minimize2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolPdfCompress() {
  const addTopLeftTitle = async (doc: PDFDocument, title: string) => {
    const page = doc.getPage(0);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, {
      x: 18,
      y: page.getHeight() - 30,
      size: 14,
      font,
      color: rgb(1, 1, 1),
    });
  };

  const { t } = useI18n();
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; size: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; originalSize: number; newSize: number } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    f.arrayBuffer().then(buf => {
      setFile({ name: f.name, data: buf, size: f.size });
      setResult(null);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const srcDoc = await PDFDocument.load(file.data, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach(p => newDoc.addPage(p));
      if (newDoc.getPageCount() > 0) await addTopLeftTitle(newDoc, "Compressed PDF");
      const bytes = await newDoc.save({ useObjectStreams: true, addDefaultPage: false });
      setResult({ bytes, originalSize: file.size, newSize: bytes.byteLength });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed-${file?.name ?? "output.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  const pct = result ? Math.round((1 - result.newSize / result.originalSize) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        <input {...getInputProps()} />
        <Minimize2 className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{t("pdf_drop_hint")}</p>
        <p className="text-xs text-white/25 mt-1">{t("pdf_only")}</p>
      </div>

      {file && (
        <>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{fmt(file.size)}</p>
          </div>

          <Button
            onClick={compress}
            disabled={processing}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 gap-2"
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_compress_action")}
          </Button>
        </>
      )}

      {result && (
        <>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">{t("pdf_compress_result")}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-white">{fmt(result.originalSize)}</p>
                <p className="text-xs text-white/40">{t("pdf_original_size")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-300">{pct > 0 ? `-${pct}%` : "0%"}</p>
                <p className="text-xs text-white/40">{t("pdf_saved")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{fmt(result.newSize)}</p>
                <p className="text-xs text-white/40">{t("pdf_new_size")}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={download}
            className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-semibold h-10 gap-2"
          >
            <Download className="w-4 h-4" />
            {t("pdf_download_compressed")}
          </Button>
        </>
      )}
    </div>
  );
}
