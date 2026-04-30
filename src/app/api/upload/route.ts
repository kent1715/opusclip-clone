import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
      "video/x-flv",
      "video/avi",
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: MP4, MOV, AVI, MKV, WebM, FLV" },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 500MB" },
        { status: 400 }
      );
    }

    // Save file to upload directory
    const jobId = randomUUID();
    const ext = file.name.split(".").pop() || "mp4";
    const fileName = `${jobId}.${ext}`;
    const uploadDir = join(/*turbopackIgnore: true*/ process.cwd(), "upload");
    const filePath = join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file info
    const localUrl = `/api/upload/serve?file=${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        url: localUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
