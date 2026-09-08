import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Link2,
  FolderOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  STOCK_PACKAGE_IMAGES,
  getDefaultPackageImage,
  type StockPackageImage,
} from "@/lib/packageImages";
import { toast } from "sonner";

interface PackageImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  category: "solar" | "automation" | "lock" | "cctv";
  identifier?: string | number;
  label?: string;
  helperText?: string;
}

export const PackageImagePicker = ({
  value,
  onChange,
  category,
  identifier,
  label = "Package Picture",
  helperText = "Choose a picture from the stock library, upload an image, or provide an image link.",
}: PackageImagePickerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"stock" | "upload" | "url">("stock");
  const [categoryFilter, setCategoryFilter] = useState<string>(category);
  const [customUrl, setCustomUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultImage = getDefaultPackageImage(category, identifier);
  const displayImage = value?.trim() ? value : defaultImage;
  const isCustom = Boolean(value?.trim());

  const handleSelectStock = (img: StockPackageImage) => {
    onChange(img.url);
    toast.success(`Selected "${img.label}"`);
    setDialogOpen(false);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    toast.success("Picture URL applied");
    setDialogOpen(false);
    setCustomUrl("");
  };

  const handleResetToDefault = () => {
    onChange(null);
    toast.info("Reset to default category picture");
  };

  const processFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `package-${category}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (upErr) {
        // If storage upload fails due to RLS or quota, create data URL fallback
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          onChange(result);
          toast.success("Image uploaded (local preview)");
          setDialogOpen(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      toast.success("Picture uploaded successfully");
      setDialogOpen(false);
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFileUpload(file);
  };

  const filteredStock = STOCK_PACKAGE_IMAGES.filter((img) =>
    categoryFilter === "all" ? true : img.category === categoryFilter
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        <div className="flex items-center gap-1.5">
          {isCustom ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Check size={10} /> Custom Picture
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Category Default
            </span>
          )}
        </div>
      </div>

      {/* Picture Card Preview */}
      <div className="relative rounded-2xl border border-border bg-muted/20 p-3 flex flex-col sm:flex-row items-center gap-4 group">
        <div className="relative w-full sm:w-44 h-28 shrink-0 rounded-xl overflow-hidden bg-background/80 border border-border shadow-sm">
          <img
            src={displayImage}
            alt="Package preview"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = defaultImage;
            }}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
          <p className="text-xs text-muted-foreground line-clamp-2">{helperText}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl text-xs gap-1.5">
                  <ImageIcon size={14} className="text-primary" />
                  <span>{isCustom ? "Change Picture" : "Choose Picture"}</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border rounded-3xl p-6">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-lg font-display font-bold">
                    Select or Upload Package Picture
                  </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("stock")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                      activeTab === "stock"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FolderOpen size={13} /> Stock Library
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                      activeTab === "upload"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Upload size={13} /> Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                      activeTab === "url"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Link2 size={13} /> Direct URL
                  </button>
                </div>

                {/* Tab: Stock Images */}
                {activeTab === "stock" && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Filter:</span>
                      {[
                        { id: "all", label: "All Stock" },
                        { id: "solar", label: "Solar Systems" },
                        { id: "automation", label: "Automation" },
                        { id: "lock", label: "Smart Locks" },
                        { id: "cctv", label: "CCTV" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(cat.id)}
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                            categoryFilter === cat.id
                              ? "bg-primary/15 text-primary font-bold"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                      {filteredStock.map((img, idx) => {
                        const isSelected = value === img.url;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectStock(img)}
                            className={`group cursor-pointer rounded-xl border p-2 bg-card hover:border-primary transition-all duration-200 relative flex flex-col ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-muted mb-2 relative">
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground p-1 rounded-full shadow">
                                  <Check size={12} />
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-foreground line-clamp-1">
                              {img.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                              {img.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab: File Upload */}
                {activeTab === "upload" && (
                  <div className="space-y-4 pt-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-primary" size={28} />
                          <p className="text-xs text-muted-foreground">Uploading image…</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Upload size={24} />
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            Click or drag and drop image here
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, or WebP up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Direct URL */}
                {activeTab === "url" && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          placeholder="https://example.com/package-image.jpg"
                          className="rounded-xl text-xs"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyUrl}
                          disabled={!customUrl.trim()}
                          className="rounded-xl shrink-0 text-xs font-bold"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    {customUrl.trim() && (
                      <div className="rounded-xl border border-border p-2 bg-muted/20">
                        <p className="text-[11px] text-muted-foreground mb-1.5">Live Preview:</p>
                        <div className="aspect-[16/9] max-h-48 rounded-lg overflow-hidden bg-background">
                          <img
                            src={customUrl}
                            alt="Live preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = defaultImage;
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {isCustom && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResetToDefault}
                className="h-8 rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={12} /> Reset to Default
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageImagePicker;
