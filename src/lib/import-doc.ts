// Convert uploaded documents (.docx, .md, .html, .txt) to HTML for the editor.

export type UploadImageFn = (file: File) => Promise<string | null>;

function looksLikeWordHtml(html: string): boolean {
  return /urn:schemas-microsoft-com|class="?Mso|<o:p>|mso-/i.test(html);
}

// Strip the worst of Word's clipboard HTML so ProseMirror gets clean content.
export function cleanWordHtml(html: string): string {
  if (!looksLikeWordHtml(html)) return html;
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:xml|meta|link|style)[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<\/?[a-z]+:[^>]*>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/<span[^>]*>\s*<\/span>/gi, "");
}

function base64ToFile(base64: string, contentType: string): File {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const ext = contentType.split("/")[1] ?? "png";
  return new File([arr], `imported.${ext}`, { type: contentType });
}

async function docxToHtml(file: File, uploadImage: UploadImageFn): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      // Embedded images are uploaded to Supabase storage instead of inlining base64.
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read("base64");
        const url = await uploadImage(
          base64ToFile(base64, image.contentType ?? "image/png")
        );
        return { src: url ?? "" };
      }),
    }
  );
  return result.value;
}

async function markdownToHtml(file: File): Promise<string> {
  const { marked } = await import("marked");
  return marked.parse(await file.text(), { async: false }) as string;
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function fileToHtml(
  file: File,
  uploadImage: UploadImageFn
): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) return docxToHtml(file, uploadImage);
  if (name.endsWith(".md") || name.endsWith(".markdown"))
    return markdownToHtml(file);
  if (name.endsWith(".html") || name.endsWith(".htm"))
    return cleanWordHtml(await file.text());
  if (name.endsWith(".txt")) return textToHtml(await file.text());

  throw new Error(
    "Unsupported file type — use .docx, .md, .html, or .txt"
  );
}

// Split imported HTML into a title (first h1, else fallback) and body.
export function splitTitleFromHtml(
  html: string,
  fallbackTitle: string
): { title: string; body: string } {
  const div = document.createElement("div");
  div.innerHTML = html;
  const h1 = div.querySelector("h1");
  if (h1) {
    const title = h1.textContent?.trim() || fallbackTitle;
    h1.remove();
    return { title, body: div.innerHTML };
  }
  return { title: fallbackTitle, body: div.innerHTML };
}
