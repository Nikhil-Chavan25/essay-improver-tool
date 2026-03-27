import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Wand2, Mic, MicOff, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraScanner from "@/components/CameraScanner";

interface EssayInputProps {
  onImprove: (essay: string, mode: string, tone: string, explainChanges: boolean, model: string) => void;
  isLoading: boolean;
}

const modes = [
  { value: "academic", label: "Academic", icon: "🎓" },
  { value: "formal", label: "Formal", icon: "💼" },
  { value: "creative", label: "Creative", icon: "🎨" },
];

const tones = [
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "professional", label: "Professional", icon: "👔" },
  { value: "persuasive", label: "Persuasive", icon: "🎯" },
];

const models = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Fast & balanced" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Best quality" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini Flash Lite", desc: "Fastest" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Strong reasoning" },
  { value: "openai/gpt-5", label: "GPT-5", desc: "Most powerful" },
];

export default function EssayInput({ onImprove, isLoading }: EssayInputProps) {
  const [essay, setEssay] = useState("");
  const [mode, setMode] = useState("academic");
  const [tone, setTone] = useState("professional");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [explainChanges, setExplainChanges] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const recognitionRef = useRef<any>(null);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const charCount = essay.length;
  const selectedModel = models.find(m => m.value === model)!;

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setEssay(prev => prev + transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const hasSpeechRecognition = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Textarea */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Your Essay</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>
        <textarea
          value={essay}
          onChange={e => setEssay(e.target.value)}
          placeholder="Paste or type your essay here, or scan a document..."
          className="w-full min-h-[280px] p-5 rounded-lg border border-border bg-card text-card-foreground text-[15px] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring transition-shadow font-sans placeholder:text-muted-foreground/60"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {hasSpeechRecognition && (
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-full transition-colors ${
                isListening ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Camera Scanner */}
      <div className="flex items-center gap-3">
        <CameraScanner onTextExtracted={(text) => setEssay(prev => prev ? prev + "\n\n" + text : text)} />
      </div>

      {/* Model Selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">AI Model</label>
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card text-card-foreground text-sm font-medium transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="flex flex-col items-start">
              <span>{selectedModel.label}</span>
              <span className="text-xs text-muted-foreground">{selectedModel.desc}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
          </button>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
            >
              {models.map(m => (
                <button
                  key={m.value}
                  onClick={() => { setModel(m.value); setShowModelPicker(false); }}
                  className={`w-full flex flex-col items-start px-4 py-3 text-sm transition-colors hover:bg-accent/10 ${
                    model === m.value ? "bg-primary/10 text-primary" : "text-popover-foreground"
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.desc}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mode & Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Writing Mode</label>
          <div className="flex gap-2">
            {modes.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  mode === m.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Tone</label>
          <div className="flex gap-2">
            {tones.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  tone === t.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Options & Submit */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={explainChanges}
            onChange={e => setExplainChanges(e.target.checked)}
            className="rounded border-border text-primary focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">Explain changes</span>
        </label>

        <Button
          onClick={() => onImprove(essay, mode, tone, explainChanges, model)}
          disabled={!essay.trim() || isLoading}
          size="lg"
          className="gap-2 px-8 shadow-elevated"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Improving...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Improve Essay
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
