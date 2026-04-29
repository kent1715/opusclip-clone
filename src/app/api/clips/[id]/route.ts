import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET: Get single clip with video info
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

    const clip = await db.clip.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Verify ownership (admin can access any)
    if (clip.video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: clip });
  } catch (error) {
    console.error("Error getting clip:", error);
    return NextResponse.json(
      { error: "Failed to get clip" },
      { status: 500 }
    );
  }
}

// PATCH: Update clip
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      captions,
      captionStyle,
      layout,
      templateId,
      tags,
      isPublished,
      publishedTo,
      userId,
    } = body;
    const auth = await requireAuth(userId);

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if clip exists and user owns it
    const existing = await db.clip.findUnique({
      where: { id },
      include: { video: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (existing.video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate captionStyle if provided
    if (
      captionStyle &&
      !["default", "bold", "karaoke", "outline"].includes(captionStyle)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid captionStyle. Must be: default, bold, karaoke, or outline",
        },
        { status: 400 }
      );
    }

    // Validate layout if provided
    if (layout && !["9:16", "1:1", "16:9"].includes(layout)) {
      return NextResponse.json(
        { error: "Invalid layout. Must be: 9:16, 1:1, or 16:9" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (captions !== undefined) updateData.captions = captions;
    if (captionStyle !== undefined) updateData.captionStyle = captionStyle;
    if (layout !== undefined) updateData.layout = layout;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    }
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (publishedTo !== undefined) {
      updateData.publishedTo = Array.isArray(publishedTo)
        ? JSON.stringify(publishedTo)
        : publishedTo;
    }

    const clip = await db.clip.update({
      where: { id },
      data: updateData,
      include: { video: true },
    });

    return NextResponse.json({ success: true, data: clip });
  } catch (error) {
    console.error("Error updating clip:", error);
    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 }
    );
  }
}

// DELETE: Delete clip
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

    // Check if clip exists and user owns it
    const existing = await db.clip.findUnique({
      where: { id },
      include: { video: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (existing.video.userId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.clip.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Clip deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting clip:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 }
    );
  }
}
