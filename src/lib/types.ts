export type EventType = "past" | "upcoming";

export interface ActionLink {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  type: EventType;
  galleryImages: string[];
  actionLinks?: ActionLink[];
}
