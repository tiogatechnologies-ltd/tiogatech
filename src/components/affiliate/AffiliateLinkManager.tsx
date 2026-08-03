import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Download, Link2, Plus, QrCode, Trash2, ExternalLink, Archive } from "lucide-react";
import { toast } from "sonner";

export type AffiliateLinkStat = {
  id: string;
  slug: string;
  label: string;
  destination_path: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  is_archived: boolean;
  created_at: string;
  clicks: number;
  unique_visitors: number;
  leads: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
};

const DESTINATIONS = [
  { value: "/", label: "Home page" },
  { value: "/catalog", label: "Product catalog" },
  { value: "/solar-assessment", label: "Solar assessment" },
  { value: "/finance", label: "Easy Flex financing" },
  { value: "/solar-packages", label: "Solar packages" },
  { value: "/home-automation", label: "Home automation" },
  { value: "/smart-locks", label: "Smart locks" },
  { value: "/contact", label: "Contact / quote" },
];

const MEDIUMS = ["social", "whatsapp", "email", "referral", "video", "offline", "paid"];

export const siteOrigin = () =>
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? window.location.origin
    : "https://tiogatechnologies.com";

export const shortUrlFor = (slug: string) => `${siteOrigin()}/r/${slug}`;

export function fullTrackedUrl(link: AffiliateLinkStat, code: string) {
  const p = new URLSearchParams();
  p.set("aff", code);
  p.set("alk", link.slug);
  if (link.utm_source) p.set("utm_source", link.utm_source);
  if (link.utm_medium) p.set("utm_medium", link.utm_medium);
  if (link.utm_campaign) p.set("utm_campaign", link.utm_campaign);
  if (link.utm_term) p.set("utm_term", link.utm_term);
  if (link.utm_content) p.set("utm_content", link.utm_content);
  return `${siteOrigin()}${link.destination_path}?${p.toString()}`;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export default function AffiliateLinkManager({
  affiliateId,
  code,
  links,
  onChanged,
}: {
  affiliateId: string;
  code: string;
  links: AffiliateLinkStat[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrLink, setQrLink] = useState<AffiliateLinkStat | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);

  const [form, setForm] = useState({
    label: "",
    destination_path: "/catalog",
    utm_source: "",
    utm_medium: "social",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    slug: "",
  });

  const visible = useMemo(
    () => links.filter((l) => (showArchived ? true : !l.is_archived)),
    [links, showArchived],
  );

  useEffect(() => {
    if (!qrLink) { setQrData(""); return; }
    QRCode.toDataURL(shortUrlFor(qrLink.slug), { width: 640, margin: 2, color: { dark: "#0A192F", light: "#FFFFFF" } })
      .then(setQrData)
      .catch(() => setQrData(""));
  }, [qrLink]);

  const copy = (text: string, what = "Link") => {
    navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  };

  const createLink = async () => {
    if (!form.label.trim()) { toast.error("Give the link a name"); return; }
    const base = slugify(form.slug || `${code}-${form.label}`) || slugify(code);
    setSaving(true);
    let attempt = base;
    for (let i = 0; i < 4; i++) {
      const { error } = await supabase.from("affiliate_links").insert({
        affiliate_id: affiliateId,
        slug: attempt,
        label: form.label.trim().slice(0, 120),
        destination_path: form.destination_path,
        utm_source: form.utm_source.trim() || code,
        utm_medium: form.utm_medium || null,
        utm_campaign: form.utm_campaign.trim() || null,
        utm_term: form.utm_term.trim() || null,
        utm_content: form.utm_content.trim() || null,
      } as never);
      if (!error) {
        setSaving(false);
        setOpen(false);
        setForm({ label: "", destination_path: "/catalog", utm_source: "", utm_medium: "social", utm_campaign: "", utm_term: "", utm_content: "", slug: "" });
        toast.success("Tracking link created");
        onChanged();
        return;
      }
      if (!error.message.toLowerCase().includes("duplicate")) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
      attempt = `${base}-${Math.random().toString(36).slice(2, 5)}`;
    }
    setSaving(false);
    toast.error("Could not generate a unique link, try a different name");
  };

  const toggleArchive = async (link: AffiliateLinkStat) => {
    const { error } = await supabase
      .from("affiliate_links")
      .update({ is_archived: !link.is_archived } as never)
      .eq("id", link.id);
    if (error) { toast.error(error.message); return; }
    toast.success(link.is_archived ? "Link restored" : "Link archived");
    onChanged();
  };

  const remove = async (link: AffiliateLinkStat) => {
    if (!confirm(`Delete "${link.label}"? Click history for this link is removed too.`)) return;
    const { error } = await supabase.from("affiliate_links").delete().eq("id", link.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Link deleted");
    onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" /> Tracking links
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Every link carries your code <span className="font-mono font-semibold text-foreground">{code}</span> plus UTM tags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New link</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create a tracking link</DialogTitle>
                <DialogDescription>
                  We generate a short link and QR code you can share anywhere.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Link name *</Label>
                  <Input value={form.label} placeholder="Instagram bio - June"
                    onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Send visitors to</Label>
                  <Select value={form.destination_path} onValueChange={(v) => setForm({ ...form, destination_path: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DESTINATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Source (utm_source)</Label>
                    <Input value={form.utm_source} placeholder={code}
                      onChange={(e) => setForm({ ...form, utm_source: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel (utm_medium)</Label>
                    <Select value={form.utm_medium} onValueChange={(v) => setForm({ ...form, utm_medium: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEDIUMS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign</Label>
                    <Input value={form.utm_campaign} placeholder="june-promo"
                      onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content / variant</Label>
                    <Input value={form.utm_content} placeholder="story-1"
                      onChange={(e) => setForm({ ...form, utm_content: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom short code (optional)</Label>
                  <Input value={form.slug} placeholder="auto-generated"
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                  <p className="text-xs text-muted-foreground">
                    {siteOrigin()}/r/{slugify(form.slug || `${code}-${form.label}`) || "your-link"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createLink} disabled={saving}>{saving ? "Creating…" : "Create link"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No tracking links yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one per channel so you can see exactly what is working.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visible.map((l) => (
                <div key={l.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.label}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{shortUrlFor(l.slug)}</p>
                    </div>
                    {l.is_archived && <Badge variant="secondary">Archived</Badge>}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="font-semibold">{l.clicks}</p><p className="text-muted-foreground">Clicks</p></div>
                    <div><p className="font-semibold">{l.leads}</p><p className="text-muted-foreground">Leads</p></div>
                    <div><p className="font-semibold">{l.orders}</p><p className="text-muted-foreground">Sales</p></div>
                    <div><p className="font-semibold">{naira(l.revenue)}</p><p className="text-muted-foreground">Revenue</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copy(shortUrlFor(l.slug))}><Copy className="mr-1 h-3 w-3" /> Copy</Button>
                    <Button size="sm" variant="outline" onClick={() => setQrLink(l)}><QrCode className="mr-1 h-3 w-3" /> QR</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleArchive(l)}><Archive className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(l)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Visitors</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((l) => (
                    <TableRow key={l.id} className={l.is_archived ? "opacity-60" : ""}>
                      <TableCell>
                        <p className="font-medium">{l.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">{shortUrlFor(l.slug)}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{l.destination_path}</Badge>
                          {l.utm_medium && <Badge variant="secondary" className="text-[10px]">{l.utm_medium}</Badge>}
                          {l.utm_campaign && <Badge variant="secondary" className="text-[10px]">{l.utm_campaign}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{l.clicks}</TableCell>
                      <TableCell className="text-right">{l.unique_visitors}</TableCell>
                      <TableCell className="text-right">{l.leads}</TableCell>
                      <TableCell className="text-right">{l.orders}</TableCell>
                      <TableCell className="text-right">{naira(l.revenue)}</TableCell>
                      <TableCell className="text-right">{l.conversion_rate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Copy short link" onClick={() => copy(shortUrlFor(l.slug))}><Copy className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Copy full UTM link" onClick={() => copy(fullTrackedUrl(l, code), "Full link")}><ExternalLink className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="QR code" onClick={() => setQrLink(l)}><QrCode className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title={l.is_archived ? "Restore" : "Archive"} onClick={() => toggleArchive(l)}><Archive className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(l)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!qrLink} onOpenChange={(o) => !o && setQrLink(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{qrLink?.label}</DialogTitle>
            <DialogDescription className="break-all font-mono text-xs">
              {qrLink ? shortUrlFor(qrLink.slug) : ""}
            </DialogDescription>
          </DialogHeader>
          {qrData ? (
            <img src={qrData} alt={`QR code for ${qrLink?.label}`} className="mx-auto w-56 rounded-lg border" />
          ) : (
            <div className="mx-auto h-56 w-56 animate-pulse rounded-lg bg-muted" />
          )}
          <DialogFooter className="flex-row justify-center gap-2">
            <Button variant="outline" onClick={() => qrLink && copy(shortUrlFor(qrLink.slug))}>
              <Copy className="mr-1 h-4 w-4" /> Copy link
            </Button>
            <Button asChild disabled={!qrData}>
              <a href={qrData} download={`tioga-${qrLink?.slug}.png`}>
                <Download className="mr-1 h-4 w-4" /> Download QR
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
