const footerLinks = [
  {
    title: "Ministry",
    links: [
      { label: "About Us", href: "#" },
      { label: "Our Mission", href: "#" },
      { label: "Beliefs", href: "#" },
    ],
  },
  {
    title: "Departments",
    links: [
      { label: "Youth", href: "#" },
      { label: "Music", href: "#" },
      { label: "Outreach", href: "#" },
      { label: "Education", href: "#" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Contact Us", href: "#" },
      { label: "Prayer Request", href: "#" },
      { label: "Give Online", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-zinc-950">

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Loveworld Programs
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-200">
              Building a community of faith, hope, and love through service and
              worship.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-amber-400">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-blue-200 transition-colors hover:text-amber-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-center">
          <p className="text-xs text-blue-300">
            &copy; {new Date().getFullYear()} Loveworld Programs. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
