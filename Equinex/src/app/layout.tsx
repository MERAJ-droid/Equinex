import { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Navbar } from "@/components/component/Navbar";
import { cn } from "@/lib/utils";
import { StarknetContextProvider } from "@/context";

const fontHeading = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontBody = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "EquineX",
  description:
    "Invest into your favourite startups with cryptocurrency. Get started with EquineX today.",
  icons: {
    icon: "/favicon3.ico", // Replaces the <link rel="icon"> tag
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${montserrat.variable}`}>
      <body
        className={cn("antialiased", fontHeading.variable, fontBody.variable, montserrat.variable)}
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        <ThirdwebProvider>
          <StarknetContextProvider>
            <Navbar />
            {children}
          </StarknetContextProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}