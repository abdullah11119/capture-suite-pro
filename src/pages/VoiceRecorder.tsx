import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Pause, Play, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveItem, downloadBlob, generateId, formatDuration } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

type RecordState = "idle" | "recording" | "paused" | "done";

export default function VoiceRecorder() {
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Gradient line
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "hsl(262, 80%, 65%)");
      gradient.addColorStop(0.5, "hsl(220, 70%, 60%)");
      gradient.addColorStop(1, "hsl(330, 75%, 65%)");

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      // Recorder
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setState("done");
        cleanup();
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);

      setState("recording");
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      timerRef.current = window.setInterval(() => {
        setElapsed(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
      }, 100);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const pause = () => {
    mediaRecorderRef.current?.pause();
    clearInterval(timerRef.current);
    pausedElapsedRef.current += Date.now() - startTimeRef.current;
    setState("paused");
  };

  const resume = () => {
    mediaRecorderRef.current?.resume();
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
    }, 100);
    setState("recording");
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const handleSave = async () => {
    if (!recordedBlob) return;
    await saveItem({
      id: generateId(),
      type: "voice-recording",
      name: `Voice Recording ${new Date().toLocaleString()}`,
      blob: recordedBlob,
      duration: elapsed,
      createdAt: Date.now(),
      format: "webm",
    });
    toast({ title: "Saved!", description: "Voice recording saved to history." });
  };

  const handleDownload = () => {
    if (!recordedBlob) return;
    downloadBlob(recordedBlob, `voice-recording-${Date.now()}.webm`);
  };

  const reset = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    setState("idle");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold gradient-text">Voice Recorder</h1>
        <p className="text-muted-foreground">Record microphone audio with real-time waveform</p>
      </div>

      <div className="glass-card p-8 space-y-8">
        {/* Waveform */}
        <div className="relative h-32 rounded-xl bg-muted/30 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={128}
            className="w-full h-full"
          />
          {state === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Mic className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-5xl font-mono font-bold">{formatDuration(elapsed)}</p>
          {state === "paused" && (
            <p className="text-sm text-muted-foreground mt-2">Paused</p>
          )}
        </div>

        {/* Controls */}
        {state === "idle" && (
          <Button onClick={startRecording} className="w-full glow-btn gradient-bg text-primary-foreground h-14 text-lg font-semibold">
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}

        {(state === "recording" || state === "paused") && (
          <div className="flex gap-3 justify-center">
            {state === "recording" ? (
              <Button onClick={pause} variant="outline" size="lg">
                <Pause className="w-4 h-4 mr-2" /> Pause
              </Button>
            ) : (
              <Button onClick={resume} variant="outline" size="lg">
                <Play className="w-4 h-4 mr-2" /> Resume
              </Button>
            )}
            <Button onClick={stop} variant="destructive" size="lg">
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-4">
            <audio src={recordedUrl!} controls className="w-full" />
            <div className="flex gap-3 justify-center">
              <Button onClick={handleDownload} className="glow-btn gradient-bg text-primary-foreground">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <Button onClick={handleSave} variant="outline">
                Save to History
              </Button>
              <Button onClick={reset} variant="ghost">
                New Recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
