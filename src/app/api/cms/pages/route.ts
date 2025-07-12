import { type NextRequest, NextResponse } from "next/server";
import { cmsService } from "@/lib/db";

export async function GET() {
  try {
    const pages = await cmsService.getPages();
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const pageData = await request.json();
    const newPage = await cmsService.createPage(pageData);
    return NextResponse.json(newPage);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
