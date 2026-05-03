import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FileSymlink, GripVertical, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolPdfReorder() {
  const addTopLeftTitle = async (doc: PDFDocument, title: string) => {
    const page = doc.getPage(0);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, { x: 18, y: page.getHeight() - 30, size: 14, font, color: rgb(1, 1, 1) });
  };

  const { t } = useI18n();
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const onDrop = useCallback((accepted: File[]) => { const f = accepted[0]; if (!f) return; f.arrayBuffer().then(buf => { setFile(buf); setBytes(null); }); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false });
  const run = async () => { if (!file) return; setProcessing(true); try { const src = await PDFDocument.load(file); const idx = order.length ? order : src.getPageIndices().reverse(); const out = await PDFDocument.create(); const pages = await out.copyPages(src, idx); pages.forEach(p => out.addPage(p)); if (out.getPageCount() > 0) await addTopLeftTitle(out, "Reordered PDF"); setBytes(await out.save()); } finally { setProcessing(false); } };
  const download = () => { if (!bytes) return; const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const a = document.createElement("a"); a.href = url; a.download = "reordered.pdf"; a.click(); URL.revokeObjectURL(url); };
  return <div className="flex flex-col gap-4 min-h-0"><div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer ${isDragActive ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/[0.02]"}`}><input {...getInputProps()} /><FileSymlink className="w-8 h-8 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/50">{t("pdf_drop_hint")}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/35 flex items-center gap-2"><GripVertical className="w-4 h-4" />{t("pdf_reorder_auto")}</div><Button onClick={run} disabled={processing || !file} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-10">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_reorder_action")}</Button>{bytes && <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10"><Download className="w-4 h-4" />{t("pdf_download_pdf")}</Button>}</div>;
}