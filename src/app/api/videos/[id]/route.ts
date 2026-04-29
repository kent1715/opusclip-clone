import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Get single video with its clips
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await db.video.findUnique({
      where: { id },
      include: { clips: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: video });
  } catch (error) {
    console.error("Error getting video:", error);
    return NextResponse.json(
      { error: "Failed to get video" },
      { status: 500 }
    );
  }
}

// PATCH: Update video (status, title)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title } = body;

    // Check if video exists
    const existing = await db.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Validate status if provided
    if (status && !["processing", "completed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: processing, completed, or failed" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;

    const video = await db.video.update({
      where: { id },
      data: updateData,
      include: { clips: true },
    });

    return NextResponse.json({ success: true, data: video });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

// DELETE: Delete video and all its clips
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if video exists
    const existing = await db.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete video (clips will be cascade deleted)
    await db.video.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Video and all associated clips deleted",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
