import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: List templates (user + default templates)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const templates = await db.template.findMany({
      where: {
        OR: [{ isDefault: true }, ...(userId ? [{ userId }] : [])],
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

// POST: Create template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      colors,
      font,
      logoPosition,
      captionStyle,
      layout,
      isDefault,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Verify user exists if userId is provided
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    const template = await db.template.create({
      data: {
        userId: userId || null,
        name,
        description: description || null,
        colors:
          typeof colors === "object" ? JSON.stringify(colors) : colors || "{}",
        font: font || "Inter",
        logoPosition: logoPosition || "bottom-right",
        captionStyle: captionStyle || "default",
        layout: layout || "9:16",
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
