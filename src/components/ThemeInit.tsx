import { memo } from "react";
import { useTheme } from "@/hooks/use-theme";

// Initialize dark mode on app load
function ThemeInit() {
  useTheme();
  return null;
}

export default memo(ThemeInit);
