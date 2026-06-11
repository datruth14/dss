import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tools | Loveworld Programs",
  description: "Utility tools for event coordination and management.",
};

const tools = [
  {
    title: "Meal Ticket",
    description: "Generate and manage digital meal tickets for events.",
    href: "/tools/meal-ticket",
  },
  {
    title: "Auth Scanner",
    description: "Scan and verify credentials for secure event access.",
    href: "/tools/auth-scanner",
  },
  {
    title: "Inventify",
    description: "Inventory management system for tracking and organizing event resources.",
    href: "/tools/inventify",
  },
];

export default function ToolsPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950">
      <Image
        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=85"
        alt=""
        fill
        className="object-cover opacity-20"
        sizes="100vw"
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-950/60 to-zinc-950/80" />

      <main className="relative z-10 flex-1 mx-auto max-w-5xl w-full px-6 pt-40 pb-32">
        <h1 className="text-4xl font-bold text-white">Tools</h1>
        <p className="mt-2 text-zinc-400">
          Utility tools for event coordination and management.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group rounded-xl border border-white/10 bg-transparent p-6 transition-all hover:border-amber-500/40 hover:bg-white/5"
            >
              <h2 className="text-xl font-semibold text-white group-hover:text-amber-400">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
