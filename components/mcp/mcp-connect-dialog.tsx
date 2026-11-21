"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  Cpu,
  Globe,
  Sparkles,
  Terminal,
  RefreshCw,
  Server,
  ExternalLink,
} from "lucide-react";

interface McpConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function McpConnectDialog({ open, onOpenChange }: McpConnectDialogProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [testStatus, setTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestResult(null);
    try {
      const res = await fetch("/api/mcp");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setTestStatus("success");
      setTestResult(
        `Connected to "${data.server?.name}" v${data.server?.version}. Available tools: ${data.tools?.map((t: { name: string }) => t.name).join(", ")}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus("error");
      setTestResult(`Connection test failed: ${msg}`);
    }
  };

  const antigravityConfig = JSON.stringify(
    {
      mcpServers: {
        "component-studio": {
          command: "bun",
          args: ["run", "scripts/mcp-server.ts"],
        },
      },
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "component-studio": {
          command: "bun",
          args: ["run", "C:\\Users\\ASUS\\Desktop\\CP\\scripts\\mcp-server.ts"],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "component-studio": {
          type: "stdio",
          command: "bun",
          args: ["run", "scripts/mcp-server.ts"],
        },
      },
    },
    null,
    2
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-sans">
        <DialogHeader className="gap-1.5 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
              <Cpu className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-sans text-base font-semibold text-foreground">
                Model Context Protocol (MCP) Connector
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground mt-0.5">
                Connect Google Gemini, Antigravity, Claude, or Cursor to generate and manage components directly in this app.
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="font-sans text-[10px] rounded-none bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              Stdio Active
            </Badge>
            <Badge variant="secondary" className="font-sans text-[10px] rounded-none bg-sky-500/10 text-sky-500 border-sky-500/30">
              HTTP &amp; SSE Active
            </Badge>
            <Badge variant="outline" className="font-sans text-[10px] rounded-none">
              MCP Spec v2024-11-05
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="gemini" className="w-full flex flex-col gap-4">
          <TabsList className="grid grid-cols-4 w-full h-9 rounded-none bg-muted/40 p-1 border border-border">
            <TabsTrigger value="gemini" className="font-sans text-xs rounded-none data-[state=active]:bg-background">
              Gemini Web
            </TabsTrigger>
            <TabsTrigger value="antigravity" className="font-sans text-xs rounded-none data-[state=active]:bg-background">
              Antigravity
            </TabsTrigger>
            <TabsTrigger value="claude" className="font-sans text-xs rounded-none data-[state=active]:bg-background">
              Claude
            </TabsTrigger>
            <TabsTrigger value="cursor" className="font-sans text-xs rounded-none data-[state=active]:bg-background">
              Cursor
            </TabsTrigger>
          </TabsList>

          {/* 1. Google Gemini Tab */}
          <TabsContent value="gemini" className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-medium text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-sky-400" />
                Gemini Custom App &amp; Web Connector Endpoint
              </span>
              <p className="font-sans text-xs text-muted-foreground">
                Use this HTTP/SSE URL to connect your Gemini App, custom agent, or webhook. Supports both standard MCP and Gemini Function Calling.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-muted/40 border border-border p-2">
              <span className="font-mono text-xs text-foreground flex-1 truncate select-all">
                http://localhost:3000/api/mcp
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("http://localhost:3000/api/mcp", "gemini-url")}
                className="font-sans text-xs rounded-none h-7 px-2.5 gap-1.5 shrink-0"
              >
                {copiedKey === "gemini-url" ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5 bg-muted/20 border border-border/80 p-3">
              <span className="font-sans text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gemini Native Functions Endpoint
              </span>
              <p className="font-sans text-xs text-muted-foreground">
                If your Gemini client requests declarations formatted specifically for <code className="font-mono bg-muted/50 px-1">@google/genai</code> function calling, use:
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="font-mono text-xs text-primary truncate select-all">
                  http://localhost:3000/api/mcp?format=gemini
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("http://localhost:3000/api/mcp?format=gemini", "gemini-func-url")}
                  className="font-sans text-xs h-6 px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  {copiedKey === "gemini-func-url" ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 2. Google Antigravity Tab */}
          <TabsContent value="antigravity" className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Google Antigravity MCP Configuration
              </span>
              <p className="font-sans text-xs text-muted-foreground">
                Paste this into your Antigravity MCP configuration to allow this agent or any subagent to push components directly into Component Studio.
              </p>
            </div>

            <div className="relative bg-muted/30 border border-border p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(antigravityConfig, "antigravity-cfg")}
                className="absolute top-2 right-2 font-sans text-xs rounded-none h-7 px-2 gap-1.5"
              >
                {copiedKey === "antigravity-cfg" ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy JSON
                  </>
                )}
              </Button>
              <pre className="font-mono text-xs text-foreground overflow-x-auto pr-16 select-all">
                {antigravityConfig}
              </pre>
            </div>
          </TabsContent>

          {/* 3. Claude Desktop Tab */}
          <TabsContent value="claude" className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-medium text-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5 text-amber-500" />
                Claude Desktop Configuration
              </span>
              <p className="font-sans text-xs text-muted-foreground">
                Add this to <code className="font-mono bg-muted/50 px-1">%APPDATA%\Claude\claude_desktop_config.json</code>:
              </p>
            </div>

            <div className="relative bg-muted/30 border border-border p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(claudeDesktopConfig, "claude-cfg")}
                className="absolute top-2 right-2 font-sans text-xs rounded-none h-7 px-2 gap-1.5"
              >
                {copiedKey === "claude-cfg" ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy JSON
                  </>
                )}
              </Button>
              <pre className="font-mono text-xs text-foreground overflow-x-auto pr-16 select-all">
                {claudeDesktopConfig}
              </pre>
            </div>
          </TabsContent>

          {/* 4. Cursor / Windsurf Tab */}
          <TabsContent value="cursor" className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-medium text-foreground flex items-center gap-1.5">
                <Server className="size-3.5 text-purple-400" />
                Cursor MCP Configuration
              </span>
              <p className="font-sans text-xs text-muted-foreground">
                Add this to <code className="font-mono bg-muted/50 px-1">.cursor/mcp.json</code> or Settings &gt; Features &gt; MCP:
              </p>
            </div>

            <div className="relative bg-muted/30 border border-border p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(cursorConfig, "cursor-cfg")}
                className="absolute top-2 right-2 font-sans text-xs rounded-none h-7 px-2 gap-1.5"
              >
                {copiedKey === "cursor-cfg" ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy JSON
                  </>
                )}
              </Button>
              <pre className="font-mono text-xs text-foreground overflow-x-auto pr-16 select-all">
                {cursorConfig}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Diagnostics & Health Check */}
        <div className="flex flex-col gap-2 border-t border-border pt-4 mt-2 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold text-foreground">
                MCP Health &amp; Discovery Test
              </span>
              {testStatus === "success" && (
                <Badge variant="secondary" className="font-sans text-[10px] rounded-none bg-emerald-500/10 text-emerald-500">
                  Healthy
                </Badge>
              )}
              {testStatus === "error" && (
                <Badge variant="destructive" className="font-sans text-[10px] rounded-none">
                  Failed
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={testStatus === "testing"}
              onClick={handleTestConnection}
              className="font-sans text-xs rounded-none h-7 gap-1.5"
            >
              <RefreshCw className={testStatus === "testing" ? "size-3 animate-spin" : "size-3"} />
              {testStatus === "testing" ? "Testing..." : "Test Endpoint"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`font-mono text-[11px] p-2.5 border rounded-none ${
                testStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {testResult}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
