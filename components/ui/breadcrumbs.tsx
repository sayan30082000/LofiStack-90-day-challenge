"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, ChevronRight, CornerDownRight, Ellipsis, House } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  /** Visible text. Also the accessible name, even when it is visually truncated. */
  label: string;
  /** Link target. Items without one render as plain text. */
  href?: string;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Shown as muted, non-interactive text (e.g. a folder the user can't open). */
  disabled?: boolean;
}

/** What `renderLink` receives. Spread it onto your link component. */
export interface BreadcrumbLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  /** The item being rendered, for analytics or prefetch decisions. */
  item: BreadcrumbItem;
}

export type BreadcrumbSeparator = "chevron" | "slash" | ReactNode;

export interface BreadcrumbsProps {
  /** Trail from the root to the current page. The last item is the current page. */
  items: BreadcrumbItem[];
  /** Collapse the middle into a "…" menu when there are more items than this. */
  maxItems?: number;
  /** "chevron", "slash" or any node (e.g. an icon). */
  separator?: BreadcrumbSeparator;
  /** Items kept before the "…" when collapsed. */
  itemsBeforeCollapse?: number;
  /** Items kept after the "…" when collapsed. At least 1, so the current page stays visible. */
  itemsAfterCollapse?: number;
  /** Renders every link, e.g. `(p) => <Link {...p} />` for next/link. Defaults to a plain anchor. */
  renderLink?: (props: BreadcrumbLinkProps) => ReactNode;
  /** Show a house icon on the first item (unless it has its own icon). */
  showHomeIcon?: boolean;
  /** With showHomeIcon, hide the first item's label visually (it stays readable by screen readers). */
  homeIconOnly?: boolean;
  /** Below ~448px of available width, replace the trail with a compact "← Parent" link. */
  mobileBackLink?: boolean;
  /** Visible text of the compact back link. */
  backLabel?: (parent: BreadcrumbItem) => string;
  /** Accessible name of the compact back link. */
  backAriaLabel?: (parent: BreadcrumbItem) => string;
  /** Accessible name of the nav landmark. */
  label?: string;
  /** Accessible name of the "…" button. */
  expandLabel?: (hiddenCount: number) => string;
  /** Labels with more characters than this width are truncated with a tooltip. Any CSS length. */
  maxLabelWidth?: string;
  /** Show a skeleton trail while the path is resolving. */
  loading?: boolean;
  /** Announced while loading. */
  loadingLabel?: string;
  /** Number of skeleton crumbs. */
  loadingCount?: number;
  className?: string;
}

const defaultRenderLink = ({ href, className, children }: BreadcrumbLinkProps) => (
  <a href={href} className={className}>
    {children}
  </a>
);

const CRUMB =
  "relative inline-flex h-10 min-w-0 max-w-full items-center gap-1.5 rounded-md px-2 text-sm outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const LINK = cn(
  CRUMB,
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
);
const CURRENT = cn(CRUMB, "font-medium text-zinc-900 dark:text-zinc-50");
const MUTED = cn(CRUMB, "cursor-not-allowed text-zinc-500 dark:text-zinc-400");

function Separator({ separator }: { separator: BreadcrumbSeparator }) {
  return (
    <li role="presentation" aria-hidden className="flex shrink-0 items-center text-zinc-500 dark:text-zinc-400">
      {separator === "chevron" ? (
        <ChevronRight className="size-3.5" />
      ) : separator === "slash" ? (
        <span className="px-0.5 text-base font-light">/</span>
      ) : (
        separator
      )}
    </li>
  );
}

interface CrumbProps {
  item: BreadcrumbItem;
  icon?: ReactNode;
  hideLabel: boolean;
  current: boolean;
  maxLabelWidth: string;
  renderLink: (props: BreadcrumbLinkProps) => ReactNode;
  /** Align the tooltip to the right edge (for the last crumb). */
  alignEnd: boolean;
}

