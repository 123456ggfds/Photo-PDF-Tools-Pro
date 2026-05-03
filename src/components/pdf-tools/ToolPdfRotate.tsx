import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import { RotateCcw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolPdfRotate() {
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
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const onDrop = useCallback((accepted: File[]) => { const f = accepted[0]; if (!f) return; f.arrayBuffer().then(buf => { setFile(buf); setBytes(null); }); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false });
  const run = async () => { if (!file) return; setProcessing(true); try { const doc = await PDFDocument.load(file); doc.getPages().forEach(p => p.setRotation(degrees(angle))); await addTopLeftTitle(doc, "Rotated PDF"); setBytes(await doc.save()); } finally { setProcessing(false); } };
  const download = () => { if (!bytes) return; const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const a = document.createElement("a"); a.href = url; a.download = "rotated.pdf"; a.click(); URL.revokeObjectURL(url); };
  return <div className="flex flex-col gap-4 min-h-0"><div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer ${isDragActive ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 bg-white/[0.02]"}`}><input {...getInputProps()} /><RotateCcw className="w-8 h-8 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/50">{t("pdf_drop_hint")}</p></div><div className="flex gap-2">{([90,180,270] as const).map(v => <button key={v} onClick={() => setAngle(v)} className={`flex-1 rounded-xl border py-2 text-sm ${angle===v ? "border-indigo-500/50 bg-indigo-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50"}`}>{v}°</button>)}</div><Button onClick={run} disabled={processing || !file} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white h-10">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_rotate_action")}</Button>{bytes && <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10"><Download className="w-4 h-4" />{t("pdf_download_pdf")}</Button>}</div>;
}