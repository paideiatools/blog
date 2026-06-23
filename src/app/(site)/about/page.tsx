import type { Metadata } from "next";
import { ArrowRight, BookOpen, MessagesSquare, Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "About Paideias",
  description:
    "Paideias is a qualitative data analysis app built for researchers. Learn about the app and the community behind this blog.",
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    icon: BookOpen,
    title: "Learn in public",
    body: "Practical methodology articles — from designing interview guides to defending your coding decisions — written in plain language.",
  },
  {
    icon: MessagesSquare,
    title: "A real community",
    body: "Every article is a conversation. Comment, question, and share your own field experience with researchers around the world.",
  },
  {
    icon: Quote,
    title: "Built by practitioners",
    body: "This blog is written by the team behind Paideias and guest researchers who use qualitative methods every day.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
          Research is better when it&apos;s shared
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          <em>Paideia</em> (παιδεία) is the Greek ideal of deep, rounded
          education. We named our qualitative analysis app after it — and this
          blog is where that spirit lives: a place for researchers to learn,
          argue, and grow together.
        </p>
      </header>

      <div className="mt-16 grid gap-7 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="ring-card p-8">
            <pillar.icon className="text-accent" size={26} />
            <h2 className="mt-4 font-serif text-xl font-bold">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pillar.body}
            </p>
          </div>
        ))}
      </div>

      <section className="ring-card mt-20 px-8 py-14 md:px-16">
        <div className="md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-medium leading-snug">
              The Paideias app
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Paideias is a modern qualitative data analysis tool. Import
              transcripts, code with ease, write memos alongside your data, and
              move from raw text to defensible themes — without fighting your
              software. Everything you read on this blog reflects how we think
              about good qualitative practice, and it&apos;s baked into the app.
            </p>
          </div>
          <a
            href="https://paideias.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-dark md:mt-0"
          >
            Try it free <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-2xl text-center">
        <h2 className="font-serif text-2xl font-bold">Want to write for us?</h2>
        <p className="mt-3 text-muted">
          We welcome guest essays from qualitative researchers — methods
          reflections, tool walkthroughs, and stories from fieldwork. Reach out
          at{" "}
          <a
            href="mailto:hello@paideias.org"
            className="font-medium text-accent underline underline-offset-4"
          >
            hello@paideias.org
          </a>
          .
        </p>
      </section>
    </div>
  );
}
