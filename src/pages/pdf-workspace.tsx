import { useParams, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Lock, Zap, FilePlus2, Scissors, Minimize2, ImageDown, ImageUp, Shield, RotateCcw, ListOrdered, FileDigit, FileSymlink } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ToolPdfMerge } from "@/components/pdf-tools/ToolPdfMerge";
import { ToolPdfSplit } from "@/components/pdf-tools/ToolPdfSplit";
import { ToolPdfCompress } from "@/components/pdf-tools/ToolPdfCompress";
import { ToolPdfToImage } from "@/components/pdf-tools/ToolPdfToImage";
import { ToolImageToPdf } from "@/components/pdf-tools/ToolImageToPdf";
import { ToolPdfProtect } from "@/components/pdf-tools/ToolPdfProtect";
import { ToolPdfRotate } from "@/components/pdf-tools/ToolPdfRotate";
import { ToolPdfPageNumbers } from "@/components/pdf-tools/ToolPdfPageNumbers";
import { ToolPdfExtractPages } from "@/components/pdf-tools/ToolPdfExtractPages";
import { ToolPdfReorder } from "@/components/pdf-tools/ToolPdfReorder";

const TOOL_META: Record<string, { titleKey: string; descKey: string; icon: any; color: string }> = {
  "pdf-merge":    { titleKey: "pdf_merge",     descKey: "pdf_merge_desc",     icon: FilePlus2, color: "from-blue-500 to-cyan-400" },
  "pdf-split":    { titleKey: "pdf_split",     descKey: "pdf_split_desc",     icon: Scissors,  color: "from-violet-500 to-purple-400" },
  "pdf-compress": { titleKey: "pdf_compress",  descKey: "pdf_compress_desc",  icon: Minimize2, color: "from-emerald-500 to-teal-400" },
  "pdf-to-image": { titleKey: "pdf_to_image",  descKey: "pdf_to_image_desc",  icon: ImageDown, color: "from-orange-500 to-amber-400" },
  "image-to-pdf": { titleKey: "image_to_pdf",  descKey: "image_to_pdf_desc",  icon: ImageUp,   color: "from-pink-500 to-rose-400" },
  "pdf-protect":  { titleKey: "pdf_protect",   descKey: "pdf_protect_desc",   icon: Shield,    color: "from-slate-500 to-slate-400" },
  "pdf-rotate":   { titleKey: "pdf_rotate",    descKey: "pdf_rotate_desc",    icon: RotateCcw, color: "from-indigo-500 to-cyan-400" },
  "pdf-pages":    { titleKey: "pdf_pages_tool",descKey: "pdf_pages_tool_desc",icon: ListOrdered,color: "from-fuchsia-500 to-pink-400" },
  "pdf-extract":  { titleKey: "pdf_extract",   descKey: "pdf_extract_desc",   icon: FileDigit, color: "from-amber-500 to-orange-400" },
  "pdf-reorder":  { titleKey: "pdf_reorder",   descKey: "pdf_reorder_desc",   icon: FileSymlink,color: "from-emerald-500 to-teal-400" },
};

export default function PdfWorkspace() {
  const { pdfToolId } = useParams<{ pdfToolId?: string }>();
  const { t } = useI18n();

  const meta = pdfToolId ? TOOL_META[pdfToolId] : null;
  const ToolIcon = meta?.icon ?? FilePlus2;
  const toolColor = meta?.color ?? "from-red-500 to-rose-400";
  const toolName = meta ? t(meta.titleKey as any) : pdfToolId;

  const renderTool = () => {
    switch (pdfToolId) {
      case "pdf-merge":    return <ToolPdfMerge />;
      case "pdf-split":    return <ToolPdfSplit />;
      case "pdf-compress": return <ToolPdfCompress />;
      case "pdf-to-image": return <ToolPdfToImage />;
      case "image-to-pdf": return <ToolImageToPdf />;
      case "pdf-protect": return <ToolPdfProtect />;
      case "pdf-rotate": return <ToolPdfRotate />;
      case "pdf-pages": return <ToolPdfPageNumbers />;
      case "pdf-extract": return <ToolPdfExtractPages />;
      case "pdf-reorder": return <ToolPdfReorder />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 py-12">
          <p className="text-sm">{t("not_found")}</p>
        </div>
      );
    }
  };

  return (
    <div className="h-screen bg-[#0f1117] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-white/[0.07] bg-[#0f1117]/90 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/pdf"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("tool_pdf")}
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${toolColor} flex items-center justify-center shrink-0 ring-1 ring-white/10`}>
              <ToolIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-base truncate text-white">{toolName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 text-xs text-white/35 mr-2">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-yellow-400/70" /> {t("workspace_local_only")}</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/70" /> {t("workspace_private")}</span>
          </div>
          <Navbar inlineMode />
        </div>
      </header>

      {/* Body — sidebar only (PDF tools don't have a canvas preview) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside className="w-full max-w-[430px] border-r border-white/[0.07] bg-[#12151e] overflow-hidden flex flex-col min-h-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]">
          {/* Tool header */}
          <div className="px-4 py-4 border-b border-white/[0.07] shrink-0 bg-white/[0.015]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toolColor} flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/10`}>
                <ToolIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{toolName}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{meta ? t(meta.descKey as any) : ""}</div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            {renderTool()}
          </div>
        </aside>

        {/* Right: info / hint area */}
        <main className="flex-1 flex items-center justify-center bg-[#0a0c10] p-8 overflow-hidden min-h-0">
          <div className="text-center max-w-sm">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${toolColor} flex items-center justify-center mx-auto mb-4 shadow-xl ring-1 ring-white/10`}>
              <ToolIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{toolName}</h2>
            <p className="text-sm text-white/40 leading-relaxed">{meta ? t(meta.descKey as any) : ""}</p>
            <div className="mt-6 flex flex-col gap-2 text-xs text-white/25">
              <span className="flex items-center justify-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/50" /> {t("hero_footer_primary")}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
