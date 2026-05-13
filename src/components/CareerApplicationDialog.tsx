import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MAX_CV_SIZE = 10 * 1024 * 1024;
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255, "Email is too long"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40, "Phone is too long"),
  location: z.string().trim().min(2, "Enter your location").max(120, "Location is too long"),
  yearsExperience: z.string().trim().min(1, "Enter your experience").max(80, "Experience is too long"),
  coverNote: z.string().trim().max(2000, "Keep this under 2,000 characters").optional(),
});

type ApplicationValues = z.infer<typeof applicationSchema>;

const CareerApplicationDialog = ({ job, open, onOpenChange }: { job: Job | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      yearsExperience: "",
      coverNote: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setCvFile(null);
    }
  }, [form, open]);

  const submit = async (values: ApplicationValues) => {
    if (!job || submitting) return;
    if (!cvFile) {
      toast.error("Please upload your CV");
      return;
    }
    if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
      toast.error("Upload a PDF, DOC or DOCX CV");
      return;
    }
    if (cvFile.size > MAX_CV_SIZE) {
      toast.error("CV must be 10MB or less");
      return;
    }

    setSubmitting(true);
    const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90);
    const cvPath = `${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("career-cvs").upload(cvPath, cvFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setSubmitting(false);
      toast.error(uploadError.message || "CV upload failed");
      return;
    }

    const { error } = await supabase.from("career_applications").insert({
      career_id: job.id || null,
      role_title: job.title,
      full_name: values.fullName,
      email: values.email,
      phone: values.phone,
      location: values.location,
      years_experience: values.yearsExperience,
      cover_note: values.coverNote || "",
      cv_path: cvPath,
    });

    setSubmitting(false);
    if (error) {
      await supabase.storage.from("career-cvs").remove([cvPath]);
      toast.error(error.message || "Application could not be submitted");
      return;
    }

    toast.success("Application submitted. Our team will review it shortly.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl no-clip">Apply for {job?.title || "this role"}</DialogTitle>
          <DialogDescription>Submit your details and CV. Accepted formats: PDF, DOC and DOCX.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="0903 596 6388" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="Lagos, Nigeria" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl><Input placeholder="3 years" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="coverNote" render={({ field }) => (
              <FormItem>
                <FormLabel>Short note</FormLabel>
                <FormControl><Textarea rows={4} placeholder="Tell us why you are a strong fit" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                  <UploadCloud className="text-accent" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{cvFile ? cvFile.name : "Upload CV"}</span>
                  <span className="block text-xs text-muted-foreground">PDF, DOC or DOCX. Maximum 10MB.</span>
                </span>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button type="submit" disabled={submitting} className="w-full rounded-full bg-accent text-accent-foreground hover:brightness-110">
              {submitting ? "Submitting…" : <><Send size={16} /> Submit Application</>}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CareerApplicationDialog;