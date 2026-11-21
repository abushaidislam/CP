import { NextRequest, NextResponse } from "next/server";
import { componentRegistryService } from "@/lib/mcp/component-service";
import { toComponentSlug } from "@/lib/registry/server-registry";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * GET /api/registry/[slug]
 * Serves a shadcn/ui CLI compatible registry item JSON payload:
 *   npx shadcn@latest add https://<origin>/api/registry/<slug>
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await context.params;
  const cleanSlug = toComponentSlug(rawSlug.replace(/\.json$/i, ""));

  try {
    const resolved = await componentRegistryService.getComponent({
      slug: cleanSlug,
    });

    const files: Array<{
      path: string;
      type: "registry:ui" | "registry:component" | "registry:block";
      content: string;
      target?: string;
    }> = [
      {
        path: `components/ui/${resolved.slug}.tsx`,
        type: "registry:ui",
        target: `components/ui/${resolved.slug}.tsx`,
        content: resolved.files["component.tsx"] || "",
      },
    ];

    if (resolved.files["default.tsx"]?.trim()) {
      files.push({
        path: `components/demos/${resolved.slug}-demo.tsx`,
        type: "registry:component",
        target: `components/demos/${resolved.slug}-demo.tsx`,
        content: resolved.files["default.tsx"],
      });
    }

    const payload = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: resolved.slug,
      type: "registry:ui",
      title: resolved.manifest.name,
      description: resolved.manifest.description || `${resolved.manifest.name} component from Component Studio`,
      categories: [resolved.manifest.category || "Custom"],
      dependencies: resolved.manifest.dependencies || [],
      registryDependencies: [],
      files,
      meta: {
        studioUrl: resolved.studioUrl,
        version: resolved.manifest.version || "v1",
        updatedAt: resolved.manifest.updatedAt,
      },
    };

    return NextResponse.json(payload, {
      headers: {
        ...corsHeaders(),
        "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: msg },
      { status: 404, headers: corsHeaders() }
    );
  }
}
