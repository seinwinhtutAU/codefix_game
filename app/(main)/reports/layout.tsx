"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import "highlight.js/styles/github-dark.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/services";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const userString = localStorage.getItem("user");

    const user: User = JSON.parse(userString ?? "");

    if (!user.username.startsWith("admin")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
