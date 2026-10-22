"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PageShell({ children, wide = false }) {
  return (
    <>
      <Navbar variant="page" />
      <main className={`mx-auto w-full px-6 pb-24 md:px-14 ${wide ? "max-w-[1500px]" : "max-w-[1300px]"}`}>{children}</main>
      <Footer />
    </>
  );
}
