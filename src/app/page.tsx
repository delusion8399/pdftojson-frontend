"use client";

import type React from "react";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

function parseMaybeJsonFromText(input: string): unknown {
  const trimmed = input.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fence ? fence[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {}
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const sub = candidate.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(sub);
    } catch {}
  }
  return input;
}

type DemoStep = "upload" | "parsing" | "review";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<DemoStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState<unknown | null>(null);
  const [schemaText, setSchemaText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsVisible(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Demo", href: "#demo" },
  ];

  const schemaValid = useMemo(() => {
    const t = schemaText.trim();
    if (!t) return true;
    try {
      JSON.parse(t);
      return true;
    } catch {
      return false;
    }
  }, [schemaText]);

  const onSelect = useCallback((f: File) => {
    setFile(f);
    setJsonPreview(null);
    setStep("upload");
  }, []);

  const onSend = useCallback(() => {
    if (!file) return;
    setStep("parsing");
    const form = new FormData();
    form.append("file", file);
    if (schemaText && schemaText.trim().length > 0) {
      form.append("schema", schemaText);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse`, {
      method: "POST",
      body: form,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`backend: ${res.status}`);
        const text = await res.text();
        const parsed = parseMaybeJsonFromText(text);
        setJsonPreview(parsed);
        setStep("review");
      })
      .catch((err) => {
        console.error(err);
        setJsonPreview({
          file: file.name,
          sizeBytes: file.size,
          error: "Backend request failed",
        });
        setStep("review");
      });
  }, [file, schemaText]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (
        f &&
        (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      )
        onSelect(f);
    },
    [onSelect]
  );

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (
        f &&
        (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      )
        onSelect(f);
      try {
        e.currentTarget.value = "";
      } catch {}
    },
    [onSelect]
  );

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <header className="fixed top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 h-16 flex items-center justify-between">
          <a
            href="#"
            className={`flex items-center gap-3 transition-all duration-500 ${
              isVisible ? "animate-slide-in-left" : "opacity-0"
            }`}
          >
            <div className="relative">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 7h8l6 5-6 5H5l6-5-6-5Z" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-glow" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              PDF to JSON
            </span>
          </a>

          <nav
            className={`hidden md:flex items-center gap-8 text-sm transition-all duration-700 delay-200 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            {navItems.map((n, i) => (
              <a
                key={n.label}
                href={n.href}
                className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {n.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <a
            href="#"
            className={`hidden sm:inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "400ms" }}
          >
            Start free
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 sm:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <section className="max-w-4xl">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Now with AI-powered extraction
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.02] bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Extract structured JSON from PDFs
            </h1>

            <p className="mt-6 sm:mt-8 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-3xl">
              Transform reports, invoices, and documents into clean JSON without
              manual cleanup.
              <span className="text-foreground font-medium">
                {" "}
                Fast, accurate, and built for production pipelines.
              </span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <a
                className="group inline-flex items-center rounded-xl px-6 py-3.5 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/25"
                href="#"
              >
                Start free
                <svg
                  className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
              <a
                className="inline-flex items-center rounded-xl px-6 py-3.5 text-base font-medium text-foreground border border-border bg-card/50 hover:bg-card transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                href="#demo"
              >
                <svg
                  className="mr-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Try the demo
              </a>
            </div>
          </div>

          <div
            className={`mt-16 transition-all duration-1000 delay-300 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-8 text-muted-foreground text-sm">
              <span className="font-medium">Trusted by teams at</span>
              <div className="h-px w-12 bg-border" />
              <div className="flex flex-wrap items-center gap-8">
                {["ACME", "NOVA", "PIXEL", "ORBIT"].map((company, i) => (
                  <span
                    key={company}
                    className="tracking-widest font-mono hover:text-foreground transition-colors duration-300"
                    style={{ animationDelay: `${i * 100 + 600}ms` }}
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 sm:mt-32 scroll-animate">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "High accuracy",
                body: "Robust parsing for tables, text blocks, and metadata with consistent structure.",
                icon: "🎯",
              },
              {
                title: "Developer-first",
                body: "Opinionated JSON shape designed for pipelines, analytics, and dashboards.",
                icon: "⚡",
              },
              {
                title: "Simple setup",
                body: "Drop in the UI or call the API. Get JSON in seconds.",
                icon: "🚀",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card/50 p-8 hover:bg-card transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 backdrop-blur-sm"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="mt-24 sm:mt-32 scroll-animate">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Try the demo</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="uppercase tracking-widest font-medium">
                Progress
              </span>
              <div className="h-px w-12 bg-border" />
              <ol className="flex items-center gap-4">
                {["Upload", "Schema", "Parse", "Review"].map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      i === (step === "upload" ? 0 : step === "parsing" ? 2 : 3)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        i ===
                        (step === "upload" ? 0 : step === "parsing" ? 2 : 3)
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="hidden sm:inline font-medium">
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm">
              {step === "upload" && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="group rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 p-12 text-center cursor-pointer transition-all duration-300 hover:bg-muted/50"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    📄
                  </div>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop a PDF here
                  </p>
                  <p className="text-muted-foreground mb-6">
                    or click to choose from your device
                  </p>
                  <div className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                    Browse files
                  </div>
                  <input
                    ref={fileInputRef}
                    onChange={onInput}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>
              )}

              {step === "parsing" && (
                <div className="flex items-center gap-4 text-foreground py-12 justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  <span className="text-lg font-medium">
                    Processing your PDF...
                  </span>
                </div>
              )}

              {step === "review" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-muted-foreground">
                      <span className="font-medium">{file?.name}</span> (
                      {file ? (file.size / 1024).toFixed(1) : "0.0"} KB)
                    </div>
                    <button
                      className="rounded-xl px-4 py-2 border border-border bg-card hover:bg-muted text-sm font-medium transition-all duration-300 hover:scale-105"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          typeof jsonPreview === "string"
                            ? jsonPreview
                            : JSON.stringify(jsonPreview, null, 2)
                        )
                      }
                    >
                      Copy JSON
                    </button>
                  </div>
                  {typeof jsonPreview === "string" ? (
                    <pre className="rounded-xl border border-border bg-muted/50 p-4 overflow-auto text-sm font-mono">
                      <code>{jsonPreview}</code>
                    </pre>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/50 p-4 overflow-auto text-sm">
                      <JSONPretty data={jsonPreview} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm">
              <h4 className="text-lg font-bold mb-2">Schema (optional)</h4>
              <p className="text-muted-foreground text-sm mb-6">
                Define the fields you want to extract from the PDF.
              </p>
              <textarea
                className="w-full min-h-48 rounded-xl border border-border bg-input p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                placeholder={
                  '{\n  "name": "string",\n  "application_no": "string"\n}\n\n– or –\n\nname, application_no, contact_no'
                }
              />
              <div
                className={`mt-3 text-sm font-medium ${
                  schemaValid ? "text-green-400" : "text-red-400"
                }`}
              >
                {!schemaText.trim()
                  ? "Optional (JSON object or comma-separated keys)"
                  : schemaValid
                  ? "✓ Schema valid"
                  : "✗ Invalid JSON"}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                  disabled={!file}
                  onClick={onSend}
                >
                  Send request
                </button>
                <button
                  className="rounded-xl px-4 py-3 text-sm font-medium border border-border bg-card hover:bg-muted transition-all duration-300 hover:scale-105"
                  onClick={() => setStep("upload")}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mt-24 sm:mt-32 scroll-animate">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload",
                body: "Drop a PDF or point the API to a URL.",
                icon: "📤",
              },
              {
                step: "2",
                title: "Parse",
                body: "We detect pages, text, and tables using smart heuristics.",
                icon: "🔍",
              },
              {
                step: "3",
                title: "Deliver",
                body: "Receive clean JSON ready for your app or data warehouse.",
                icon: "✨",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-border bg-card/50 p-8 hover:bg-card transition-all duration-500 hover:scale-105 backdrop-blur-sm"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <div className="text-primary text-sm font-medium mb-2">
                  Step {s.step}
                </div>
                <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {s.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {s.body}
                </p>

                {/* Connection line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 sm:mt-32 scroll-animate">
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card/50 to-primary/5 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
            <div>
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">
                Start in minutes
              </p>
              <p className="text-xl font-medium text-foreground">
                Upload a PDF and get JSON instantly. No credit card required.
              </p>
            </div>
            <a
              className="group inline-flex items-center rounded-xl px-6 py-3.5 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/25"
              href="#demo"
            >
              Try the demo
              <svg
                className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 sm:px-8 pb-12 mt-8 border-t border-border">
        <div className="pt-12 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            ©Shahid Aman {new Date().getFullYear()} PDF to JSON. Built with love{" "}
          </span>
          <div className="flex items-center gap-6">
            {["Status", "Privacy", "Terms"].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-foreground transition-colors duration-300 hover:scale-105"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
