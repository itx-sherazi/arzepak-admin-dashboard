"use client";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

declare global {
  interface Window { Quill: unknown }
}

export default function RichEditor({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    /* Load Quill CSS */
    if (!document.getElementById("quill-css")) {
      const link = document.createElement("link");
      link.id = "quill-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css";
      document.head.appendChild(link);
    }

    const initQuill = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Q = (window as any).Quill;
      if (!Q || !containerRef.current || quillRef.current) return;

      const quill = new Q(containerRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["link", "image", "blockquote", "code-block"],
            ["clean"],
          ],
        },
      });

      quillRef.current = quill;

      /* Set initial value */
      if (value) quill.clipboard.dangerouslyPasteHTML(value);

      quill.on("text-change", () => {
        onChangeRef.current(quill.root.innerHTML);
      });
    };

    if ((window as unknown as Record<string, unknown>).Quill) {
      initQuill();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js";
      script.onload = initQuill;
      document.head.appendChild(script);
    }

    return () => {
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync value from outside only when not focused */
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const current = q.root.innerHTML;
    if (value !== current && value !== "<p><br></p>") {
      q.clipboard.dangerouslyPasteHTML(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50/80 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[320px] [&_.ql-editor]:text-sm [&_.ql-editor]:leading-relaxed [&_.ql-editor]:text-gray-800 [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-x-0">
      <div ref={containerRef} />
    </div>
  );
}
