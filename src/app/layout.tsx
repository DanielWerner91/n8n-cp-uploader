import type { Metadata } from "next";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CP Uploader",
  description:
    "Convert savings trackers to Connected Platform bulk upload format",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
