import { Event } from "@/lib/types";

export const events: Event[] = [
  {
    id: "1",
    title: "Loveworld Music Festival 2026",
    date: "March 15, 2026",
    description:
      "A night of worship and celebration featuring gospel artists from across the nation. Thousands gathered to experience a transformative evening of music and ministry.",
    type: "past",
    galleryImages: [
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    ],
  },
  {
    id: "2",
    title: "Annual Leadership Conference",
    date: "January 10, 2026",
    description:
      "Empowering leaders from various sectors with kingdom principles for effective governance and community transformation.",
    type: "past",
    galleryImages: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80",
    ],
  },
  {
    id: "3",
    title: "Community Outreach Program",
    date: "December 5, 2024",
    description:
      "Extending love and support to local communities through food drives, medical checkups, and educational support for children.",
    type: "past",
    galleryImages: [
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80",
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80",
    ],
  },
  {
    id: "4",
    title: "Global Youth Summit 2026",
    date: "August 20, 2026",
    description:
      "An international gathering of young leaders ready to make an impact. Featuring workshops, networking sessions, and inspiring keynotes.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer", variant: "primary" },
      { label: "Donate", href: "#donate", variant: "secondary" },
    ],
  },
  {
    id: "5",
    title: "Worship Night: Awakening",
    date: "September 12, 2026",
    description:
      "Join us for an evening of worship and prayer as we seek a fresh outpouring of God's presence. All are welcome.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer", variant: "primary" },
      { label: "Donate", href: "#donate", variant: "secondary" },
    ],
  },
  {
    id: "6",
    title: "ICLC 2026",
    date: "October 15, 2026",
    description:
      "The International Church of the Living Christ annual gathering — a global convergence of believers for worship, teaching, and divine encounter.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-iclc", variant: "primary" },
      { label: "Donate", href: "#donate-iclc", variant: "secondary" },
    ],
  },
  {
    id: "7",
    title: "Healing Streams Live Healing Services",
    date: "Ongoing — Quarterly Broadcasts",
    description:
      "One of the largest global healing crusades aimed at bringing salvation, deliverance, and restoration to millions worldwide.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-hsl", variant: "primary" },
      { label: "Donate", href: "#donate-hsl", variant: "secondary" },
    ],
  },
  {
    id: "8",
    title: "Global Communion Services",
    date: "First Sunday — Monthly",
    description:
      "Monthly broadcasts held on the first Sunday of every month to pray, share testimonies, and reveal the spiritual Word of the Month.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-gcs", variant: "primary" },
      { label: "Donate", href: "#donate-gcs", variant: "secondary" },
    ],
  },
  {
    id: "9",
    title: "Global Days of Prayer",
    date: "Quarterly — Multi-Day Events",
    description:
      "Extended, multi-day live events focused on fasting, spiritual warfare, and interceding for governments and nations.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-gdop", variant: "primary" },
      { label: "Donate", href: "#donate-gdop", variant: "secondary" },
    ],
  },
  {
    id: "10",
    title: "Your LoveWorld Specials",
    date: "Ongoing — Broadcast Series",
    description:
      "Specialized teaching and prayer broadcast series hosted for phases across the LoveWorld television network.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-yls", variant: "primary" },
      { label: "Donate", href: "#donate-yls", variant: "secondary" },
    ],
  },
  {
    id: "11",
    title: "Global Ministers' Classroom",
    date: "Ongoing — Online Program",
    description:
      "A targeted online program providing training, strategy, and fellowship for church leaders, pastors, and ministers globally.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-gmc", variant: "primary" },
      { label: "Donate", href: "#donate-gmc", variant: "secondary" },
    ],
  },
  {
    id: "12",
    title: "Praise Nights",
    date: "Monthly — Broadcast",
    description:
      "Special nights of pure worship, praise, and thanksgiving broadcast to an international audience.",
    type: "upcoming",
    galleryImages: [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
    ],
    actionLinks: [
      { label: "Volunteer", href: "#volunteer-pn", variant: "primary" },
      { label: "Donate", href: "#donate-pn", variant: "secondary" },
    ],
  },
];
