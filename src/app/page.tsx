import { ThemeProvider } from "@/components/theme-provider";
import { OcrApp } from "@/components/ocr-app";

export default function Home() {
  return (
    <ThemeProvider>
      <OcrApp />
    </ThemeProvider>
  );
}
