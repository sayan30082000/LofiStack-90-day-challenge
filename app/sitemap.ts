import type { MetadataRoute } from "next";
import { registry } from "@/lib/registry";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    ...registry.map((c) => ({
      url: `${siteConfig.url}/components/${c.slug}`,
      lastModified: c.addedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
