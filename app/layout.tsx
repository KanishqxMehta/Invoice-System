import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Chandni Chowk Cheese Cafe | POS, KOT & Invoicing System",
  description:
    "Lightning-fast Cafe Point of Sale, Kitchen Display System (KDS), and Digital Invoicing in INR.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="h-screen max-h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-amber-200 dark:selection:bg-amber-900/60">
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('cafe_pos_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</main>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
