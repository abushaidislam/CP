import { NextRequest, NextResponse } from "next/server";

export interface NpmSearchResult {
  name: string;
  version: string;
  description: string;
  publisher?: string;
  npmUrl: string;
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const npmRegistryUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
      query
    )}&size=8`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(npmRegistryUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache search queries for 1 hour
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const objects = data.objects || [];

    const results: NpmSearchResult[] = objects.map(
      (obj: {
        package: {
          name: string;
          version: string;
          description?: string;
          publisher?: { username?: string };
          links?: { npm?: string };
        };
      }) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || "No description provided",
        publisher: obj.package.publisher?.username || "npm",
        npmUrl: obj.package.links?.npm || `https://www.npmjs.com/package/${obj.package.name}`,
      })
    );

    return NextResponse.json({ results });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw err;
    }
    console.error("NPM search error:", err);
    return NextResponse.json({ results: [] });
  }
}