/** One crumb. Measures its own label so a tooltip appears only when the text is actually cut off. */
function Crumb({ item, icon, hideLabel, current, maxLabelWidth, renderLink, alignEnd }: CrumbProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = labelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTruncated(el.scrollWidth > el.clientWidth + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.label]);

  const content = (
    <>
      {icon && (
        <span aria-hidden className="inline-flex shrink-0 [&>svg]:size-4">
          {icon}
        </span>
      )}
      <span ref={labelRef} className={cn("truncate", hideLabel && "sr-only")} style={{ maxWidth: maxLabelWidth }}>
        {item.label}
      </span>
    </>
  );

  const tooltip = truncated && !hideLabel && (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-full z-20 mt-1 w-max max-w-[min(20rem,80vw)] rounded-md bg-zinc-900 px-2 py-1 text-xs font-normal break-words whitespace-normal text-white opacity-0 shadow-lg transition-opacity motion-reduce:transition-none dark:bg-zinc-100 dark:text-zinc-900",
        "group-hover/crumb:opacity-100 group-focus-within/crumb:opacity-100",
        alignEnd ? "right-0" : "left-0",
      )}
    >
      {item.label}
    </span>
  );

  let node: ReactNode;
  if (current) {
    node = (
      // Focusable only when truncated, so keyboard users can reveal the full label.
      <span aria-current="page" tabIndex={truncated ? 0 : undefined} className={CURRENT}>
        {content}
      </span>
    );
  } else if (item.href && !item.disabled) {
    node = renderLink({ href: item.href, className: LINK, children: content, item });
  } else {
    node = (
      <span aria-disabled={item.disabled || undefined} className={item.disabled ? MUTED : cn(CRUMB, "text-zinc-600 dark:text-zinc-400")}>
        {content}
      </span>
    );
  }

  return (
    <li className="group/crumb relative flex min-w-0 items-center">
      {node}
      {tooltip}
    </li>
  );
}

interface OverflowMenuProps {
  hidden: BreadcrumbItem[];
  expandLabel: (count: number) => string;
  renderLink: (props: BreadcrumbLinkProps) => ReactNode;
}

