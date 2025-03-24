import type { Metadata } from "next";
import "../globals.css";
import BlockchainProvider from "@/providers/blockchain-provider";
import { NoticeBar } from "@/components/notice-bar"
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Fans Flow on Chain",
  description: "Fans Flow on Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BlockchainProvider>
          <NoticeBar />
          <Navbar />
          {children}
        </BlockchainProvider>
      </body>
    </html>
  );
}
