import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument } from "pdf-lib";
import { FileSymlink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bytesToBlobPart } from "@/lib/blob";

export function ToolPdfExtractPages() {

  const { t } = useI18n();
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState("1");
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const onDrop = useCallback((accepted: File[]) => { const f = accepted[0]; if (!f) return; f.arrayBuffer().then(buf => { setFile(buf); setBytes(null); }); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false });
  const run = async () => { if (!file) return; setProcessing(true); try { const src = await PDFDocument.load(file); const out = await PDFDocument.create(); const idx = pages.split(",").map(s => Number(s.trim()) - 1).filter(n => n >= 0 && n < src.getPageCount()); const copied = await out.copyPages(src, idx); copied.forEach(p => out.addPage(p)); if (out.getPageCount() > 0) setBytes(await out.save()); } finally { setProcessing(false); } };
  const download = () => { if (!bytes) return; const url = URL.createObjectURL(new Blob([bytesToBlobPart(bytes)], { type: "application/pdf" })); const a = document.createElement("a"); a.href = url; a.download = "extracted.pdf"; a.click(); URL.revokeObjectURL(url); };
  return <div className="flex flex-col gap-4 min-h-0"><div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer ${isDragActive ? "border-amber-400 bg-amber-500/10" : "border-white/15 bg-white/[0.02]"}`}><input {...getInputProps()} /><FileSymlink className="w-8 h-8 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/50">{t("pdf_drop_hint")}</p></div><input value={pages} onChange={e => setPages(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 text-white px-3 py-2.5" placeholder="1,3,5" /><Button onClick={run} disabled={processing || !file} className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white h-10">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_extract_action")}</Button>{bytes && <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10"><Download className="w-4 h-4" />{t("pdf_download_pdf")}</Button>}</div>;
}
