import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetingGhost — AI Meeting Intelligence",
  description:
    "Multi-agent AI system for meeting summarization, accountability tracking, and automated follow-up emails.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
