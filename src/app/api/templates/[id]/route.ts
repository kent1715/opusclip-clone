import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH: Update template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      colors,
      font,
      logoPosition,
      captionStyle,
      layout,
      isDefault,
    } = body;

    // Check if template exists
    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
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
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (colors !== undefined) {
      updateData.colors =
        typeof colors === "object" ? JSON.stringify(colors) : colors;
    }
    if (font !== undefined) updateData.font = font;
    if (logoPosition !== undefined) updateData.logoPosition = logoPosition;
    if (captionStyle !== undefined) updateData.captionStyle = captionStyle;
    if (layout !== undefined) updateData.layout = layout;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const template = await db.template.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE: Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if template exists
    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await db.template.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
