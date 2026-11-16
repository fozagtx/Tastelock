import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Provider } from "./provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteLock",
  description: "Corrections become rules your agents follow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Shell>{children}</Shell>
        </Provider>
      </body>
    </html>
  );
}
