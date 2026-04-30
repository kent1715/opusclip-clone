import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { VALID_CAPTION_STYLES, VALID_LAYOUTS, VALID_FONT_IDS, VALID_ANIMATION_IDS, VALID_CAPTION_POSITIONS } from "@/lib/constants";

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
      captionFont,
      captionAnimation,
      captionColor,
      captionSize,
      captionPosition,
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
    if (captionStyle && !VALID_CAPTION_STYLES.includes(captionStyle)) {
      return NextResponse.json(
        { error: `Invalid captionStyle. Must be one of: ${VALID_CAPTION_STYLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate captionFont if provided
    if (captionFont && !VALID_FONT_IDS.includes(captionFont)) {
      return NextResponse.json(
        { error: `Invalid captionFont. Must be one of: ${VALID_FONT_IDS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate captionAnimation if provided
    if (captionAnimation && !VALID_ANIMATION_IDS.includes(captionAnimation)) {
      return NextResponse.json(
        { error: `Invalid captionAnimation. Must be one of: ${VALID_ANIMATION_IDS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate captionPosition if provided
    if (captionPosition && !VALID_CAPTION_POSITIONS.includes(captionPosition)) {
      return NextResponse.json(
        { error: `Invalid captionPosition. Must be one of: ${VALID_CAPTION_POSITIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate layout if provided
    if (layout && !VALID_LAYOUTS.includes(layout as typeof VALID_LAYOUTS[number])) {
      return NextResponse.json(
        { error: `Invalid layout. Must be one of: ${VALID_LAYOUTS.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (captions !== undefined) updateData.captions = captions;
    if (captionStyle !== undefined) updateData.captionStyle = captionStyle;
    if (captionFont !== undefined) updateData.captionFont = captionFont;
    if (captionAnimation !== undefined) updateData.captionAnimation = captionAnimation;
    if (captionColor !== undefined) updateData.captionColor = captionColor;
    if (captionSize !== undefined) updateData.captionSize = captionSize;
    if (captionPosition !== undefined) updateData.captionPosition = captionPosition;
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
