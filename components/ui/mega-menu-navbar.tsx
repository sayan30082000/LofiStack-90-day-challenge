"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MegaMenuLink {
  label: string;
  href: string;
  /** One line under the label. */
  description?: string;
  /** Icon shown in a tile before the label. */
  icon?: ReactNode;
  /** Small pill after the label, e.g. "New". */
  badge?: string;
  /** Shown but not clickable. */
  disabled?: boolean;
}

export interface MegaMenuColumn {
  /** Column heading. */
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuFeatured {
  /** Small text above the title, e.g. "New". */
  eyebrow?: string;
  title: string;
  description?: string;
  href: string;
  /** Call to action text at the bottom of the card. */
  cta?: string;
  /** Artwork at the top of the card: an image, SVG or gradient block. */
  media?: ReactNode;
}

export interface MegaMenuItem {
  label: string;
  /** Plain link when the item has no columns. */
  href?: string;
  /** Columns of links. Makes the item a disclosure button that opens a full-width panel. */
  columns?: MegaMenuColumn[];
  /** Promo card at the end of the panel. */
  featured?: MegaMenuFeatured;
  disabled?: boolean;
}

export interface MegaMenuNavbarProps {
  /** Logo content, e.g. an SVG and a wordmark. */
  logo: ReactNode;
  /** Where the logo links to. */
  logoHref?: string;
  /** Accessible name of the logo link. */
  logoLabel?: string;
  /** Top-level items. */
  items: MegaMenuItem[];
  /** Right-side actions on wide screens, e.g. sign in and sign up buttons. */
  actions?: ReactNode;
  /** Actions at the bottom of the mobile menu. Defaults to `actions`. */
  mobileActions?: ReactNode;
  /** Sticks to the top of the nearest scroll container. */
  sticky?: boolean;
  /** Marks the matching link with aria-current="page" and its top item as active. */
  activeHref?: string;
  /** Hover intent delay before a panel opens, in ms. */
  openDelay?: number;
  /** Delay before a panel closes after the pointer leaves, in ms. */
  closeDelay?: number;
  /** Scroll distance in px after which the header gets its blur and shadow. */
  scrollThreshold?: number;
  /** Called on every link click, before menus close. Call event.preventDefault() for client-side routing. */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Accessible name of the navigation. */
  label?: string;
  /** Accessible names of the hamburger button. */
  menuLabels?: { open: string; close: string };
  /** Classes for the header. */
  className?: string;
  /** Classes for the inner width container, shared by the bar and the panels. */
  containerClassName?: string;
}

/** Matches the @5xl container query (64rem) used for the desktop layout. */
const MOBILE_BREAKPOINT = 1024;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const STYLE = `
@keyframes lofi-mega-menu-navbar-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.lofi-mega-menu-navbar-stagger > * { animation: lofi-mega-menu-navbar-in 260ms ease-out both; }
.lofi-mega-menu-navbar-stagger > :nth-child(2) { animation-delay: 40ms; }
.lofi-mega-menu-navbar-stagger > :nth-child(3) { animation-delay: 80ms; }
.lofi-mega-menu-navbar-stagger > :nth-child(4) { animation-delay: 120ms; }
.lofi-mega-menu-navbar-stagger > :nth-child(n+5) { animation-delay: 160ms; }
@media (prefers-reduced-motion: reduce) {
  .lofi-mega-menu-navbar-stagger > * { animation: none; }
}
`;

/** Nearest scrollable ancestor, or null for the window. */
function scrollParentOf(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

export function MegaMenuNavbar({
  logo,
  logoHref = "/",
  logoLabel = "Home",
  items,
  actions,
  mobileActions,
  sticky = true,
  activeHref,
  openDelay = 150,
  closeDelay = 200,
  scrollThreshold = 8,
  onNavigate,
  label = "Main",
  menuLabels = { open: "Open menu", close: "Close menu" },
  className,
  containerClassName = "mx-auto w-full max-w-7xl px-4 sm:px-6",
}: MegaMenuNavbarProps) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<number | null>(null);
  const [mobileHeight, setMobileHeight] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const topRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedAt = useRef(0);
  const focusFirstLink = useRef<number | null>(null);
  const scrollParent = useRef<HTMLElement | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const activeTop = items.findIndex(
    (item) => item.href === activeHref || item.columns?.some((c) => c.links.some((l) => l.href === activeHref)),
  );

  /* ---------- Scroll state, breakpoint and outside clicks ---------- */

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const parent = scrollParentOf(header);
    scrollParent.current = parent;
    const target: HTMLElement | Window = parent ?? window;
    const read = () => setScrolled((parent ? parent.scrollTop : window.scrollY) > scrollThreshold);
    const frame = requestAnimationFrame(read);
    target.addEventListener("scroll", read, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", read);
    };
  }, [scrollThreshold]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const ro = new ResizeObserver(([entry]) => {
      const wide = entry.contentRect.width >= MOBILE_BREAKPOINT;
      if (wide) setMobileOpen(false);
      else setOpen(null);
    });
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // After opening with ArrowDown, move focus into the panel.
  useEffect(() => {
    if (open === null || focusFirstLink.current !== open) return;
    focusFirstLink.current = null;
    panelRefs.current[open]?.querySelector<HTMLElement>("a[href]")?.focus();
  }, [open]);

