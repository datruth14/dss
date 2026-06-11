"use client";

import { motion } from "framer-motion";
import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
  index: number;
}

export default function EventCard({ event, onSelect, index }: EventCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        onClick={() => onSelect(event)}
        className="flex flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        aria-label={`View ${event.title} - ${event.type === "past" ? "View gallery" : "See details"}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={event.galleryImages[0]}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                event.type === "past"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              }`}
            >
              {event.type === "past" ? "Past Event" : "Upcoming"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {event.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {event.date}
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {event.description}
          </p>
        </div>
      </button>
    </motion.article>
  );
}
