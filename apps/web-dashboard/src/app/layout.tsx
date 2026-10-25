import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/lib/AuthContext";
import { AuthGuard } from "@/components/auth-guard";
import { DemoProvider } from "@/lib/DemoContext";

export const metadata: Metadata = {
  title: "Mid-Day Meal AI Dashboard",
  description: "School meal monitoring and smart nutrition planning dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <DemoProvider>
            <AuthProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </AuthProvider>
          </DemoProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
