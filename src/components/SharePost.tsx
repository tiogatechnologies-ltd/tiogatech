import { useState } from "react";
import { toast } from "sonner";
import { Link2, Check, Twitter, Facebook, Linkedin } from "lucide-react";

interface Props {
  url: string;
  title: string;
  className?: string;
}

const SharePost = ({ url, title, className = "" }: Props) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Twitter,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: Facebook,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Linkedin,
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      Icon: WhatsAppIcon,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground mr-1">Share:</span>
      {targets.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          className="w-9 h-9 rounded-full border border-border hover:bg-muted hover:text-primary text-muted-foreground flex items-center justify-center transition-colors"
        >
          <Icon size={16} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
};

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.64 6L0 24l6.18-1.62A11.9 11.9 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 22a10 10 0 0 1-5.1-1.39l-.36-.21-3.67.96.98-3.58-.24-.37A10 10 0 1 1 22 12c0 5.52-4.48 10-10 10Zm5.5-7.5c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15s-.78.97-.96 1.17c-.18.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.06c-.17-.3 0-.47.13-.62.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38s-1.05 1.03-1.05 2.5 1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.55.72.31 1.28.5 1.71.63.72.23 1.37.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.13-.28-.2-.58-.35Z"/>
    </svg>
  );
}

export default SharePost;
