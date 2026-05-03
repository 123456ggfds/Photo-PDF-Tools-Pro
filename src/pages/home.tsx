import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/navbar";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Zap,
  Lock,
  Grid2X2,
  Minimize,
  Scaling,
  Crop,
  Repeat,
  RefreshCcw,
  SlidersHorizontal,
  Stamp,
  Wand2,
  Scissors,
  BadgeCheck,
  Eraser,
  FileText,
} from "lucide-react";

const tools = [
  {
    id: "merge",
    icon: Grid2X2,
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10",
    titleKey: "tool_merge",
    descKey: "tool_merge_desc",
  },
  {
    id: "compress",
    icon: Minimize,
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10",
    titleKey: "tool_compress",
    descKey: "tool_compress_desc",
  },
  {
    id: "resize",
    icon: Scaling,
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-500/10",
    titleKey: "tool_resize",
    descKey: "tool_resize_desc",
  },
  {
    id: "crop",
    icon: Crop,
    color: "from-green-500 to-emerald-400",
    bg: "bg-green-500/10",
    titleKey: "tool_crop",
    descKey: "tool_crop_desc",
  },
  {
    id: "convert",
    icon: Repeat,
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-500/10",
    titleKey: "tool_convert",
    descKey: "tool_convert_desc",
  },
  {
    id: "rotate",
    icon: RefreshCcw,
    color: "from-yellow-400 to-orange-500",
    bg: "bg-yellow-500/10",
    titleKey: "tool_rotate",
    descKey: "tool_rotate_desc",
  },
  {
    id: "adjustments",
    icon: SlidersHorizontal,
    color: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/10",
    titleKey: "tool_adjustments",
    descKey: "tool_adjustments_desc",
  },
  {
    id: "watermark",
    icon: Stamp,
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-500/10",
    titleKey: "tool_watermark",
    descKey: "tool_watermark_desc",
  },
  {
    id: "auto",
    icon: Wand2,
    color: "from-violet-600 to-fuchsia-500",
    bg: "bg-violet-500/10",
    titleKey: "tool_auto",
    descKey: "tool_auto_desc",
  },
  {
    id: "batch-crop",
    icon: Scissors,
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/10",
    titleKey: "tool_batch_crop",
    descKey: "tool_batch_crop_desc",
  },
  {
    id: "exif-fix",
    icon: BadgeCheck,
    color: "from-sky-500 to-blue-500",
    bg: "bg-sky-500/10",
    titleKey: "tool_exif_fix",
    descKey: "tool_exif_fix_desc",
  },
  {
    id: "bg-remove",
    icon: Eraser,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    titleKey: "tool_bg_remove",
    descKey: "tool_bg_remove_desc",
  },
];

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Hero */}
        <section className="py-8 md:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center shadow-lg shrink-0 ring-1 ring-white/10">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.25em] text-white/35 mb-2">
                {t("app_name")}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-white">
                {t("hero_title_prefix")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400">
                  {t("hero_title_accent")}
                </span>
              </h1>
              <p className="text-white/55 text-sm md:text-base max-w-xl leading-relaxed">
                {t("tagline")} — {t("hero_footer_primary")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 text-xs text-white/45 border border-white/10 rounded-full px-3 py-1.5 bg-white/[0.03]">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> {t("hero_fast")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/45 border border-white/10 rounded-full px-3 py-1.5 bg-white/[0.03]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />{" "}
              {t("hero_private")}
            </div>
          </div>
        </section>

        <section className="py-5 md:py-6 shrink-0">
          <Link
            href="/pdf"
            className="block rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-5 md:p-6 hover:border-violet-400/40 transition-colors min-h-[88px] shadow-[0_10px_40px_rgba(139,92,246,0.08)]"
          >
            <div className="flex items-center gap-4 min-h-[56px]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-violet-200/70">
                    PDF
                  </span>
                  <span className="text-[11px] text-white/35">
                    {t("hero_private")}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {t("tool_pdf")}
                </h2>
                <p className="text-sm text-white/55">{t("pdf_hub_desc")}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/40" />
            </div>
          </Link>
        </section>

        {/* Image tools grid */}
        <section className="py-5 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={`/tool/${tool.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    className="group flex items-start gap-3.5 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 cursor-pointer min-h-[96px] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {t(tool.titleKey as any)}
                        </h3>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-white/45 leading-relaxed line-clamp-2">
                        {t(tool.descKey as any)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-5">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© 2026 Photo Merge Pro — {t("hero_footer_primary")}</span>
          <span className="flex items-center gap-2">
            {t("hero_footer_secondary")}
            <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-1 text-[11px] font-bold text-violet-200">
              {t("version_label")} 26.2.0
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
