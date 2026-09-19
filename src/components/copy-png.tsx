import { useState, type RefObject } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { PAPER } from "@/lib/palette";

export function CopyPng({
  targetRef,
  filename,
}: {
  targetRef: RefObject<HTMLElement | null>;
  filename: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "saved" | "err">("idle");

  async function onClick() {
    const node = targetRef.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node, {
        backgroundColor: PAPER,
        pixelRatio: 2,
        cacheBust: true,
        filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
      });
      const blob = await (await fetch(dataUrl)).blob();
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setStatus("copied");
      } catch {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        a.click();
        setStatus("saved");
      }
    } catch {
      setStatus("err");
    }
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  const label =
    status === "copied" ? "Copied" : status === "saved" ? "Saved" : status === "err" ? "Failed" : "Copy as PNG";

  return (
    <Button type="button" variant="secondary" onClick={onClick} className="h-11 px-4 text-sm">
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}
