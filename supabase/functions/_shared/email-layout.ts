// Shared branded HTML wrapper for plain automation emails.
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function brandedEmail(opts: {
  title: string;
  intro?: string;
  /** Pre-escaped/plain body paragraphs. */
  paragraphs?: string[];
  rows?: Array<[string, string]>;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  const rows = (opts.rows ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:150px;">${esc(k)}</td><td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join("");

  const paras = (opts.paragraphs ?? [])
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151;">${esc(p)}</p>`)
    .join("");

  const cta =
    opts.ctaUrl && opts.ctaLabel
      ? `<div style="margin-top:22px;text-align:center;"><a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#0d6b3f;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${esc(opts.ctaLabel)}</a></div>`
      : "";

  return `<div style="background:#f6f7f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0d6b3f;color:#ffffff;padding:18px 22px;">
      <h1 style="margin:0;font-size:18px;">Tioga Technologies</h1>
    </div>
    <div style="padding:22px;">
      <h2 style="margin:0 0 12px;font-size:17px;color:#111827;">${esc(opts.title)}</h2>
      ${opts.intro ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">${esc(opts.intro)}</p>` : ""}
      ${paras}
      ${rows ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>` : ""}
      ${cta}
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">${esc(opts.footerNote ?? "Tioga Technologies · Solar, Smart Home, Security")}</p>
    </div>
  </div>
</div>`;
}