  /* ---------- Desktop: hover intent and clicks ---------- */

  const openNow = (i: number) => {
    clearTimers();
    setOpen(i);
  };

  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), closeDelay);
  };

  const onTopEnter = (i: number, e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const item = items[i];
    if (!item.columns || item.disabled) {
      if (open !== null) scheduleClose();
      return;
    }
    clearTimers();
    if (open !== null) {
      // A panel is already showing: switch instantly instead of waiting again.
      setOpen(i);
      return;
    }
    openTimer.current = setTimeout(() => {
      hoverOpenedAt.current = performance.now();
      setOpen(i);
    }, openDelay);
  };

  const onTopClick = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    // Ignore the click that lands right after hover already opened this panel.
    if (open === i && e.timeStamp - hoverOpenedAt.current < 400) return;
    hoverOpenedAt.current = 0;
    if (open === i) {
      clearTimers();
      setOpen(null);
    } else openNow(i);
  };

  const closeAndFocus = (i: number) => {
    clearTimers();
    setOpen(null);
    topRefs.current[i]?.focus();
  };

  const onTopKeyDown = (i: number, e: KeyboardEvent<HTMLElement>) => {
    const count = items.length;
    const move = (to: number) => {
      e.preventDefault();
      setOpen(null);
      topRefs.current[(to + count) % count]?.focus();
    };
    switch (e.key) {
      case "ArrowRight":
        return move(i + 1);
      case "ArrowLeft":
        return move(i - 1);
      case "Home":
        return move(0);
      case "End":
        return move(count - 1);
      case "ArrowDown":
        if (items[i].columns && !items[i].disabled) {
          e.preventDefault();
          focusFirstLink.current = i;
          if (open === i) {
            focusFirstLink.current = null;
            panelRefs.current[i]?.querySelector<HTMLElement>("a[href]")?.focus();
          } else openNow(i);
        }
        return;
      case "Escape":
        if (open !== null) {
          e.preventDefault();
          closeAndFocus(open);
        }
        return;
    }
  };

  const onPanelKeyDown = (i: number, e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      return closeAndFocus(i);
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const links = [...(panelRefs.current[i]?.querySelectorAll<HTMLElement>("a[href]") ?? [])];
    if (links.length === 0) return;
    e.preventDefault();
    const at = links.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? links.length - 1 : e.key === "ArrowDown" ? (at + 1) % links.length : (at - 1 + links.length) % links.length;
    links[next]?.focus();
  };

  const onItemBlur = (i: number, e: FocusEvent<HTMLLIElement>) => {
    if (open === i && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null);
  };

  /* ---------- Mobile menu ---------- */

  const measureMobile = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;
    const parent = scrollParent.current;
    const bottom = parent ? parent.getBoundingClientRect().bottom : window.innerHeight;
    setMobileHeight(Math.max(240, bottom - header.getBoundingClientRect().bottom));
  }, []);

  const toggleMobile = () => {
    if (!mobileOpen) measureMobile();
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const panel = mobileRef.current;
    const lockTarget = scrollParentOf(headerRef.current) ?? document.documentElement;
    const prevOverflow = lockTarget.style.overflow;
    lockTarget.style.overflow = "hidden";

    const focusables = () =>
      [toggleRef.current, ...(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (el): el is HTMLElement => !!el && !el.closest("[inert]") && el.getClientRects().length > 0,
      );
    focusables()[1]?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobile();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const inside = list.includes(document.activeElement as HTMLElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", measureMobile);
    return () => {
      lockTarget.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measureMobile);
    };
  }, [mobileOpen, closeMobile, measureMobile]);

  /* ---------- Links ---------- */

  const onLinkClick = (href: string, e: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.(href, e);
    clearTimers();
    setOpen(null);
    setMobileOpen(false);
  };

  const renderLink = (link: MegaMenuLink, compact = false) => {
    const current = link.href === activeHref;
    const body = (
      <>
        {link.icon && (
          <span
            aria-hidden
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg border transition-colors motion-reduce:transition-none [&_svg]:size-[18px]",
              compact ? "size-9" : "size-10",
              current
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "border-zinc-200 bg-white text-zinc-600 group-hover/link:border-indigo-200 group-hover/link:bg-indigo-50 group-hover/link:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover/link:border-indigo-500/40 dark:group-hover/link:bg-indigo-500/15 dark:group-hover/link:text-indigo-300",
            )}
          >
            {link.icon}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
            {link.label}
            {link.badge && (
              <span className="rounded-full bg-indigo-50 px-1.5 py-px text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {link.badge}
              </span>
            )}
          </span>
          {link.description && (
            <span className={cn("text-[13px] leading-snug text-zinc-600 dark:text-zinc-400", compact && "line-clamp-1")}>
              {link.description}
            </span>
          )}
        </span>
      </>
    );
    const base = cn("group/link flex min-h-10 items-start gap-3 rounded-lg p-2 text-sm", compact && "items-center");
    if (link.disabled) {
      return (
        <span aria-disabled="true" className={cn(base, "cursor-not-allowed opacity-50")}>
          {body}
        </span>
      );
    }
    return (
      <a
        href={link.href}
        aria-current={current ? "page" : undefined}
        onClick={(e) => onLinkClick(link.href, e)}
        className={cn(
          base,
          "outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200/70 motion-reduce:transition-none dark:hover:bg-zinc-800/70 dark:active:bg-zinc-800",
          current && "bg-indigo-50/60 dark:bg-indigo-500/10",
        )}
      >
        {body}
      </a>
    );
  };

  const renderFeatured = (f: MegaMenuFeatured, compact = false) => (
    <a
      href={f.href}
      onClick={(e) => onLinkClick(f.href, e)}
      className={cn(
        "group/feat flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 outline-none transition-[border-color,box-shadow] hover:border-indigo-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50",
        compact && "flex-row items-stretch",
      )}
    >
      {f.media && (
        <span aria-hidden className={cn("block shrink-0 overflow-hidden", compact ? "w-24" : "aspect-[16/9]")}>
          <span className="block size-full transition-transform duration-500 group-hover/feat:scale-105 motion-reduce:transition-none motion-reduce:group-hover/feat:scale-100">
            {f.media}
          </span>
        </span>
      )}
      <span className={cn("flex flex-col gap-1", compact ? "p-3" : "p-4")}>
        {f.eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{f.eyebrow}</span>
        )}
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.title}</span>
        {f.description && !compact && <span className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">{f.description}</span>}
        {f.cta && (
          <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-indigo-700 dark:text-indigo-300">
            {f.cta}
            <ArrowRight className="size-3.5 transition-transform group-hover/feat:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          </span>
        )}
      </span>
    </a>
  );

  const topBase =
    "inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none";

  /* ---------- Render ---------- */

  return (
    <header
      ref={headerRef}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && open !== null) scheduleClose();
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && closeTimer.current && open !== null) {
          clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
      }}
      className={cn(
        "@container z-40 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none",
        sticky ? "sticky top-0" : "relative",
        scrolled || open !== null || mobileOpen
          ? "border-zinc-200/80 bg-white/80 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)] backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)]"
          : "border-transparent bg-white dark:bg-zinc-950",
        className,
      )}
    >
      <style href="lofi-mega-menu-navbar" precedence="default">
        {STYLE}
      </style>

      <div
        className={cn(
          containerClassName,
          "flex items-center gap-2 transition-[height] duration-300 motion-reduce:transition-none",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <a
          href={logoHref}
          aria-label={logoLabel}
          onClick={(e) => onLinkClick(logoHref, e)}
          className="-ml-1.5 mr-2 inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {logo}
        </a>

        <nav aria-label={label} className="hidden min-w-0 flex-1 @5xl:block">
          <ul className="flex items-center gap-0.5">
            {items.map((item, i) => {
              const isOpen = open === i;
              const isActive = activeTop === i;
              const panelId = `${id}-panel-${i}`;
              const setRef = (el: HTMLElement | null) => {
                topRefs.current[i] = el;
              };
              const tone = isOpen
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : isActive
                  ? "text-indigo-700 hover:bg-zinc-100 dark:text-indigo-300 dark:hover:bg-zinc-800/70"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50";

              if (!item.columns) {
                return (
                  <li key={item.label}>
                    {item.disabled || !item.href ? (
                      <span
                        ref={setRef}
                        tabIndex={-1}
                        aria-disabled="true"
                        onKeyDown={(e) => onTopKeyDown(i, e)}
                        className={cn(topBase, "cursor-not-allowed text-zinc-400 dark:text-zinc-600")}
                      >
                        {item.label}
                      </span>
                    ) : (
                      <a
                        ref={setRef}
                        href={item.href}
                        aria-current={item.href === activeHref ? "page" : undefined}
                        onPointerEnter={(e) => onTopEnter(i, e)}
                        onKeyDown={(e) => onTopKeyDown(i, e)}
                        onClick={(e) => onLinkClick(item.href!, e)}
                        className={cn(topBase, tone, "active:bg-zinc-200 dark:active:bg-zinc-700")}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              }

              const cols = item.columns.length;
              return (
                <li key={item.label} onBlur={(e) => onItemBlur(i, e)}>
                  <button
                    ref={setRef}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    disabled={item.disabled}
                    onPointerEnter={(e) => onTopEnter(i, e)}
                    onClick={(e) => onTopClick(i, e)}
                    onKeyDown={(e) => onTopKeyDown(i, e)}
                    className={cn(topBase, tone, "active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-50 dark:active:bg-zinc-700")}
                  >
                    {item.label}
                    {isActive && !isOpen && <span aria-hidden className="size-1 rounded-full bg-indigo-500" />}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 opacity-60 transition-transform duration-200 motion-reduce:transition-none",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <div
                    ref={(el) => {
                      panelRefs.current[i] = el;
                    }}
                    id={panelId}
                    tabIndex={-1}
                    inert={!isOpen}
                    onKeyDown={(e) => onPanelKeyDown(i, e)}
                    className={cn(
                      "absolute inset-x-0 top-full border-b border-zinc-200 bg-white shadow-[0_24px_48px_-24px_rgb(0_0_0/0.25)] outline-none transition-[opacity,translate,visibility] duration-200 motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.7)]",
                      isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                    )}
                  >
                    <div
                      className={cn(containerClassName, "grid gap-x-8 gap-y-6 py-7", isOpen && "lofi-mega-menu-navbar-stagger")}
                      style={{
                        gridTemplateColumns: item.featured
                          ? `repeat(${cols}, minmax(0, 1fr)) minmax(15rem, 19rem)`
                          : `repeat(${cols}, minmax(0, 1fr))`,
                      }}
                    >
                      {item.columns.map((col, c) => {
                        const headingId = `${panelId}-col-${c}`;
                        return (
                          <div key={col.title} className="min-w-0">
                            <p
                              id={headingId}
                              className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                              {col.title}
                            </p>
                            <ul aria-labelledby={headingId} className="flex flex-col gap-0.5">
                              {col.links.map((link) => (
                                <li key={link.href + link.label}>{renderLink(link)}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                      {item.featured && <div className="min-w-0">{renderFeatured(item.featured)}</div>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {actions && <div className="ml-auto hidden shrink-0 items-center gap-2 @5xl:flex">{actions}</div>}

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={`${id}-mobile`}
          aria-label={mobileOpen ? menuLabels.close : menuLabels.open}
          onClick={toggleMobile}
          className="ml-auto inline-flex size-10 items-center justify-center rounded-lg text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 motion-reduce:transition-none @5xl:hidden dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
        >
          <span className="relative size-5">
            <Menu
              aria-hidden
              className={cn(
                "absolute inset-0 size-5 transition-[opacity,rotate] duration-200 motion-reduce:transition-none",
                mobileOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            />
            <X
              aria-hidden
              className={cn(
                "absolute inset-0 size-5 transition-[opacity,rotate] duration-200 motion-reduce:transition-none",
                mobileOpen ? "opacity-100" : "-rotate-90 opacity-0",
              )}
            />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div
          ref={mobileRef}
          id={`${id}-mobile`}
          style={{ height: mobileHeight ?? undefined }}
          className="absolute inset-x-0 top-full flex flex-col overflow-y-auto overscroll-contain border-t border-zinc-200 bg-white motion-safe:animate-[lofi-mega-menu-navbar-in_200ms_ease-out] @5xl:hidden dark:border-zinc-800 dark:bg-zinc-950"
        >
          <nav aria-label={label} className={cn(containerClassName, "flex-1 py-3")}>
            <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item, i) => {
                if (!item.columns) {
                  return (
                    <li key={item.label}>
                      {item.disabled || !item.href ? (
                        <span aria-disabled="true" className="flex h-12 items-center px-2 text-base font-medium text-zinc-400 dark:text-zinc-600">
                          {item.label}
                        </span>
                      ) : (
                        <a
                          href={item.href}
                          aria-current={item.href === activeHref ? "page" : undefined}
                          onClick={(e) => onLinkClick(item.href!, e)}
                          className="flex h-12 items-center rounded-lg px-2 text-base font-medium text-zinc-900 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-100 dark:hover:bg-zinc-800/70"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  );
                }
                const expanded = mobileSection === i;
                const sectionId = `${id}-m-${i}`;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={sectionId}
                      disabled={item.disabled}
                      onClick={() => setMobileSection(expanded ? null : i)}
                      className="flex h-12 w-full items-center justify-between rounded-lg px-2 text-left text-base font-medium text-zinc-900 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800/70"
                    >
                      <span className="flex items-center gap-2">
                        {item.label}
                        {activeTop === i && <span aria-hidden className="size-1.5 rounded-full bg-indigo-500" />}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={cn("size-5 text-zinc-500 transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")}
                      />
                    </button>
                    <div
                      id={sectionId}
                      inert={!expanded}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-4 pb-4 pt-1">
                          {item.columns.map((col, c) => (
                            <div key={col.title}>
                              <p id={`${sectionId}-col-${c}`} className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {col.title}
                              </p>
                              <ul aria-labelledby={`${sectionId}-col-${c}`} className="grid gap-0.5 @md:grid-cols-2">
                                {col.links.map((link) => (
                                  <li key={link.href + link.label}>{renderLink(link, true)}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {item.featured && renderFeatured(item.featured, true)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
          {(mobileActions ?? actions) && (
            <div className={cn(containerClassName, "sticky bottom-0 flex flex-col gap-2 border-t border-zinc-200 bg-white/95 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 [&>*]:w-full")}>
              {mobileActions ?? actions}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
