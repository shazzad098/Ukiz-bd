import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Product image field: paste an image URL or pick a picture from the device
 * (uploaded to Supabase Storage, URL filled in automatically).
 */
export function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const upload = trpc.products.uploadImage.useMutation({
    onSuccess: (data) => {
      onChange(data.url);
      toast.success("Image uploaded.");
    },
    onError: (error) => toast.error(error.message || "Upload failed."),
    onSettled: () => setUploading(false),
  });

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    setUploading(true);
    try {
      const dataBase64 = await readAsBase64(file);
      upload.mutate({ filename: file.name, contentType: file.type || "image/jpeg", dataBase64 });
    } catch {
      setUploading(false);
      toast.error("Could not read the file.");
    }
  };

  const showPreview = value.trim().startsWith("http") || value.trim().startsWith("data:image");

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a39b90]" />
          <input
            className="w-full rounded-lg border border-black/15 bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
            autoComplete="off"
            placeholder="https:// or upload from device →"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || upload.isPending}
          title="Select from device"
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg bg-[#4f46e5] text-white transition-colors hover:bg-[#4338ca] disabled:opacity-50"
        >
          {uploading || upload.isPending ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
        </button>
      </div>
      {showPreview ? (
        <div className="relative mt-3 inline-block">
          <img src={value} alt="Product preview" className="h-24 w-20 rounded-xl border border-black/10 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#151515] text-white"
          >
            <X size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
