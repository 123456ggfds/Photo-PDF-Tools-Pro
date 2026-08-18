import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ToolWorkspace from "@/pages/tool-workspace";
import PdfHub from "@/pages/pdf-hub";
import PdfWorkspace from "@/pages/pdf-workspace";
import { I18nProvider } from "@/lib/i18n";

const queryClient = new QueryClient();
const routerHook = typeof window !== "undefined" && window.location.protocol === "file:" ? useHashLocation : undefined;
const routerBase = typeof window !== "undefined" && window.location.protocol === "file:" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pdf" component={PdfHub} />
      <Route path="/pdf/:pdfToolId" component={PdfWorkspace} />
      <Route path="/tool/:toolId" component={ToolWorkspace} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <div className="dark h-full min-h-0 overflow-hidden">
            <WouterRouter base={routerBase} hook={routerHook}>
              <Router />
            </WouterRouter>
            <Toaster />
          </div>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
