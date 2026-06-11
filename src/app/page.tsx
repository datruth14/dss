"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import EventCard from "@/components/ui/EventCard";
import Modal from "@/components/ui/Modal";
import { events } from "@/data/events";
import { Event } from "@/lib/types";

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const upcomingEvents = events.filter((e) => e.type === "upcoming");
  const pastEvents = events.filter((e) => e.type === "past");

  return (
    <div className="flex flex-col flex-1">
      <Hero />

      <main className="flex-1">
        <section id="upcoming" className="scroll-mt-20 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <h2 className="text-3xl font-bold text-white">
              Upcoming Events
            </h2>
            <p className="mt-2 text-zinc-400">
              Join us in our upcoming gatherings and be part of something greater.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={setSelectedEvent}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="events"
          className="scroll-mt-20 bg-zinc-950"
        >
          <div className="mx-auto max-w-7xl px-6 pb-20">
            <h2 className="text-3xl font-bold text-white">
              Past Events
            </h2>
            <p className="mt-2 text-zinc-400">
              Relive the moments through our photo galleries.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={setSelectedEvent}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Modal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
