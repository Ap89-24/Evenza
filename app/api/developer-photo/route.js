import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const imagePath = "C:/Users/aman0/.gemini/antigravity-ide/brain/09d96a7d-71ad-4708-b5f5-5bb0c3abe4b9/media__1789568827205.jpg";
  const publicDest = path.join(process.cwd(), "public", "aman-patel.jpg");

  try {
    if (fs.existsSync(imagePath)) {
      // Copy to public directory so static serving works directly
      fs.copyFileSync(imagePath, publicDest);
      const fileBuffer = fs.readFileSync(imagePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (error) {
    console.error("Error copying developer photo:", error);
  }

  // Fallback to static public image if available
  if (fs.existsSync(publicDest)) {
    const fileBuffer = fs.readFileSync(publicDest);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  }

  return new NextResponse("Image not found", { status: 404 });
}
