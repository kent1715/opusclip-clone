import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET: Get single video with its clips
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const video = await db.video.findUnique({
      where: { id },
      include: { clips: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Verify ownership (admin can access any)
    if (video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    const { status, title, userId } = body;
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if video exists and user owns it
    const existing = await db.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (existing.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if video exists and user owns it
    const existing = await db.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (existing.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
