import { Bold, Italic, Heading1, Heading2, Heading3, Link as LinkIcon, List, ListOrdered, Quote, Code, Image as ImageIcon, Minus, Strikethrough } from "lucide-react";
import { useRef } from "react";

interface Props {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
  onImageUpload?: () => Promise<string | null> | string | null;
}

const MarkdownToolbar = ({ value, onChange, rows = 18, placeholder, onImageUpload }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after = before, placeholderText = "text") => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholderText;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  };

  const linePrefix = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const replaced = block.split("\n").map((l) => (l.startsWith(prefix) ? l : prefix + l)).join("\n");
    const next = value.slice(0, lineStart) + replaced + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => ta.focus());
  };

  const insertBlock = (block: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const prefix = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "\n";
    const next = value.slice(0, start) + prefix + block + "\n" + value.slice(start);
    onChange(next);
    requestAnimationFrame(() => ta.focus());
  };

  const handleLink = () => {
    const url = prompt("Enter URL");
    if (!url) return;
    wrap("[", `](${url})`, "link text");
  };

  const handleImage = async () => {
    if (onImageUpload) {
      const url = await onImageUpload();
      if (url) insertBlock(`![image](${url})`);
      return;
    }
    const url = prompt("Image URL");
    if (url) insertBlock(`![alt](${url})`);
  };

  const Btn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1">
        <Btn icon={Heading1} label="Heading 1" onClick={() => linePrefix("# ")} />
        <Btn icon={Heading2} label="Heading 2" onClick={() => linePrefix("## ")} />
        <Btn icon={Heading3} label="Heading 3" onClick={() => linePrefix("### ")} />
        <span className="w-px h-4 bg-border mx-1" />
        <Btn icon={Bold} label="Bold" onClick={() => wrap("**")} />
        <Btn icon={Italic} label="Italic" onClick={() => wrap("*")} />
        <Btn icon={Strikethrough} label="Strikethrough" onClick={() => wrap("~~")} />
        <span className="w-px h-4 bg-border mx-1" />
        <Btn icon={LinkIcon} label="Link" onClick={handleLink} />
        <Btn icon={ImageIcon} label="Image" onClick={handleImage} />
        <span className="w-px h-4 bg-border mx-1" />
        <Btn icon={List} label="Bulleted list" onClick={() => linePrefix("- ")} />
        <Btn icon={ListOrdered} label="Numbered list" onClick={() => linePrefix("1. ")} />
        <Btn icon={Quote} label="Quote" onClick={() => linePrefix("> ")} />
        <Btn icon={Code} label="Code block" onClick={() => insertBlock("```\ncode\n```")} />
        <Btn icon={Minus} label="Divider" onClick={() => insertBlock("---")} />
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-card text-foreground font-mono text-sm focus:outline-none resize-y leading-relaxed"
      />
    </div>
  );
};

export default MarkdownToolbar;
