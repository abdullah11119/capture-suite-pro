import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Mic, MicOff, Video, VideoOff, Pause, Play, Square, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveItem, downloadBlob, generateId, formatDuration } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

type RecordState = "idle" | "countdown" | "recording" | "paused" | "done";

export default function ScreenRecorder() {
  const [state, setState] = useState<RecordState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    webcamStreamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCountdown = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      let combinedStream = displayStream;

      if (micEnabled) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          
          // Display audio
          const displayAudioTracks = displayStream.getAudioTracks();
          if (displayAudioTracks.length > 0) {
            const displaySource = ctx.createMediaStreamSource(new MediaStream(displayAudioTracks));
            displaySource.connect(dest);
          }
          
          // Mic audio
          const micSource = ctx.createMediaStreamSource(micStream);
          micSource.connect(dest);

          combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);

          // Stop mic when display stops
          displayStream.getVideoTracks()[0].addEventListener("ended", () => {
            micStream.getTracks().forEach((t) => t.stop());
          });
        } catch {
          // Mic not available, continue without
        }
      }

      streamRef.current = combinedStream;

      if (webcamEnabled) {
        try {
          const ws = await navigator.mediaDevices.getUserMedia({ video: { width: 200, height: 200 } });
          webcamStreamRef.current = ws;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = ws;
          }
        } catch {
          // webcam not available
        }
      }

      // Handle user stopping share
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state !== "inactive") {
          stopRecording();
        }
      });

      // Countdown
      setState("countdown");
      setCountdown(3);
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Start recording
      chunksRef.current = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
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
      cleanup();
      setState("idle");
      if (err.name !== "NotAllowedError") {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      pausedElapsedRef.current += Date.now() - startTimeRef.current;
      setState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
      }, 100);
      setState("recording");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSave = async () => {
    if (!recordedBlob) return;
    const id = generateId();
    await saveItem({
      id,
      type: "screen-recording",
      name: `Screen Recording ${new Date().toLocaleString()}`,
      blob: recordedBlob,
      duration: elapsed,
      createdAt: Date.now(),
      format: "webm",
    });
    toast({ title: "Saved!", description: "Recording saved to history." });
  };

  const handleDownload = () => {
    if (!recordedBlob) return;
    downloadBlob(recordedBlob, `screen-recording-${Date.now()}.webm`);
  };

  const reset = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    setState("idle");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold gradient-text">Screen Recorder</h1>
        <p className="text-muted-foreground">Capture your screen, browser tab, or application window</p>
      </div>

      {/* Preview / Controls */}
      <div className="glass-card overflow-hidden">
        {state === "done" && recordedUrl ? (
          <div className="relative">
            <video
              ref={previewVideoRef}
              src={recordedUrl}
              controls
              className="w-full aspect-video bg-muted"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted/30 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              {state === "countdown" ? (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="text-8xl font-display font-bold gradient-text"
                >
                  {countdown}
                </motion.div>
              ) : state === "recording" || state === "paused" ? (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className={`w-6 h-6 rounded-full bg-destructive mx-auto ${state === "recording" ? "recording-pulse" : ""}`} />
                  <p className="text-4xl font-mono font-bold">{formatDuration(elapsed)}</p>
                  <p className="text-muted-foreground text-sm">
                    {state === "paused" ? "Paused" : "Recording..."}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <Monitor className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">Click Start to begin recording</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Webcam overlay */}
            {webcamEnabled && (state === "recording" || state === "paused") && (
              <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Controls bar */}
        <div className="p-6 space-y-4">
          {state === "idle" && (
            <>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    micEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  Microphone
                </button>
                <button
                  onClick={() => setWebcamEnabled(!webcamEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    webcamEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {webcamEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  Webcam
                </button>
              </div>
              <Button onClick={startCountdown} className="w-full glow-btn gradient-bg text-primary-foreground h-12 text-base font-semibold">
                <Play className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            </>
          )}

          {(state === "recording" || state === "paused") && (
            <div className="flex gap-3 justify-center">
              {state === "recording" ? (
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
              ) : (
                <Button onClick={resumeRecording} variant="outline" size="lg">
                  <Play className="w-4 h-4 mr-2" /> Resume
                </Button>
              )}
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            </div>
          )}

          {state === "done" && (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleDownload} className="glow-btn gradient-bg text-primary-foreground">
                <Download className="w-4 h-4 mr-2" /> Download WebM
              </Button>
              <Button onClick={handleSave} variant="outline">
                Save to History
              </Button>
              <Button onClick={reset} variant="ghost">
                New Recording
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
