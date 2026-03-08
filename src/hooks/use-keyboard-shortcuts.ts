import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey) return;
      switch (e.code) {
        case "KeyR":
          e.preventDefault();
          navigate("/record-screen");
          break;
        case "KeyV":
          e.preventDefault();
          navigate("/record-voice");
          break;
        case "KeyF":
          e.preventDefault();
          navigate("/screenshot");
          break;
        case "KeyA":
          e.preventDefault();
          navigate("/screenshot");
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
