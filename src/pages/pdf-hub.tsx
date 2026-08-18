import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/navbar";
import { motion } from "framer-motion";
import {
  FilePlus2, Scissors, Minimize2, ImageDown, ImageUp,
  FileText, ChevronLeft, Lock, Zap, Shield, RotateCcw, FileDigit, FileSymlink, ListOrdered
} from "lucide-react";

const PDF_TOOLS = [
  {
    id: "pdf-merge",
    icon: FilePlus2,
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    titleKey: "pdf_merge",
    descKey: "pdf_merge_desc",
  },
  {
    id: "pdf-split",
    icon: Scissors,
    color: "from-violet-500 to-purple-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    titleKey: "pdf_split",
    descKey: "pdf_split_desc",
  },
  {
    id: "pdf-compress",
    icon: Minimize2,
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    titleKey: "pdf_compress",
    descKey: "pdf_compress_desc",
  },
  {
    id: "pdf-to-image",
    icon: ImageDown,
    color: "from-orange-500 to-amber-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    titleKey: "pdf_to_image",
    descKey: "pdf_to_image_desc",
  },
  {
    id: "image-to-pdf",
    icon: ImageUp,
    color: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    titleKey: "image_to_pdf",
    descKey: "image_to_pdf_desc",
  },
  {
    id: "pdf-protect",
    icon: Shield,
    color: "from-slate-500 to-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    titleKey: "pdf_protect",
    descKey: "pdf_protect_desc",
  },
  {
    id: "pdf-rotate",
    icon: RotateCcw,
    color: "from-indigo-500 to-cyan-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    titleKey: "pdf_rotate",
    descKey: "pdf_rotate_desc",
  },
  {
    id: "pdf-pages",
    icon: ListOrdered,
    color: "from-fuchsia-500 to-pink-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
    titleKey: "pdf_pages_tool",
    descKey: "pdf_pages_tool_desc",
  },
  {
    id: "pdf-extract",
    icon: FileDigit,
    color: "from-amber-500 to-orange-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    titleKey: "pdf_extract",
    descKey: "pdf_extract_desc",
  },
  {
    id: "pdf-reorder",
    icon: FileSymlink,
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    titleKey: "pdf_reorder",
    descKey: "pdf_reorder_desc",
  },
];

export default function PdfHub() {
  const { t } = useI18n();

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#0f1117] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 flex flex-col">
        <section className="shrink-0 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg shrink-0 ring-1 ring-white/10">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="hidden md:flex items-center gap-2 mb-1 text-xs">
                <Link href="/" className="text-white/40 hover:text-white/70 transition-colors">
                  {t("app_name")}
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/60">{t("tool_pdf")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {t("tool_pdf")}
              </h1>
              <p className="mt-0.5 text-xs md:text-sm text-white/55 leading-relaxed line-clamp-1 md:line-clamp-none">
                {t("pdf_hub_desc")}
              </p>
            </div>
          </div>
          <div className="hidden min-[760px]:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-white/45 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.03]">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> {t("hero_fast")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/45 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.03]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> {t("hero_private")}
            </div>
          </div>
        </section>

        <section className="flex-1 min-h-0 py-3 md:py-4" aria-label={t("tool_pdf")}>
          <div className="h-full min-h-0 grid grid-cols-1 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1580px]:grid-cols-5 auto-rows-fr gap-2.5 md:gap-3">
            {PDF_TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              const title = t(tool.titleKey as any);
              return (
                <Link key={tool.id} href={`/pdf/${tool.id}`} aria-label={title} className="min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.25 }}
                    className={`group h-full min-h-0 flex items-center gap-3 p-3 rounded-2xl border ${tool.border} ${tool.bg} hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="min-w-0 flex-1 text-sm font-bold text-white truncate">{title}</h3>
                        <ChevronLeft className="w-4 h-4 rotate-180 text-white/25 group-hover:text-white/70 transition-colors shrink-0" />
                      </div>
                      <p className="mt-1 text-xs text-white/50 leading-relaxed line-clamp-1 min-[980px]:line-clamp-2">
                        {t(tool.descKey as any)}
                      </p>
                      <div className="hidden min-[980px]:block mt-1.5 text-[11px] text-white/30 group-hover:text-white/60 transition-colors">
                        {t("pdf_open_tool")}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-white/[0.07] py-2.5 md:py-3">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] md:text-xs text-white/30">
          <span>© 2026 Photo Merge Pro — {t("hero_footer_primary")}</span>
          <span>{t("hero_footer_secondary")}</span>
        </div>
      </footer>
    </div>
  );
}
