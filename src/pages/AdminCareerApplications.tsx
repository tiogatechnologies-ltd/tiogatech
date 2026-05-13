import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Eye, Mail, Phone, Search, Trash2, UserRoundCheck } from "lucide-react";

type Application = {
  id: string;
  career_id: string | null;
  role_title: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  years_experience: string;
  cover_note: string;
  cv_path: string;
  status: string;
  created_at: string;
};

const statuses = ["new", "reviewing", "shortlisted", "rejected"];

const AdminCareerApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState<Application | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("career_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load applications");
    else setApplications((data as Application[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (app: Application, status: string) => {
    const { error } = await supabase.from("career_applications").update({ status }).eq("id", app.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setApplications((items) => items.map((item) => item.id === app.id ? { ...item, status } : item));
    setViewing((current) => current?.id === app.id ? { ...current, status } : current);
  };

  const downloadCv = async (cvPath: string) => {
    const { data, error } = await supabase.storage.from("career-cvs").createSignedUrl(cvPath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Could not open CV");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (app: Application) => {
    if (!confirm(`Delete application from ${app.full_name}?`)) return;
    const { error } = await supabase.from("career_applications").delete().eq("id", app.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("career-cvs").remove([app.cv_path]);
    toast.success("Application deleted");
    setViewing(null);
    load();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => !term || [app.full_name, app.email, app.phone, app.role_title, app.location].some((value) => value.toLowerCase().includes(term)));
  }, [applications, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Career Applications</h2>
            <p className="text-sm text-muted-foreground">Review submissions from the Career page application form.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search applicants…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <UserRoundCheck className="mx-auto mb-3 text-muted-foreground" size={30} />
            <p className="font-medium text-foreground">No applications found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Role</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{app.full_name}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{app.role_title}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{app.location}</td>
                      <td className="px-4 py-3">
                        <Select value={app.status} onValueChange={(value) => updateStatus(app, value)}>
                          <SelectTrigger className="h-8 w-32 rounded-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewing(app)} title="View"><Eye size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadCv(app.cv_path)} title="Download CV"><Download size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(app)} className="text-destructive hover:text-destructive" title="Delete"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.full_name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Role</p>
                <p className="font-semibold text-foreground">{viewing.role_title}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <a href={`mailto:${viewing.email}`} className="rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"><Mail size={15} className="mb-1 text-primary" />{viewing.email}</a>
                <a href={`tel:${viewing.phone}`} className="rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"><Phone size={15} className="mb-1 text-primary" />{viewing.phone}</a>
              </div>
              {[
                ["Location", viewing.location],
                ["Experience", viewing.years_experience],
                ["Submitted", new Date(viewing.created_at).toLocaleString()],
                ["Short note", viewing.cover_note],
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{value}</p>
                </div>
              ) : null)}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => downloadCv(viewing.cv_path)} className="gap-2"><Download size={16} /> Open CV</Button>
                <Select value={viewing.status} onValueChange={(value) => updateStatus(viewing, value)}>
                  <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCareerApplications;