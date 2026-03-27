import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, PenTool, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import EssayInput from "@/components/EssayInput";
import EssayComparison from "@/components/EssayComparison";
import EssayHistory from "@/components/EssayHistory";
import { saveEssay, getHistory, type EssayResult } from "@/lib/essayStore";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ThemeProvider";

type Tab = "editor" | "history";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EssayResult | null>(null);
  const [history, setHistory] = useState<EssayResult[]>(() => getHistory());
  const { theme, toggleTheme } = useTheme();

  const handleImprove = useCallback(async (essay: string, mode: string, tone: string, explainChanges: boolean, model: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("improve-essay", {
        body: { essay, mode, tone, explainChanges, model },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const essayResult: EssayResult = {
        id: crypto.randomUUID(),
        originalEssay: essay,
        improvedEssay: data.improvedEssay,
        mode,
        tone,
        wordSuggestions: data.wordSuggestions || [],
        changes: data.changes || [],
        summary: data.summary || "",
        createdAt: new Date(),
      };

      setResult(essayResult);
      saveEssay(essayResult);
      setHistory(getHistory());
      toast.success("Essay improved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to improve essay. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectHistory = (essay: EssayResult) => {
    setResult(essay);
    setActiveTab("editor");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <PenTool className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Essay Improver</h1>
              <p className="text-xs text-muted-foreground">AI-powered writing assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Tabs */}
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setActiveTab("editor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === "editor"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Editor
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-3.5 h-3.5" /> History
                {history.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <EssayInput onImprove={handleImprove} isLoading={isLoading} />

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="w-12 h-12 rounded-full border-3 border-primary/20 border-t-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground animate-pulse-soft">
                    Analyzing and improving your essay...
                  </p>
                </motion.div>
              )}

              {result && !isLoading && <EssayComparison result={result} />}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EssayHistory
                history={history}
                onSelect={handleSelectHistory}
                onRefresh={() => setHistory(getHistory())}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
