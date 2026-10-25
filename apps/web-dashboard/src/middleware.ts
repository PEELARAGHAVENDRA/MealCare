import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { NextResponse } from "next/server";

const clerkHandler = clerkMiddleware();

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};