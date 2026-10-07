"use client";

import { useState } from "react";
import { FileDropzone, formatBytes } from "@/components/ui/file-dropzone";

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
