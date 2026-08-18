import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Languages, History } from "lucide-react";
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

  if (inlineMode) return langSwitcher;

  return (
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
              aria-controls="version-history-panel"
              className="inline-flex h-8 items-center gap-2 rounded-full border border-violet-300/40 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 px-3 text-xs font-extrabold text-white shadow-[0_0_0_1px_rgba(139,92,246,0.12)] hover:from-violet-500/30 hover:to-fuchsia-500/30"
            >
              <History className="size-3.5 text-violet-200" />
              {t("version_history")}
            </button>
            {historyOpen && (
              <div id="version-history-panel" role="dialog" aria-label={t("version_history")} className="absolute left-0 top-10 z-50 w-56 rounded-2xl border border-violet-400/20 bg-[#121522] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/75">
                  {t("version_history_title")}
                </div>
                <div className="mt-1.5 space-y-1">
                  {(
                    [
                      {
                        label: t("version_history_item_2640"),
                        current: true,
                      },
                      {
                        label: t("version_history_item_2630"),
                      },
                      {
                        label: t("version_history_item_2623"),
                      },
                      {
                        label: t("version_history_item_2622"),
                      },
                      {
                        label: t("version_history_item_2621"),
                      },
                      {
                        label: t("version_history_item_2620"),
                      },
                      {
                        label: t("version_history_item_2602"),
                      },
                      {
                        label: t("version_history_item_2601"),
                      },
                    ] as { label: string; current?: boolean }[]
                  ).map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs ${
                        item.current
                          ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 text-white ring-1 ring-violet-300/20"
                          : "bg-white/5 text-white/70"
                      }`}
                    >
                      <span className={item.current ? "font-semibold" : ""}>
                        {item.label}
                      </span>
                      {item.current && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-200">
                          {t("version_history_current")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">{langSwitcher}</div>
      </div>
    </header>
  );
}
