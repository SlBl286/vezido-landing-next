import fs from "fs";
import path from "path";

export async function saveBase64Image(base64Data: string, prefix: string): Promise<string> {
  // If not a base64 data URL, return as-is
  if (!base64Data || !base64Data.startsWith("data:image/")) {
    return base64Data;
  }

  // Extract base64 data and extension
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Dữ liệu ảnh base64 không hợp lệ");
  }

  const mimeType = matches[1];
  const base64Content = matches[2];
  
  // Map mime type to extension
  let extension = "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    extension = "jpg";
  } else if (mimeType === "image/gif") {
    extension = "gif";
  } else if (mimeType === "image/webp") {
    extension = "webp";
  }

  const filename = `${prefix}-${Date.now()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(base64Content, "base64");
  
  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}
