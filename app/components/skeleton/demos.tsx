"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Heart, MessageCircle, RefreshCw, Repeat2 } from "lucide-react";
import {
  Skeleton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonListItem,
  SkeletonProfile,
  SkeletonTableRow,
  SkeletonText,
  SkeletonWrapper,
  type SkeletonAnimation,
} from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const card = "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
const ANIMATIONS: SkeletonAnimation[] = ["shimmer", "pulse", "none"];

function Segmented({ value, onChange, label }: { value: SkeletonAnimation; onChange: (v: SkeletonAnimation) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
      {ANIMATIONS.map((a) => (
        <button
          key={a}
          type="button"
          aria-pressed={value === a}
          onClick={() => onChange(a)}
          className={cn(
            "h-9 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            value === a
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

/* ---------- Feed ---------- */

interface Post {
  id: number;
  name: string;
  handle: string;
  time: string;
  text: string;
  hue: number;
  image?: boolean;
  likes: number;
  replies: number;
}

const POSTS: Post[] = [
  { id: 1, name: "Maya Okafor", handle: "@maya", time: "2m", hue: 250, likes: 24, replies: 3, text: "Shipped the flip card today. Reduced motion gets a crossfade instead of the 3D turn." },
  { id: 2, name: "Leo Brandt", handle: "@leob", time: "1h", hue: 320, likes: 81, replies: 12, image: true, text: "Late-night build session soundtrack. Week 03 of the 90 day challenge is done." },
  { id: 3, name: "Ines Duarte", handle: "@ines", time: "3h", hue: 160, likes: 9, replies: 1, text: "Hot take: skeletons should match the real layout, or the page jumps when data lands." },
];

function Artwork() {
  return (
    <svg viewBox="0 0 400 180" className="h-40 w-full rounded-lg" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="skeleton-demo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#312e81" />
          <stop offset=".6" stopColor="#a21caf" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#skeleton-demo-sky)" />
      <circle cx="290" cy="120" r="46" fill="#fde68a" opacity=".9" />
      <path d="M0 150 L70 110 L130 140 L210 95 L290 140 L350 115 L400 135 L400 180 L0 180 Z" fill="#1e1b4b" opacity=".85" />
      <path d="M0 165 L90 140 L170 160 L260 135 L340 160 L400 150 L400 180 L0 180 Z" fill="#0f0d2e" />
    </svg>
  );
}

function PostView({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const initials = post.name.split(" ").map((s) => s[0]).join("");
  return (
    <article className={cn(card, "flex gap-3")}>
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ background: `linear-gradient(135deg, hsl(${post.hue} 70% 55%), hsl(${post.hue + 40} 70% 40%))` }}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
          <span className="font-semibold">{post.name}</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {post.handle} · {post.time}
          </span>
        </p>
        <p className="mt-1 text-sm leading-relaxed">{post.text}</p>
        {post.image && (
          <div className="mt-3">
            <Artwork />
          </div>
        )}
        <div className="-ml-2 mt-2 flex gap-1 text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            aria-pressed={liked}
            onClick={() => setLiked((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800",
              liked && "text-rose-600 dark:text-rose-400",
            )}
          >
            <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
            <span className="tabular-nums">{post.likes + (liked ? 1 : 0)}</span>
            <span className="sr-only">likes</span>
          </button>
          <span className="inline-flex h-10 items-center gap-1.5 px-2 text-xs">
            <MessageCircle className="size-4" aria-hidden />
            <span className="tabular-nums">{post.replies}</span>
            <span className="sr-only">replies</span>
          </span>
          <span className="inline-flex h-10 items-center gap-1.5 px-2 text-xs" aria-hidden>
            <Repeat2 className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Mirrors PostView's layout so nothing shifts when the real posts arrive. */
function PostSkeleton({ image }: { image?: boolean }) {
  return (
    <div className={cn(card, "flex gap-3")}>
      <SkeletonCircle size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex h-5 items-center gap-2">
          <Skeleton width={96} height={12} />
          <Skeleton width={64} height={10} />
        </div>
        <SkeletonText lines={2} lineHeight={10} gap={10} className="mt-2" />
        {image && <Skeleton height={160} radius={8} className="mt-3" />}
        <div className="mt-2 flex h-10 items-center gap-4">
          <Skeleton width={36} height={14} radius={6} />
          <Skeleton width={36} height={14} radius={6} />
          <Skeleton width={20} height={14} radius={6} />
        </div>
      </div>
    </div>
  );
}

export function FeedDemo() {
  const switchId = useId();
  const [loading, setLoading] = useState(true);
  const [animation, setAnimation] = useState<SkeletonAnimation>("shimmer");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const refresh = () => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1800);
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={loading}
            aria-labelledby={switchId}
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setLoading((v) => !v);
            }}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900",
              loading ? "bg-indigo-600 dark:bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "inline-block size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
                loading ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
          <span id={switchId} className="text-sm font-medium">
            Simulate loading
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Animation" value={animation} onChange={setAnimation} />
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={cn("size-4", loading && "motion-safe:animate-spin")} aria-hidden /> Refresh
          </button>
        </div>
      </div>

      <SkeletonWrapper
        loading={loading}
        animation={animation}
        label="Loading posts"
        loadedText="3 posts loaded"
        fallback={
          <div className="flex flex-col gap-3">
            {POSTS.map((p) => (
              <PostSkeleton key={p.id} image={p.image} />
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {POSTS.map((p) => (
            <PostView key={p.id} post={p} />
          ))}
        </div>
      </SkeletonWrapper>
    </div>
  );
}

/* ---------- Presets ---------- */

function Labeled({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-2", className)}>
      <figcaption className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{title}</figcaption>
      {children}
    </figure>
  );
}

export function PresetsDemo() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
      <Labeled title="<SkeletonCard />">
        <SkeletonCard />
      </Labeled>
      <Labeled title="<SkeletonProfile />">
        <SkeletonProfile />
      </Labeled>
      <Labeled title="<SkeletonListItem />">
        <div className={cn(card, "divide-y divide-zinc-200 py-1 dark:divide-zinc-800")}>
          <SkeletonListItem />
          <SkeletonListItem lines={3} />
          <SkeletonListItem trailing={false} />
        </div>
      </Labeled>
      <Labeled title="<SkeletonTableRow />">
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Member</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800" aria-busy="true">
              <SkeletonTableRow columns={3} leadingCircle />
              <SkeletonTableRow columns={3} leadingCircle widths={["55%", "40%", "30%"]} />
              <SkeletonTableRow columns={3} leadingCircle widths={["65%", "55%", "45%"]} />
            </tbody>
          </table>
        </div>
      </Labeled>
    </div>
  );
}

/* ---------- Primitives ---------- */

export function PrimitivesDemo() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
      {ANIMATIONS.map((a) => (
        <Labeled key={a} title={`animation="${a}"`}>
          <div className={cn(card, "flex flex-col gap-4")}>
            <div className="flex items-center gap-3">
              <SkeletonCircle size={48} animation={a} />
              <SkeletonCircle size={32} animation={a} />
              <SkeletonCircle size={20} animation={a} />
            </div>
            <Skeleton height={88} radius={12} animation={a} />
            <div className="flex gap-2">
              <Skeleton width={72} height={28} radius={9999} animation={a} />
              <Skeleton width={56} height={28} radius={4} animation={a} />
            </div>
            <SkeletonText lines={4} animation={a} />
          </div>
        </Labeled>
      ))}
    </div>
  );
}
