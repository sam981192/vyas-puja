import JSZip from "jszip";

/**
 * Renames a file according to naming rules:
 * language-state-city-name-contact-fileIndex.extension
 * rules:
 * - lowercase
 * - spaces to underscores
 * - remove special characters
 */
export const formatFileName = (
  language: string,
  state: string,
  city: string,
  name: string,
  contact: string,
  index: number,
  originalName: string
) => {
  const sanitize = (text: string) => 
    text.toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const extension = originalName.split('.').pop() || '';
  
  const base = [
    sanitize(language),
    sanitize(state),
    sanitize(city),
    sanitize(name),
    sanitize(contact),
    index
  ].join('-');

  return `${base}.${extension}`;
};

export const createZipAndDownload = async (
  files: File[], 
  metadata: { language: string; state: string; city: string; name: string; contact: string }
) => {
  const zip = new JSZip();
  
  files.forEach((file, index) => {
    const newName = formatFileName(
      metadata.language,
      metadata.state,
      metadata.city,
      metadata.name,
      metadata.contact,
      index + 1,
      file.name
    );
    zip.file(newName, file);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const zipName = [
    metadata.language,
    metadata.state,
    metadata.city,
    metadata.name,
    metadata.contact
  ].map(t => t.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')).join('-') + ".zip";

  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadSingleFile = (
  file: File,
  metadata: { language: string; state: string; city: string; name: string; contact: string }
) => {
  const newName = formatFileName(
    metadata.language,
    metadata.state,
    metadata.city,
    metadata.name,
    metadata.contact,
    1,
    file.name
  );
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = newName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
