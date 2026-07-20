import type { Metadata } from "next";
import Image from "next/image";
import { Roboto } from "next/font/google";
import "./globals.css";
import NotFoundButtons from "@/components/NotFoundButtons";import notFoundBg from "@/assets/not-found.png";

// This page bypasses the root layout, so it has to load the font itself.
const roboto = Roboto({
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
        <body>
        <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-10 text-center">

      {/* Content, centered in the viewport */}
      <div className="z-20 flex w-full max-w-md flex-col items-center justify-center text-foreground">
        <h1 className="text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]">
          4<span className="text-accent">0</span>4
        </h1>

        <p className="mt-6 text-lg font-medium leading-relaxed text-muted-foreground">
          Oops! The page you are looking for isn&apos;t here. It might have been
          moved or deleted.
        </p>

        {/* Your buttons component */}
        <div className="mt-8 w-full">
          <NotFoundButtons />
        </div>
      </div>

      {/* Illustration anchored to the bottom right corner */}
      <div className="pointer-events-none absolute bottom-0 right-0 z-10 aspect-square w-full max-w-[300px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[520px]">
        <Image
          src={notFoundBg}
          alt="Page not found background"
          fill
          priority
          unoptimized
          placeholder="blur"
          className="object-contain object-bottom-right"
        />
      </div>

    </main>
        </body>
    </html>
    
  );
}