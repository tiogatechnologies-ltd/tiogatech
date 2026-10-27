import QRCode from "qrcode";
import logoLight from "@/assets/tioga-logo-light.png";
import logoDark from "@/assets/tioga-logo-dark.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const campaigns = [
  { name: "Solar energy", path: "/lumivolt", title: "Power your everyday.", subtitle: "Explore solar, inverter and battery solutions with Tioga.", copy: "Looking for solar, inverter or battery solutions? Explore Tioga Technologies and speak to the team about your needs." },
  { name: "Smart security", path: "/catalog", title: "A smarter way home.", subtitle: "Explore smart locks and security solutions with Tioga.", copy: "Explore Tioga Technologies' smart locks and security solutions. Visit the catalog and ask the team about the right fit for your home." },
  { name: "Home automation", path: "/voltai", title: "Make home work for you.", subtitle: "Explore connected home automation with Tioga.", copy: "Discover home automation with Tioga Technologies. Explore connected home solutions and speak to the team about your project." },
];
const xml = (value: string) => value.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
const download = (content: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function AffiliateMarketingAssets({ code }: { code: string }) {
  const link = (path: string) => `${window.location.origin}${path}?aff=${encodeURIComponent(code)}`;
  const caption = (campaign: typeof campaigns[number]) => `${campaign.copy}\n\n${link(campaign.path)}\n\nAffiliate disclosure: I may earn a commission if you buy through this link.`;
  const flyer = async (campaign: typeof campaigns[number]) => {
    try {
      const qr = await QRCode.toString(link(campaign.path), { type: "svg", margin: 2 });
      const embeddedQr = qr.replace('<svg ', '<svg x="72" y="600" width="250" height="250" ');
      download(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
        <rect width="1080" height="1080" fill="#071d20"/><circle cx="1050" cy="100" r="420" fill="#0c473b"/>
        <text x="72" y="120" fill="#9becba" font-family="Arial,sans-serif" font-size="32" font-weight="bold">TIOGA TECHNOLOGIES</text>
        <text x="72" y="300" fill="white" font-family="Arial,sans-serif" font-size="62" font-weight="bold">${xml(campaign.title)}</text>
        <text x="72" y="385" fill="#d1e4dc" font-family="Arial,sans-serif" font-size="26">${xml(campaign.subtitle)}</text>
        <text x="72" y="510" fill="#9becba" font-family="Arial,sans-serif" font-size="32">Scan to explore ${xml(campaign.name.toLowerCase())}</text>
        ${embeddedQr}
        <text x="72" y="940" fill="white" font-family="Arial,sans-serif" font-size="25">tiogatechnologies.com</text>
        <text x="72" y="1010" fill="#d1e4dc" font-family="Arial,sans-serif" font-size="21">Affiliate link: the person sharing this may earn a commission.</text>
      </svg>`, `tioga-${campaign.name.toLowerCase().replace(/ /g, "-")}.svg`, "image/svg+xml");
    } catch {
      toast.error("Could not prepare the flyer. Please try again.");
    }
  };
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Download a flyer with your referral QR code, or copy a caption for your next post. Keep the affiliate disclosure and confirm pricing with the Tioga team before quoting it.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.name}>
            <CardHeader><CardTitle className="text-lg">{campaign.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-line">{caption(campaign)}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(caption(campaign)); toast.success("Caption copied"); } catch { toast.error("Could not copy. Download the caption instead."); } }}>Copy caption</Button>
                <Button size="sm" variant="outline" onClick={() => download(caption(campaign), "tioga-caption.txt", "text/plain")}>Download caption</Button>
                <Button size="sm" variant="outline" onClick={() => flyer(campaign)}>Download flyer</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Brand logos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild><a href={logoDark} download="tioga-logo-dark.png">Dark logo (PNG)</a></Button>
          <Button variant="outline" asChild><a href={logoLight} download="tioga-logo-light.png">Light logo (PNG)</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
