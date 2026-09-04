import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, MessageSquarePlus, History } from "lucide-react";
import { PIPELINE_STAGES, stageClass, stageLabel } from "@/lib/briefData";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  entityType: "sizing" | "assessment";
  row: any;
  onSaved?: (patch: Record<string, any>) => void;
};

type Person = { id: string; label: string };

const TABLE = { sizing: "lumivolt_sizings", assessment: "solar_assessments" } as const;

const BriefWorkflow = ({ entityType, row, onSaved }: Props) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<string>(row.pipeline_status || "new");
  const [salesOwner, setSalesOwner] = useState<string>(row.sales_owner_id || "");
  const [engOwner, setEngOwner] = useState<string>(row.engineer_owner_id || "");
  const [notes, setNotes] = useState<string>(row.internal_notes || "");
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStage(row.pipeline_status || "new");
    setSalesOwner(row.sales_owner_id || "");
    setEngOwner(row.engineer_owner_id || "");
    setNotes(row.internal_notes || "");
  }, [row.id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [roleRes, evRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["admin", "staff", "engineer"]),
        supabase.from("brief_events" as any).select("*").eq("entity_type", entityType).eq("entity_id", row.id).order("created_at", { ascending: false }).limit(50),
      ]);
      const ids = Array.from(new Set((roleRes.data || []).map((r: any) => r.user_id)));
      let profiles: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
        profiles = data || [];
      }
      setPeople(
        (roleRes.data || []).map((r: any) => {
          const p = profiles.find((x) => x.id === r.user_id);
          return { id: r.user_id, label: `${p?.full_name || p?.email || r.user_id.slice(0, 8)} · ${r.role}` };
        }),
      );
      setEvents((evRes.data as any[]) || []);
      setLoading(false);
    })();
  }, [entityType, row.id]);

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    return people.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [people]);

  const logEvent = async (event_type: string, payload: Partial<{ from_value: string; to_value: string; note: string }>) => {
    const { data, error } = await supabase.from("brief_events" as any).insert({
      entity_type: entityType,
      entity_id: row.id,
      event_type,
      actor_id: user?.id,
      actor_email: user?.email,
      ...payload,
    }).select().maybeSingle();
    if (!error && data) setEvents((e) => [data, ...e]);
  };

  const save = async () => {
    setSaving(true);
    const patch: Record<string, any> = {
      pipeline_status: stage,
      sales_owner_id: salesOwner || null,
      engineer_owner_id: engOwner || null,
      internal_notes: notes || null,
    };
    const { error } = await (supabase.from(TABLE[entityType] as any).update(patch).eq("id", row.id) as any);
    setSaving(false);
    if (error) return toast.error(error.message);

    if (stage !== (row.pipeline_status || "new")) {
      await logEvent("status", { from_value: stageLabel(row.pipeline_status), to_value: stageLabel(stage) });
    }
    if (salesOwner !== (row.sales_owner_id || "") || engOwner !== (row.engineer_owner_id || "")) {
      await logEvent("assignment", {
        to_value: [
          salesOwner ? `Sales: ${uniquePeople.find((p) => p.id === salesOwner)?.label || salesOwner}` : null,
          engOwner ? `Engineering: ${uniquePeople.find((p) => p.id === engOwner)?.label || engOwner}` : null,
        ].filter(Boolean).join(" · ") || "Unassigned",
      });
    }
    toast.success("Brief updated");
    onSaved?.(patch);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await logEvent("note", { note: newNote.trim() });
    setNewNote("");
    toast.success("Note added");
  };

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm">Workflow</h3>
        <span className={`text-[10px] px-2 py-1 rounded-full border ${stageClass(row.pipeline_status)}`}>{stageLabel(row.pipeline_status)}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Stage</span>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
            {PIPELINE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Sales owner</span>
          <select value={salesOwner} onChange={(e) => setSalesOwner(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {uniquePeople.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Engineering owner</span>
          <select value={engOwner} onChange={(e) => setEngOwner(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {uniquePeople.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Internal notes (current)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm" placeholder="Site constraints, pricing agreed, follow-up context..." />
        </label>
      </div>

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save workflow
      </button>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><History size={13} /> Activity</div>
        <div className="flex gap-2">
          <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note to the timeline" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={addNote} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"><MessageSquarePlus size={14} /> Add</button>
        </div>
        {loading ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No activity yet.</p>
        ) : (
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl bg-background border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.event_type}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm">
                  {e.event_type === "status" ? `${e.from_value || "-"} → ${e.to_value}` : e.note || e.to_value}
                </p>
                <p className="text-[10px] text-muted-foreground">{e.actor_email || "system"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BriefWorkflow;