/** The "…" disclosure. Arrow keys move through the hidden links, Escape closes and returns focus. */
function OverflowMenu({ hidden, expandLabel, renderLink }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const focusables = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);

  const focusAt = (i: number) => {
    const els = focusables();
    if (els.length === 0) return;
    els[(i + els.length) % els.length].focus();
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const last = e.key === "ArrowUp";
      // Wait for the list to render before moving focus into it.
      requestAnimationFrame(() => focusAt(last ? -1 : 0));
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const els = focusables();
    const i = els.indexOf(document.activeElement as HTMLElement);
    let handled = true;
    if (e.key === "ArrowDown") focusAt(i + 1);
    else if (e.key === "ArrowUp") focusAt(i - 1);
    else if (e.key === "Home") focusAt(0);
    else if (e.key === "End") focusAt(-1);
    else if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else handled = false;
    if (handled) e.preventDefault();
  };

  const onBlur = (e: FocusEvent<HTMLLIElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <li ref={wrapRef} className="relative flex shrink-0 items-center" onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={expandLabel(hidden.length)}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md text-zinc-600 outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
          open && "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        )}
      >
        <Ellipsis className="size-4" aria-hidden />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={menuId}
          onKeyDown={onListKey}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="absolute left-0 top-full z-30 mt-1 w-max min-w-48 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10 motion-safe:animate-[lofi-breadcrumbs-in_140ms_ease-out] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
        >
          {hidden.map((item, i) => {
            const inner = (
              <>
                {/* Indent each level a little so the hidden part of the path reads like a tree. */}
                <span aria-hidden className="shrink-0" style={{ width: Math.min(i, 4) * 12 }} />
                {i > 0 && <CornerDownRight aria-hidden className="size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />}
                {item.icon && (
                  <span aria-hidden className="inline-flex shrink-0 [&>svg]:size-4">
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </>
            );
            const cls = "flex h-10 w-full min-w-0 items-center gap-2 rounded-lg pl-2.5 pr-3 text-sm outline-none";
            return (
              <li key={`${item.label}-${i}`}>
                {item.href && !item.disabled ? (
                  renderLink({
                    href: item.href,
                    item,
                    className: cn(
                      cls,
                      "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:bg-zinc-800",
                    ),
                    children: inner,
                  })
                ) : (
                  <span aria-disabled={item.disabled || undefined} className={cn(cls, "text-zinc-500 dark:text-zinc-400")}>
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/**
 * Accessible breadcrumb trail. Collapses long paths into a "…" menu, truncates long labels
 * with a tooltip and can swap to a compact "← Parent" link when space is tight.
 */
export function Breadcrumbs({
  items,
  maxItems = 4,
  separator = "chevron",
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  renderLink = defaultRenderLink,
  showHomeIcon = false,
  homeIconOnly = false,
  mobileBackLink = false,
  backLabel = (p) => p.label,
  backAriaLabel = (p) => `Back to ${p.label}`,
  label = "Breadcrumb",
  expandLabel = (n) => `Show ${n} more`,
  maxLabelWidth = "12rem",
  loading = false,
  loadingLabel = "Loading breadcrumb",
  loadingCount = 3,
  className,
}: BreadcrumbsProps) {
  if (loading) {
    return (
      <nav aria-label={label} aria-busy className={cn("w-full", className)}>
        <ol className="flex h-10 items-center gap-2 px-2">
          {Array.from({ length: Math.max(1, loadingCount) }, (_, i) => (
            <Fragment key={i}>
              {i > 0 && <Separator separator={separator} />}
              <li
                aria-hidden
                className="h-3.5 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800"
                style={{ width: `${4 + ((i * 3) % 4)}rem` }}
              />
            </Fragment>
          ))}
        </ol>
        <span className="sr-only" role="status">
          {loadingLabel}
        </span>
      </nav>
    );
  }

  if (items.length === 0) return null;

  const total = items.length;
  const before = Math.max(0, Math.min(itemsBeforeCollapse, total - 1));
  const after = Math.max(1, Math.min(itemsAfterCollapse, total - before));
  const collapse = total > maxItems && before + after < total;

  type Entry = { kind: "item"; item: BreadcrumbItem; index: number } | { kind: "more"; hidden: BreadcrumbItem[] };
  const entries: Entry[] = collapse
    ? [
        ...items.slice(0, before).map((item, i) => ({ kind: "item" as const, item, index: i })),
        { kind: "more" as const, hidden: items.slice(before, total - after) },
        ...items.slice(total - after).map((item, i) => ({ kind: "item" as const, item, index: total - after + i })),
      ]
    : items.map((item, index) => ({ kind: "item" as const, item, index }));

  const parent = [...items.slice(0, -1)].reverse().find((i) => i.href && !i.disabled);
  const compact = mobileBackLink && parent;

  return (
    <nav aria-label={label} className={cn("@container w-full min-w-0", className)}>
      <style href="lofi-breadcrumbs" precedence="default">
        {`@keyframes lofi-breadcrumbs-in { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }`}
      </style>

      {compact && (
        <div className="@md:hidden">
          {renderLink({
            href: parent.href!,
            item: parent,
            className: cn(LINK, "-ml-2 font-medium text-zinc-700 dark:text-zinc-300"),
            children: (
              <>
                <ArrowLeft aria-hidden className="size-4 shrink-0" />
                <span className="sr-only">{backAriaLabel(parent)}</span>
                <span aria-hidden className="truncate">
                  {backLabel(parent)}
                </span>
              </>
            ),
          })}
        </div>
      )}

      <ol className={cn("min-w-0 items-center gap-0.5", compact ? "hidden @md:flex" : "flex")}>
        {entries.map((entry, i) => (
          <Fragment key={entry.kind === "item" ? `i-${entry.index}` : "more"}>
            {i > 0 && <Separator separator={separator} />}
            {entry.kind === "more" ? (
              <OverflowMenu hidden={entry.hidden} expandLabel={expandLabel} renderLink={renderLink} />
            ) : (
              <Crumb
                item={entry.item}
                icon={entry.item.icon ?? (entry.index === 0 && showHomeIcon ? <House /> : undefined)}
                hideLabel={entry.index === 0 && showHomeIcon && homeIconOnly}
                current={entry.index === total - 1}
                maxLabelWidth={maxLabelWidth}
                renderLink={renderLink}
                alignEnd={entry.index === total - 1 && total > 1}
              />
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
