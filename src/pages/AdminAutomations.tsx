import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

type Rule = {
  key: string;
  label: string;
  category: string;
  enabled: boolean;
  config: Record<string, any> | null;
};

const CONFIG_LABEL: Record<string, string> = {
  days_before: "Days before",
  days_after: "Days after",
  delay_hours: "Delay (hours)",
  hours: "Hours",
};

const AdminAutomations = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: settings, error }, { data: runRows }] = await Promise.all([
      supabase.from("automation_settings" as any).select("*").order("category").order("key"),
      supabase.from("automation_runs" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (error) toast.error(error.message);
    setRules(((settings as any) || []) as Rule[]);
    setRuns(((runRows as any) || []) as any[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (rule: Rule, enabled: boolean) => {
    setRules((p) => p.map((r) => (r.key === rule.key ? { ...r, enabled } : r)));
    const { error } = await supabase.from("automation_settings" as any).update({ enabled }).eq("key", rule.key);
    if (error) {
      setRules((p) => p.map((r) => (r.key === rule.key ? { ...r, enabled: !enabled } : r)));
      return toast.error(error.message);
    }
    toast.success(`${rule.label} ${enabled ? "enabled" : "disabled"}`);
  };

  const saveConfig = async (rule: Rule, field: string, value: number) => {
    const config = { ...(rule.config || {}), [field]: value };
    setRules((p) => p.map((r) => (r.key === rule.key ? { ...r, config } : r)));
    const { error } = await supabase.from("automation_settings" as any).update({ config }).eq("key", rule.key);
    if (error) return toast.error(error.message);
  };

  const grouped = useMemo(() => {
    const map: Record<string, Rule[]> = {};
    rules.forEach((r) => { (map[r.category] ||= []).push(r); });
    return Object.entries(map);
  }, [rules]);

  const stats = useMemo(() => ({
    active: rules.filter((r) => r.enabled).length,
    total: rules.length,
    sent: runs.filter((r) => r.status === "sent").length,
    failed: runs.filter((r) => r.status === "failed").length,
  }), [rules, runs]);

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground">Toggle lifecycle rules and review everything that has fired.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" /> Refresh</Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Active rules", value: `${stats.active}/${stats.total}` },
          { label: "Runs logged", value: runs.length },
          { label: "Sent", value: stats.sent },
          { label: "Failed", value: stats.failed },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <Card key={category} className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <Zap size={14} /> {category}
              </h2>
              <div className="space-y-4">
                {items.map((rule) => (
                  <div key={rule.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.key}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {Object.entries(rule.config || {}).map(([field, value]) => (
                        <div key={field} className="flex items-center gap-2">
                          <Label className="whitespace-nowrap text-xs text-muted-foreground">{CONFIG_LABEL[field] || field}</Label>
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={Number(value)}
                            onChange={(e) => saveConfig(rule, field, Number(e.target.value))}
                          />
                        </div>
                      ))}
                      <Switch checked={rule.enabled} onCheckedChange={(v) => toggle(rule, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent runs</h2>
            {runs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing has fired yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Rule</th>
                      <th className="py-2 pr-3">Entity</th>
                      <th className="py-2 pr-3">Recipient</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium text-foreground">{r.rule_key}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{[r.entity_type, r.entity_id?.slice(0, 8)].filter(Boolean).join(" · ") || "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{r.recipient || "—"}</td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className={r.status === "failed" ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-NG")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAutomations;
