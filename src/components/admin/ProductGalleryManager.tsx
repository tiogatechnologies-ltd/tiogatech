import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Star, ArrowUp, ArrowDown, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface Props {
  productId: string;
}

const MAX_IMAGES = 8;
const MAX_FILE_MB = 5;
const MIN_DIMENSION = 400; // px
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const checkDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });

const ProductGalleryManager = ({ productId }: Props) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    const { data, error } = await (supabase as any)
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setImages((data as GalleryImage[]) ?? []);
  };

  useEffect(() => {
    if (productId) fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Max ${MAX_IMAGES} images per product`);
      return;
    }
    const toProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Only the first ${remaining} of ${files.length} files will be uploaded (max ${MAX_IMAGES} total).`);
    }
    setUploading(true);
    try {
      let order = images.length;
      for (const file of toProcess) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: only JPG, PNG, or WebP allowed`);
          continue;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          toast.error(`${file.name} is over ${MAX_FILE_MB}MB`);
          continue;
        }
        try {
          const { width, height } = await checkDimensions(file);
          if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
            toast.error(`${file.name}: image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px`);
            continue;
          }
        } catch {
          toast.error(`${file.name}: could not read image`);
          continue;
        }
        const ext = file.name.split(".").pop();
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, file);
        if (upErr) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        const isFirst = order === 0;
        const { error: insErr } = await (supabase as any).from("product_images").insert({
          product_id: productId,
          url: urlData.publicUrl,
          sort_order: order,
          is_primary: isFirst,
        });
        if (insErr) {
          toast.error("Could not save image record");
          continue;
        }
        order += 1;
      }
      await fetchImages();
      toast.success("Images uploaded");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setPrimary = async (id: string) => {
    const { error } = await (supabase as any)
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", id);
    if (error) return toast.error("Failed to set primary");
    fetchImages();
  };

  const remove = async (img: GalleryImage) => {
    if (!confirm("Remove this image?")) return;
    await (supabase as any).from("product_images").delete().eq("id", img.id);
    // Best effort: also remove the storage object if it lives in our bucket
    try {
      const marker = "/product-images/";
      const i = img.url.indexOf(marker);
      if (i !== -1) {
        const path = img.url.substring(i + marker.length);
        await supabase.storage.from("product-images").remove([path]);
      }
    } catch {
      /* ignore */
    }
    fetchImages();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const a = images[idx];
    const b = images[target];
    await (supabase as any).from("product_images").update({ sort_order: b.sort_order }).eq("id", a.id);
    await (supabase as any).from("product_images").update({ sort_order: a.sort_order }).eq("id", b.id);
    fetchImages();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-muted-foreground">
          Gallery ({images.length}/{MAX_IMAGES})
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImagePlus size={14} />
          {uploading ? "Uploading..." : images.length >= MAX_IMAGES ? "Limit reached" : "Add images"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-all"
        >
          <Upload size={18} />
          <span className="text-xs">No gallery images yet — click to upload</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border ${
                img.is_primary ? "border-primary ring-2 ring-primary/30" : "border-border"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-24 object-cover"  loading="lazy" decoding="async" />
              {img.is_primary && (
                <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="p-1.5 rounded-lg bg-card/90 hover:bg-card text-foreground"
                    title="Set as primary"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="p-1.5 rounded-lg bg-card/90 hover:bg-card text-foreground disabled:opacity-40"
                  disabled={idx === 0}
                  title="Move up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  className="p-1.5 rounded-lg bg-card/90 hover:bg-card text-foreground disabled:opacity-40"
                  disabled={idx === images.length - 1}
                  title="Move down"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(img)}
                  className="p-1.5 rounded-lg bg-card/90 hover:bg-card text-destructive"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        First image (or "Primary") is shown on cards. Customers can swipe through the rest.
        <br />
        Up to {MAX_IMAGES} images · JPG/PNG/WebP · max {MAX_FILE_MB}MB · min {MIN_DIMENSION}×{MIN_DIMENSION}px.
      </p>
    </div>
  );
};

export default ProductGalleryManager;
