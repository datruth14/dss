"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Upcoming", href: "/#upcoming" },
  { label: "Past Events", href: "/#events" },
  { label: "Get Involved", href: "/#upcoming" },
  { label: "Tools", href: "/tools" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClick = () => {
    setIsOpen(false);
  };

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all ${
        isOpen ? "z-[70]" : ""
      } ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm dark:bg-zinc-950/90"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <Image
            src="/lwp-logo.png"
            alt="Loveworld Programs"
            width={36}
            height={36}
            className="h-9 w-auto"
          />
          <span className={`text-xl font-bold tracking-tight transition-colors ${
              scrolled ? "text-zinc-900 dark:text-white" : "text-white"
            }`}>
            Loveworld Programs
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                  scrolled ? "text-zinc-600 dark:text-zinc-300" : "text-white/80"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <div className="flex flex-col gap-1.5">
            <span
              className={`block h-0.5 w-6 rounded transition-all ${
                isOpen ? "translate-y-2 rotate-45 bg-white" : scrolled ? "bg-zinc-900 dark:bg-white" : "bg-white"
              }`}
            />
            <span
              className={`block h-0.5 w-6 rounded transition-all ${
                isOpen ? "opacity-0 bg-white" : scrolled ? "bg-zinc-900 dark:bg-white" : "bg-white"
              }`}
            />
            <span
              className={`block h-0.5 w-6 rounded transition-all ${
                isOpen ? "-translate-y-2 -rotate-45 bg-white" : scrolled ? "bg-zinc-900 dark:bg-white" : "bg-white"
              }`}
            />
          </div>
        </button>
      </nav>

    </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-blue-950/95 backdrop-blur-lg md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={handleClick}
                className="text-2xl font-semibold text-white transition-colors hover:text-amber-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
