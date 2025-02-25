import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FirebaseInit from "./FirebaseInit";
import { ToastContainer } from "react-toastify";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Bus Hailer",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseInit>{children}</FirebaseInit>
        <ToastContainer
          position="top-center"
          stacked={true}
          newestOnTop={true}
          autoClose={2000}
          pauseOnFocusLoss={false}
          pauseOnHover={false}
        />
      </body>
    </html>
  );
}
