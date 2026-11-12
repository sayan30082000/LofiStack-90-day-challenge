"use client";

import { useRef, useState } from "react";
import { FileDropzone, formatBytes, type FileDropzoneHandle } from "@/components/ui/file-dropzone";

function FilesReadout({ files, emptyText }: { files: File[]; emptyText: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">onFilesChange</p>
      {files.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      ) : (
        <pre tabIndex={0} role="region" aria-label="Selected files" className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-800/70">
          {JSON.stringify(
            files.map((f) => ({ name: f.name, size: formatBytes(f.size), type: f.type || "unknown" })),
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

/* ---------- Pre-flight checks ---------- */

/** Draws a little landscape; blur softens it. */
async function samplePhoto(width: number, height: number, blur = 0, noise = false, quality = 0.9): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (blur) ctx.filter = `blur(${blur}px)`;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#1e3a8a");
  sky.addColorStop(1, "#f59e0b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(width * 0.7, height * 0.45, height * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  for (let x = 0; x < width; x += Math.max(4, width / 60)) {
    const h = height * (0.15 + 0.12 * Math.abs(Math.sin(x / (width / 9))));
    ctx.fillRect(x, height - h, Math.max(3, width / 80), h);
  }
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = Math.max(1, width / 400);
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo((i * width) / 40, height * 0.62);
    ctx.lineTo((i * width) / 40 + width / 80, height * 0.6);
    ctx.stroke();
  }
  if (noise) {
    // Fine grain keeps a big JPEG big, like a real phone photo.
    const img = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 50;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Adds a minimal EXIF block with GPS coordinates (Dhaka, 23°48'N 90°24'E) right after the JPEG's
 * start marker, the way a phone camera does.
 */
function withGps(jpeg: Uint8Array): Uint8Array {
  const tiff: number[] = [];
  const u16 = (v: number) => tiff.push(v & 255, v >> 8);
  const u32 = (v: number) => tiff.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24);
  // TIFF header, little-endian, IFD0 at offset 8.
  tiff.push(0x49, 0x49);
  u16(42);
  u32(8);
  // IFD0: one entry, the GPS IFD pointer.
  u16(1);
  u16(0x8825); u16(4); u32(1); u32(26);
  u32(0);
  // GPS IFD at 26: four entries, rationals stored after it.
  const data = 26 + 2 + 4 * 12 + 4;
  u16(4);
  u16(1); u16(2); u32(2); tiff.push(78, 0, 0, 0); // GPSLatitudeRef "N"
  u16(2); u16(5); u32(3); u32(data); // GPSLatitude
  u16(3); u16(2); u32(2); tiff.push(69, 0, 0, 0); // GPSLongitudeRef "E"
  u16(4); u16(5); u32(3); u32(data + 24); // GPSLongitude
  u32(0);
  for (const v of [23, 48, 38, 90, 24, 25]) {
    u32(v);
    u32(1);
  }
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]; // "Exif\0\0"
  const len = payload.length + 2;
  const out = new Uint8Array(jpeg.length + 2 + len);
  out.set([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255]);
  out.set(payload, 6);
  out.set(jpeg.subarray(2), 6 + payload.length);
  return out;
}

const asFile = (bytes: Uint8Array, name: string, type: string) => new File([bytes as BlobPart], name, { type, lastModified: Date.now() });

const SAMPLES: { label: string; make: () => Promise<File> }[] = [
  { label: "Photo with GPS", make: async () => asFile(withGps(await samplePhoto(1200, 800)), "beach-trip.jpg", "image/jpeg") },
  { label: "Blurry photo", make: async () => asFile(await samplePhoto(1200, 800, 9), "team-photo.jpg", "image/jpeg") },
  { label: "Tiny logo", make: async () => asFile(await samplePhoto(96, 96), "logo.jpg", "image/jpeg") },
  { label: "Big photo", make: async () => asFile(await samplePhoto(3600, 2400, 0, true, 0.97), "camera-raw.jpg", "image/jpeg") },
  {
    label: "Contacts CSV",
    make: async () =>
      new File(["Name,Phone,City\nAyesha Rahman,01712345678,Dhaka\n,,\nTanvir Hasan,01898765432,Sylhet\n,,\n"], "contacts.csv", {
        type: "text/csv",
        lastModified: Date.now(),
      }),
  },
];

export function PreflightDemo() {
  const dropzone = useRef<FileDropzoneHandle>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <div className="flex flex-col gap-3">
        <FileDropzone
          ref={dropzone}
          label="Photos and contact lists"
          accept={["image/*", ".csv", "text/csv"]}
          maxSize={20 * 1024 * 1024}
          maxFiles={8}
          preflight={{ minWidth: 400, minHeight: 400, shrinkAbove: 1.5 * 1024 * 1024, csvColumns: ["name", "email", "phone"] }}
          onFilesChange={setFiles}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">No files handy? Add a sample:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(s.label);
                try {
                  dropzone.current?.addFiles([await s.make()]);
                } finally {
                  setBusy(null);
                }
              }}
              className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-progress disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {busy === s.label ? "Making…" : s.label}
            </button>
          ))}
        </div>
      </div>
      <FilesReadout files={files} emptyText="Add the GPS photo and press Remove location: the file is re-encoded without its metadata." />
    </div>
  );
}

export function ImagesDemo() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <FileDropzone
        label="Project screenshots"
        accept={["image/*"]}
        maxSize={2 * 1024 * 1024}
        maxFiles={5}
        onFilesChange={setFiles}
      />
      <FilesReadout files={files} emptyText="Drop a few images, then try a PDF or a file over 2 MB." />
    </div>
  );
}

export function PdfDemo() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <FileDropzone
        label="Signed contract"
        accept={[".pdf", "application/pdf"]}
        multiple={false}
        maxSize={10 * 1024 * 1024}
        hint="One PDF, up to 10 MB. A new file replaces the current one."
        messages={{ title: "Drop your PDF here", invalidType: () => "Only PDF files are accepted." }}
        onFilesChange={setFiles}
      />
      <FilesReadout files={files} emptyText="Nothing uploaded yet." />
    </div>
  );
}

export function DisabledDemo() {
  return (
    <div className="w-full max-w-md">
      <FileDropzone
        label="Attachments"
        disabled
        hint="Uploads are paused while this workspace is read-only."
        messages={{ empty: "Ask an admin to turn uploads back on." }}
      />
    </div>
  );
}
