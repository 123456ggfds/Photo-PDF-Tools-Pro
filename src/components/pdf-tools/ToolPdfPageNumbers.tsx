import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FileDigit, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bytesToBlobPart } from "@/lib/blob";

export function ToolPdfPageNumbers() {
  const { t } = useI18n();
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const onDrop = useCallback((accepted: File[]) => { const f = accepted[0]; if (!f) return; f.arrayBuffer().then(buf => { setFile(buf); setBytes(null); }); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false });
  const run = async () => { if (!file) return; setProcessing(true); try { const doc = await PDFDocument.load(file); const font = await doc.embedFont(StandardFonts.Helvetica); doc.getPages().forEach((p, i) => p.drawText(String(i + 1), { x: p.getWidth() - 36, y: 18, size: 10, font, color: rgb(0.8,0.8,0.8) })); const titleFont = await doc.embedFont(StandardFonts.HelveticaBold); doc.getPage(0).drawText("Numbered PDF", { x: 18, y: doc.getPage(0).getHeight() - 30, size: 14, font: titleFont, color: rgb(1,1,1) }); setBytes(await doc.save()); } finally { setProcessing(false); } };
  const download = () => { if (!bytes) return; const url = URL.createObjectURL(new Blob([bytesToBlobPart(bytes)], { type: "application/pdf" })); const a = document.createElement("a"); a.href = url; a.download = "numbered.pdf"; a.click(); URL.revokeObjectURL(url); };
  return <div className="flex flex-col gap-4 min-h-0"><div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer ${isDragActive ? "border-fuchsia-400 bg-fuchsia-500/10" : "border-white/15 bg-white/[0.02]"}`}><input {...getInputProps()} /><FileDigit className="w-8 h-8 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/50">{t("pdf_drop_hint")}</p></div><Button onClick={run} disabled={processing || !file} className="w-full rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white h-10">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_number_pages_action")}</Button>{bytes && <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10"><Download className="w-4 h-4" />{t("pdf_download_pdf")}</Button>}</div>;
}
