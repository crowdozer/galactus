import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Galactus",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col w-screen h-screen overflow-y-auto overflow-x-hidden">
          <nav className="py-2 px-4 sm:px-0">
            <div className="mx-auto max-w-3xl flex flex-row gap-2">
              <a href="https://www.crwdzr.io/" className="text-lg font-bold">
                crwdzr.io
              </a>
              <span className="self-center text-stone-600 font-bold ml-2">
                /
              </span>
              <h2 className="self-center text-stone-400">ascii galaxy</h2>
            </div>
          </nav>
          <div className="grow px-4 sm:px-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
