import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CameraScannerProps {
  onTextExtracted: (text: string) => void;
}

export default function CameraScanner({ onTextExtracted }: CameraScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch {
      toast.error("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsOpen(false);
    setPreview(null);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setIsOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const extractText = async () => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-text", {
        body: { image: preview },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.text) {
        onTextExtracted(data.text);
        toast.success("Text extracted from document!");
        stopCamera();
      } else {
        toast.error("No text found in the image.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract text.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={startCamera}
          className="gap-1.5"
        >
          <Camera className="w-4 h-4" />
          Scan Document
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  {preview ? "Review Scan" : "Scan Document"}
                </h3>
                <Button variant="ghost" size="icon" onClick={stopCamera}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                {preview ? (
                  <img src={preview} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {!preview && (
                  <div className="absolute inset-8 border-2 border-dashed border-primary/40 rounded-lg pointer-events-none" />
                )}
              </div>

              <div className="flex gap-3 justify-center">
                {preview ? (
                  <>
                    <Button variant="outline" onClick={() => setPreview(null)}>
                      Retake
                    </Button>
                    <Button onClick={extractText} disabled={isProcessing} className="gap-2">
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4" />
                          Extract Text
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={capturePhoto} size="lg" className="gap-2 px-8">
                    <Camera className="w-4 h-4" />
                    Capture
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
