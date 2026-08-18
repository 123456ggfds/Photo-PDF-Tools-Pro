import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Languages, History, X } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANG_LABELS: Record<string, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
};

interface NavbarProps {
  inlineMode?: boolean;
}

export function Navbar({ inlineMode = false }: NavbarProps) {
  const { lang, setLang, t } = useI18n();
  const [location] = useLocation();
  const showHomeButton = location !== "/";
  const [historyOpen, setHistoryOpen] = useState(false);

  const langSwitcher = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="button-language"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-full gap-1.5"
        >
          <Languages className="size-3.5" />
          {LANG_LABELS[lang]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1c1f2a] border-white/10 text-white min-w-[120px]"
      >
        {(["en", "zh", "ja"] as const).map((l) => (
          <DropdownMenuItem
            key={l}
            data-testid={`lang-${l}`}
            onClick={() => setLang(l)}
            className={`cursor-pointer focus:bg-white/10 focus:text-white text-sm ${lang === l ? "text-blue-400 font-medium" : "text-white/70"}`}
          >
            {l === "en" ? "English" : l === "zh" ? "繁體中文" : "日本語"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const versionHistoryDialog = historyOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setHistoryOpen(false);
      }}
    >
      <section
        id="version-history-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-violet-300/25 bg-[#121522] shadow-[0_28px_100px_rgba(0,0,0,0.62)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 shadow-lg ring-1 ring-white/15">
              <History className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="version-history-title" className="text-base font-extrabold text-white">
                {t("version_history")}
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                {t("version_label")} 26.4.0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            aria-label={t("version_history_close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {(
            [
              { label: t("version_history_item_2640"), current: true },
              { label: t("version_history_item_2630") },
              { label: t("version_history_item_2623") },
            ] as { label: string; current?: boolean }[]
          ).map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                item.current
                  ? "border-violet-300/30 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]"
                  : "border-white/[0.07] bg-white/[0.035] text-white/65"
              }`}
            >
              <span className={item.current ? "font-bold" : "font-medium"}>{item.label}</span>
              {item.current && (
                <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100">
                  {t("version_history_current")}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.08] px-5 py-3 text-center text-[11px] text-white/35">
          {t("hero_footer_secondary")}
        </div>
      </section>
    </div>
  ) : null;

  if (inlineMode) return langSwitcher;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#0f1117]/90 backdrop-blur-xl">
        <div className="container flex h-12 items-center justify-between px-3 sm:px-4 md:px-6">
          {showHomeButton ? (
            <Link
              href="/"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              <ChevronLeft className="size-3.5" />
              {t("back_to_home")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={historyOpen}
              aria-controls="version-history-panel"
              className="inline-flex h-8 items-center gap-2 rounded-full border border-violet-300/40 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 px-3 text-xs font-extrabold text-white shadow-[0_0_0_1px_rgba(139,92,246,0.12)] hover:from-violet-500/30 hover:to-fuchsia-500/30"
            >
              <History className="size-3.5 text-violet-200" />
              {t("version_history")}
            </button>
          )}
          <div className="flex items-center gap-1">{langSwitcher}</div>
        </div>
      </header>
      {versionHistoryDialog}
    </>
  );
}
