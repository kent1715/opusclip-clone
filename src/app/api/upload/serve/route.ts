import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { join } from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
    }

    // Sanitize filename (prevent directory traversal)
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = join(/*turbopackIgnore: true*/ process.cwd(), "upload", sanitized);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;

    // Determine content type
    const ext = fileName.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
      webm: "video/webm",
      flv: "video/x-flv",
      wmv: "video/x-ms-wmv",
      m4v: "video/mp4",
    };
    const contentType = contentTypes[ext || ""] || "video/mp4";

    // Handle range requests for video seeking
    const range = request.headers.get("range");
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = createReadStream(filePath, { start, end });

      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          fileStream.on("end", () => {
            controller.close();
          });
          fileStream.on("error", (err) => {
            controller.error(err);
          });
        },
      });

      return new Response(readableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Full file response
    const fileStream = createReadStream(filePath);

    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        fileStream.on("end", () => {
          controller.close();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
