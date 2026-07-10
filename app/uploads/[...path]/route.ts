import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathArray = resolvedParams.path;
    
    // Construct the absolute path to the file in public/uploads
    const filePath = path.normalize(
      path.join(process.cwd(), "public", "uploads", ...filePathArray)
    );

    // Security check: Prevent directory traversal attacks
    const safeBaseDir = path.normalize(path.join(process.cwd(), "public", "uploads"));
    if (!filePath.startsWith(safeBaseDir)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Read file content
    const fileBuffer = await fs.promises.readFile(filePath);

    // Map file extension to content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".mp4") contentType = "video/mp4";

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file dynamically:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
