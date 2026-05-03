import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1117] text-white">
      <Card className="w-full max-w-md mx-4 bg-[#131722] border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-white">404</h1>
          </div>
          <p className="text-sm text-white/60">{t("not_found")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
