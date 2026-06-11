"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Event } from "@/lib/types";

interface ModalProps {
  event: Event | null;
  onClose: () => void;
}

export default function Modal({ event, onClose }: ModalProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!event) return;
      if (e.key === "Escape") {
        onClose();
      }
      if (event.type === "past") {
        if (e.key === "ArrowRight") {
          setGalleryIndex((prev) =>
            prev < event.galleryImages.length - 1 ? prev + 1 : 0
          );
        }
        if (e.key === "ArrowLeft") {
          setGalleryIndex((prev) =>
            prev > 0 ? prev - 1 : event.galleryImages.length - 1
          );
        }
      }
    },
    [event, onClose]
  );

  useEffect(() => {
    if (event) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setGalleryIndex(0);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [event, handleKeyDown]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={event.title}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {event.type === "past" ? (
              <PastEventContent event={event} />
            ) : (
              <UpcomingEventContent event={event} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PastEventContent({ event }: { event: Event }) {
  const [galleryIndex, setGalleryIndex] = useState(0);

  const prev = () =>
    setGalleryIndex((i) =>
      i > 0 ? i - 1 : event.galleryImages.length - 1
    );
  const next = () =>
    setGalleryIndex((i) =>
      i < event.galleryImages.length - 1 ? i + 1 : 0
    );

  return (
    <div className="flex flex-col">
      <div className="relative aspect-video bg-zinc-800 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={galleryIndex}
            src={event.galleryImages[galleryIndex]}
            alt={`${event.title} gallery image ${galleryIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>

        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          aria-label="Previous image"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          aria-label="Next image"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {event.galleryImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setGalleryIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === galleryIndex ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Past Event
        </span>
        <h2 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
          {event.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {event.date}
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {event.description}
        </p>
      </div>
    </div>
  );
}

function UpcomingEventContent({ event }: { event: Event }) {
  return (
    <div className="flex flex-col">
      {event.galleryImages[0] && (
        <div className="relative aspect-video bg-zinc-800">
          <img
            src={event.galleryImages[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Upcoming
        </span>
        <h2 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
          {event.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {event.date}
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {event.description}
        </p>

      </div>
    </div>
  );
}
