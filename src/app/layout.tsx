import type { Metadata } from "next";
import { JobDock, JobsProvider } from "@/components/Jobs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Guide Generator",
  description: "Turn any company URL or name into a brand guide: logo, colour, typography, tone of voice and messaging, extracted from the live site with TinyFish.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JobsProvider>
          {children}
          <JobDock />
        </JobsProvider>
      </body>
    </html>
  );
}
