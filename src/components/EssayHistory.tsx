import { motion } from "framer-motion";
import { Clock, Trash2, Eye } from "lucide-react";
import type { EssayResult } from "@/lib/essayStore";
import { deleteEssay } from "@/lib/essayStore";

interface EssayHistoryProps {
  history: EssayResult[];
  onSelect: (essay: EssayResult) => void;
  onRefresh: () => void;
}

export default function EssayHistory({ history, onSelect, onRefresh }: EssayHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No essays improved yet</p>
        <p className="text-xs mt-1">Your improved essays will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((essay, i) => (
        <motion.div
          key={essay.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:shadow-card transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-card-foreground line-clamp-2">
              {essay.originalEssay.slice(0, 120)}...
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{essay.mode}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{essay.tone}</span>
              <span className="text-xs text-muted-foreground">
                {essay.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onSelect(essay)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => { deleteEssay(essay.id); onRefresh(); }}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive/60" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
