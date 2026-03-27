import { motion } from "framer-motion";
import { Copy, Download, ArrowRight, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EssayResult } from "@/lib/essayStore";
import { toast } from "sonner";

interface EssayComparisonProps {
  result: EssayResult;
}

export default function EssayComparison({ result }: EssayComparisonProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.improvedEssay);
    toast.success("Improved essay copied!");
  };

  const downloadText = () => {
    const blob = new Blob([result.improvedEssay], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved-essay.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeTypeColors: Record<string, string> = {
    grammar: "bg-destructive/10 text-destructive",
    clarity: "bg-primary/10 text-primary",
    vocabulary: "bg-accent/20 text-accent-foreground",
    structure: "bg-secondary text-secondary-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Summary */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-sm text-foreground">{result.summary}</p>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Original
          </h3>
          <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">{result.originalEssay}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Improved
            </h3>
            <div className="flex gap-1">
              <button onClick={copyToClipboard} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={downloadText} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">{result.improvedEssay}</p>
        </div>
      </div>

      {/* Word Suggestions */}
      {result.wordSuggestions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">📝 Word Suggestions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {result.wordSuggestions.map((ws, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 text-sm">
                <span className="text-muted-foreground line-through">{ws.original}</span>
                <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-medium text-primary">{ws.suggested}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes */}
      {result.changes.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">🔄 Changes Made</h3>
          <div className="space-y-3">
            {result.changes.map((change, i) => (
              <div key={i} className="p-3 rounded-md bg-secondary/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${changeTypeColors[change.type] || ""}`}>
                    {change.type}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="essay-removed px-1.5 py-0.5 rounded line-through">{change.original}</span>
                  <ArrowRight className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                  <span className="essay-improved px-1.5 py-0.5 rounded font-medium">{change.improved}</span>
                </div>
                {change.explanation && (
                  <p className="text-xs text-muted-foreground mt-2 italic">💡 {change.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={copyToClipboard} variant="outline" className="gap-2">
          <Copy className="w-4 h-4" /> Copy Improved Essay
        </Button>
        <Button onClick={downloadText} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Download as Text
        </Button>
      </div>
    </motion.div>
  );
}
