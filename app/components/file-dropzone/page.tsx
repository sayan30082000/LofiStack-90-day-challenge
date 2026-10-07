import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { DisabledDemo, ImagesDemo, PdfDemo } from "./demos";

export const metadata: Metadata = {
  title: "File Dropzone",
  description: "Drag-and-drop file picker with type, size and count validation, image thumbnails and a removable file list.",
};

const imagesCode = `
const [files, setFiles] = useState<File[]>([]);

<FileDropzone
  label="Project screenshots"
  accept={["image/*"]}
  maxSize={2 * 1024 * 1024} // 2 MB per file
  maxFiles={5}
  onFilesChange={setFiles}
/>`;

const pdfCode = `
<FileDropzone
  label="Signed contract"
  accept={[".pdf", "application/pdf"]}
  multiple={false}          // a new file replaces the current one
  maxSize={10 * 1024 * 1024}
  hint="One PDF, up to 10 MB. A new file replaces the current one."
  messages={{
    title: "Drop your PDF here",
    invalidType: () => "Only PDF files are accepted.",
  }}
  onFilesChange={setFiles}
/>`;

const disabledCode = `
<FileDropzone
  label="Attachments"
  disabled
  hint="Uploads are paused while this workspace is read-only."
/>`;

const usage = `
import { FileDropzone } from "@/components/ui/file-dropzone";

export function AvatarUpload() {
  return (
    <FileDropzone
      label="Avatar"
      accept={["image/png", "image/jpeg"]}
      maxSize={1024 * 1024}
      multiple={false}
      onFilesChange={(files) => console.log(files[0])}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="file-dropzone"
      examples={[
        {
          title: "Images only",
          description:
            "Images up to 2 MB, five at most. Drag a PDF over it to see the reject style, or add a sixth image to see the per-file message.",
          preview: <ImagesDemo />,
          code: imagesCode,
          minHeight: 360,
        },
        {
          title: "Single PDF",
          description: "multiple={false}: one PDF, and a new valid file replaces the old one.",
          preview: <PdfDemo />,
          code: pdfCode,
          minHeight: 320,
        },
        {
          title: "Disabled",
          description: "Not focusable, no picker, drops are refused.",
          preview: <DisabledDemo />,
          code: disabledCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "accept", type: "string[]", default: "[]", description: 'MIME types ("image/png"), wildcards ("image/*") or extensions (".pdf"). Empty accepts anything.' },
        { name: "maxSize", type: "number", description: "Maximum size per file in bytes. Unlimited when omitted." },
        { name: "maxFiles", type: "number", description: "Maximum number of files in the list. Shows a capacity meter. Ignored when multiple is false." },
        { name: "multiple", type: "boolean", default: "true", description: "Allow several files. When false, a new valid file replaces the current one." },
        { name: "onFilesChange", type: "(files: File[]) => void", description: "Called with the full current list after every add or remove." },
        { name: "label", type: "ReactNode", default: '"Attachments"', description: "Visible label, linked to the hidden file input." },
        { name: "hint", type: "ReactNode", description: "Helper text. Defaults to a summary such as \"Images · up to 2 MB each · max 5 files\"." },
        { name: "disabled", type: "boolean", default: "false", description: "Blocks picking, dropping and removing." },
        { name: "name", type: "string", description: "Name of the file input, for native form posts." },
        { name: "formatSize", type: "(bytes: number) => string", default: "formatBytes", description: "Formats sizes in the list, the meter and the size error." },
        { name: "messages", type: "Partial<FileDropzoneMessages>", description: "Override any user-facing string or rejection reason." },
        { name: "className", type: "string", description: "Classes for the outer wrapper." },
      ]}
      types={[
        {
          name: "FileDropzoneMessages",
          props: [
            { name: "title / browse", type: "string", default: '"Drag & drop files here" / "browse"', description: "Idle call to action." },
            { name: "dragActive", type: "string", default: '"Drop to add"', description: "Shown while valid files are dragged over." },
            { name: "dragRejectType", type: "string", description: "Shown while files of a type that isn't accepted are dragged over." },
            { name: "dragRejectCount", type: "(remaining: number) => string", description: "Shown while more files than the remaining slots are dragged over." },
            { name: "invalidType / tooLarge / tooMany / duplicate", type: "(file, …) => string", description: "Reason shown next to each rejected file." },
            { name: "rejectedTitle", type: "(count: number) => string", description: "Heading of the rejection panel." },
            { name: "remove", type: "(file: File) => string", default: '"Remove {name}"', description: "Accessible label of each remove button." },
            { name: "added / removed / cleared", type: "string | (…) => string", description: "Screen reader announcements." },
            { name: "clearAll / dismiss / empty", type: "string", description: "Clear button, dismiss button label and empty-list text." },
            { name: "usage", type: "(count, max, totalSize) => string", description: "Capacity summary next to the meter." },
          ],
        },
      ]}
      accessibility={[
        "The real <input type=\"file\"> is visually hidden and linked to the visible label; clicking the label or the drop area opens the picker.",
        "The drop area is a focusable role=\"button\" named by the label and call to action, with the hint as its description. Enter and Space open the picker.",
        "Rejected files are listed in a role=\"alert\" region, one reason per file, re-announced on every new attempt.",
        "Additions and removals are announced through a polite role=\"status\" region. Removing a file moves focus back to the drop area.",
        "Remove buttons are 40px and named \"Remove {file name}\". The disabled state takes the drop area out of the tab order and sets aria-disabled.",
        "The marching border, fanned tiles and shake are turned off with prefers-reduced-motion.",
      ]}
    />
  );
}
