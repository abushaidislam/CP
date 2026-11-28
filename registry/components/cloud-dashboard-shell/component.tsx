"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Box,
  Bug,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Database,
  Eye,
  Gauge,
  Globe,
  Menu,
  MoreHorizontal,
  Plug,
  Plus,
  Search,
  Settings,
  Store,
  ToggleRight,
  X,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ShellTheme = "auto" | "dark" | "light";
export type WorkspacePlan = "Hobby" | "Pro" | "Enterprise";

export interface NavChildItem {
  id: string;
  label: string;
}

export interface NavItem {
  id: string;
  label: string;
  group: "primary" | "platform";
  children?: NavChildItem[];
}

export interface WorkspaceOption {
  id: string;
  name: string;
  plan: WorkspacePlan;
}

export interface ProjectOption {
  id: string;
  name: string;
  branch?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread?: boolean;
}

export interface CloudDashboardShellProps {
  /** Color theme mode. Defaults to "auto" to follow system/Studio light & dark mode. */
  theme?: ShellTheme;
  /** Active workspace name shown in the top-left switcher. */
  workspaceName?: string;
  /** Plan tier badge displayed beside the workspace name. */
  workspacePlan?: WorkspacePlan;
  /** Active project name shown in the top header switcher. */
  projectName?: string;
  /** Signed-in user display name shown in the sidebar footer. */
  userName?: string;
  /** Whether the footer notification bell displays an unread indicator dot. */
  hasUnreadNotifications?: boolean;
  /** Controlled active navigation item ID. */
  activeItem?: string;
  /** Initial active navigation item ID when uncontrolled. */
  defaultActiveItem?: string;
  /** Callback fired when a navigation item or sub-item is selected. */
  onNavigate?: (itemId: string, label: string) => void;
  /** Callback fired when a quick-create option is selected. */
  onCreateNew?: (resourceType: string) => void;
  /** Main viewport content rendered inside the dashboard canvas. */
  children?: React.ReactNode;
  /** Additional CSS classes for the outer shell container. */
  className?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", group: "primary" },
  { id: "deployments", label: "Deployments", group: "primary" },
  { id: "ci", label: "CI", group: "primary" },
  {
    id: "logs",
    label: "Logs",
    group: "primary",
    children: [
      { id: "logs-runtime", label: "Runtime Logs" },
      { id: "logs-build", label: "Build Logs" },
      { id: "logs-drains", label: "Log Drains" },
    ],
  },
  {
    id: "traces",
    label: "Traces",
    group: "primary",
    children: [
      { id: "traces-explorer", label: "Trace Explorer" },
      { id: "traces-spans", label: "Span Metrics" },
    ],
  },
  { id: "analytics", label: "Analytics", group: "primary" },
  { id: "speed-insights", label: "Speed Insights", group: "primary" },
  {
    id: "observability",
    label: "Observability",
    group: "primary",
    children: [
      { id: "obs-metrics", label: "Metrics" },
      { id: "obs-alerts", label: "Alerts" },
      { id: "obs-notebooks", label: "Notebooks" },
    ],
  },
  {
    id: "firewall",
    label: "Firewall",
    group: "primary",
    children: [
      { id: "fw-overview", label: "Traffic Overview" },
      { id: "fw-rules", label: "Custom Rules" },
      { id: "fw-rate-limit", label: "Rate Limiting" },
    ],
  },
  {
    id: "cdn",
    label: "CDN",
    group: "primary",
    children: [
      { id: "cdn-cache", label: "Edge Cache" },
      { id: "cdn-regions", label: "Edge Regions" },
    ],
  },
  { id: "env-vars", label: "Environment Variables", group: "platform" },
  { id: "domains", label: "Domains", group: "platform" },
  {
    id: "connect",
    label: "Connect",
    group: "platform",
    children: [
      { id: "connect-git", label: "Git Repositories" },
      { id: "connect-webhooks", label: "Webhooks" },
    ],
  },
  { id: "integrations", label: "Integrations", group: "platform" },
  { id: "storage", label: "Storage", group: "platform" },
  {
    id: "flags",
    label: "Flags",
    group: "platform",
    children: [
      { id: "flags-list", label: "Feature Flags" },
      { id: "flags-segments", label: "Audience Segments" },
    ],
  },
  {
    id: "agent",
    label: "Agent",
    group: "platform",
    children: [
      { id: "agent-sessions", label: "Sessions" },
      { id: "agent-policies", label: "Guardrails" },
    ],
  },
  { id: "vulnerabilities", label: "Vulnerabilities", group: "platform" },
  { id: "settings", label: "Settings", group: "platform" },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Production deployment succeeded",
    time: "4m ago",
    unread: true,
  },
  {
    id: "n2",
    title: "Edge cache hit ratio reached 98.4%",
    time: "1h ago",
    unread: true,
  },
  {
    id: "n3",
    title: "SSL certificate auto-renewed",
    time: "Yesterday",
    unread: false,
  },
];

const CREATE_OPTIONS = [
  { id: "project", label: "New Project", hint: "Import a Git repository" },
  { id: "deployment", label: "Deployment", hint: "Trigger a production build" },
  { id: "domain", label: "Domain", hint: "Attach or register a domain" },
  { id: "storage", label: "Storage Store", hint: "Postgres, KV, or Blob" },
];

function WorkspaceOrbIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn("h-5 w-5 shrink-0", className)}
    >
      <circle cx="10" cy="10" r="9.5" fill="#0d4a2d" />
      <circle cx="10" cy="10" r="8.5" fill="#15803d" fillOpacity="0.65" />
      <path
        d="M5 7.5h10M4 10h12M5 12.5h10M7.5 4.5v11M10 3.5v13M12.5 4.5v11"
        stroke="#4ade80"
        strokeOpacity="0.55"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeOpacity="0.35" />
    </svg>
  );
}

function ProjectMonogramIcon({
  theme,
  className,
}: {
  theme: ShellTheme;
  className?: string;
}) {
  const rectFill =
    theme === "dark"
      ? "fill-[#f4f4f5]"
      : theme === "light"
      ? "fill-[#171717]"
      : "fill-[#171717] dark:fill-[#f4f4f5]";
  const pathStroke =
    theme === "dark"
      ? "stroke-[#09090b]"
      : theme === "light"
      ? "stroke-[#fafafa]"
      : "stroke-[#fafafa] dark:stroke-[#09090b]";

  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <rect
        x="0.75"
        y="0.75"
        width="16.5"
        height="16.5"
        rx="4.25"
        className={rectFill}
      />
      <path
        d="M5.2 12V6l3.4 4.4V6M10.5 6l2.3 6M12.8 6l-2.3 6"
        className={pathStroke}
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CiBoxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M8.6 4.4L5.8 8.3h2.3l-.7 3.3 2.8-3.9H7.9l.7-3.3z"
        fill="currentColor"
      />
    </svg>
  );
}

function LogsRowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <circle cx="3" cy="4.2" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="11.8" r="1" fill="currentColor" />
      <path
        d="M6.2 4.2h7.3M6.2 8h7.3M6.2 11.8h7.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TracesSpanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path
        d="M4.5 2.2H3a.8.8 0 00-.8.8v1.5M11.5 2.2H13a.8.8 0 01.8.8v1.5M4.5 13.8H3a.8.8 0 01-.8-.8v-1.5M11.5 13.8H13a.8.8 0 00.8-.8v-1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M4.8 5.5h3.8M6.2 8h5M4.8 10.5h4.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsChartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path
        d="M2.5 2.5v10.2a.8.8 0 00.8.8h10.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M4.8 10.2l2.4-2.5 2 1.6 3.5-4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FirewallBrickIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path
        d="M7.8 13H2.8a.8.8 0 01-.8-.8V3.8a.8.8 0 01.8-.8h10.4a.8.8 0 01.8.8v3.7"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M2 6.5h12M2 9.8h6.2M6 3v3.5M10 3v3.5M5 6.5v3.3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M11.6 8.6c.8 1 1.7 1.8 1.7 3a1.9 1.9 0 01-3.8 0c0-.7.3-1.3.7-1.8.2.5.6.7.9.7.1-.7.2-1.3.5-1.9z"
        fill="currentColor"
      />
    </svg>
  );
}

function EnvVarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path
        d="M3.8 4.2c1.2 0 1.8.6 2.7 2.2l3 5.2c.6 1 1.3 1.4 2.3 1.4M12.2 4.2c-1.2 0-1.9.6-2.8 2L6.3 11c-.6 1-1.3 1.6-2.4 1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DomainBrowserGlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path
        d="M7.5 12.2H2.8a.8.8 0 01-.8-.8V3.8a.8.8 0 01.8-.8h10.4a.8.8 0 01.8.8v3.2M2 6h12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4.5" r="0.55" fill="currentColor" />
      <circle cx="5.8" cy="4.5" r="0.55" fill="currentColor" />
      <circle
        cx="11.5"
        cy="11.2"
        r="2.7"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M8.9 11.2h5.2M11.5 8.6c.7.7 1.1 1.6 1.1 2.6s-.4 1.9-1.1 2.6c-.7-.7-1.1-1.6-1.1-2.6s.4-1.9 1.1-2.6z"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function AgentConstellationIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <circle cx="8" cy="3.5" r="1.15" />
      <circle cx="5.7" cy="7.6" r="1.15" />
      <circle cx="10.3" cy="7.6" r="1.15" />
      <circle cx="3.4" cy="11.7" r="1.15" />
      <circle cx="8" cy="11.7" r="1.15" />
      <circle cx="12.6" cy="11.7" r="1.15" />
    </svg>
  );
}

function renderNavIcon(id: string, theme: ShellTheme): React.ReactNode {
  const iconCls = "h-4 w-4 shrink-0 stroke-[1.55]";
  switch (id) {
    case "overview":
      return (
        <ProjectMonogramIcon theme={theme} className="h-[17px] w-[17px]" />
      );
    case "deployments":
      return <Box className={iconCls} />;
    case "ci":
      return <CiBoxIcon />;
    case "logs":
      return <LogsRowsIcon />;
    case "traces":
      return <TracesSpanIcon />;
    case "analytics":
      return <AnalyticsChartIcon />;
    case "speed-insights":
      return <Gauge className={iconCls} />;
    case "observability":
      return <Eye className={iconCls} />;
    case "firewall":
      return <FirewallBrickIcon />;
    case "cdn":
      return <Globe className={iconCls} />;
    case "env-vars":
      return <EnvVarIcon />;
    case "domains":
      return <DomainBrowserGlobeIcon />;
    case "connect":
      return <Plug className={iconCls} />;
    case "integrations":
      return <Store className={iconCls} />;
    case "storage":
      return <Database className={iconCls} />;
    case "flags":
      return <ToggleRight className={iconCls} />;
    case "agent":
      return <AgentConstellationIcon />;
    case "vulnerabilities":
      return <Bug className={iconCls} />;
    case "settings":
      return <Settings className={iconCls} />;
    default:
      return <Box className={iconCls} />;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const CloudDashboardShell = forwardRef<
  HTMLDivElement,
  CloudDashboardShellProps
>(function CloudDashboardShell(
  {
    theme = "auto",
    workspaceName = "nuvora-cloud",
    workspacePlan = "Hobby",
    projectName = "nuvora.app-main",
    userName = "Alex Rivera",
    hasUnreadNotifications = true,
    activeItem,
    defaultActiveItem = "overview",
    onNavigate,
    onCreateNew,
    children,
    className,
  },
  ref
) {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const [internalActive, setInternalActive] = useState<string>(
    activeItem ?? defaultActiveItem
  );
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption>({
    id: "ws-main",
    name: workspaceName,
    plan: workspacePlan,
  });
  const [selectedProject, setSelectedProject] = useState<ProjectOption>({
    id: "proj-main",
    name: projectName,
    branch: "main",
  });
  const [unreadDot, setUnreadDot] = useState<boolean>(hasUnreadNotifications);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    DEFAULT_NOTIFICATIONS
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeItem !== undefined) {
      setInternalActive(activeItem);
    }
  }, [activeItem]);

  useEffect(() => {
    setSelectedWorkspace((prev) => ({
      ...prev,
      name: workspaceName,
      plan: workspacePlan,
    }));
  }, [workspaceName, workspacePlan]);

  useEffect(() => {
    setSelectedProject((prev) => ({
      ...prev,
      name: projectName,
    }));
  }, [projectName]);

  useEffect(() => {
    setUnreadDot(hasUnreadNotifications);
  }, [hasUnreadNotifications]);

  const currentActiveId = activeItem ?? internalActive;

  const workspaceOptions = useMemo<WorkspaceOption[]>(
    () => [
      { id: "ws-main", name: workspaceName, plan: workspacePlan },
      { id: "ws-studio", name: "nuvora-labs", plan: "Pro" },
      { id: "ws-edge", name: "acme-edge", plan: "Enterprise" },
    ],
    [workspaceName, workspacePlan]
  );

  const projectOptions = useMemo<ProjectOption[]>(
    () => [
      { id: "proj-main", name: projectName, branch: "main" },
      { id: "proj-docs", name: "nuvora-docs", branch: "production" },
      { id: "proj-api", name: "nuvora-gateway", branch: "main" },
    ],
    [projectName]
  );

  const activeMeta = useMemo(() => {
    for (const item of DEFAULT_NAV_ITEMS) {
      if (item.id === currentActiveId) {
        return { id: item.id, label: item.label, parentId: item.id };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.id === currentActiveId) {
            return {
              id: child.id,
              label: child.label,
              parentId: item.id,
            };
          }
        }
      }
    }
    return { id: "overview", label: "Overview", parentId: "overview" };
  }, [currentActiveId]);

  const filteredNavItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEFAULT_NAV_ITEMS;
    return DEFAULT_NAV_ITEMS.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.children?.some((c) => c.label.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [searchQuery]);

  const primaryItems = useMemo(
    () => filteredNavItems.filter((item) => item.group === "primary"),
    [filteredNavItems]
  );
  const platformItems = useMemo(
    () => filteredNavItems.filter((item) => item.group === "platform"),
    [filteredNavItems]
  );

  const handleSelectNav = useCallback(
    (id: string, label: string) => {
      if (activeItem === undefined) {
        setInternalActive(id);
      }
      onNavigate?.(id, label);
      setMobileMenuOpen(false);
    },
    [activeItem, onNavigate]
  );

  const setGroupOpen = useCallback((id: string, open: boolean) => {
    setExpandedIds((prev) =>
      open
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((item) => item !== id)
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (
        !isEditable &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key === "f" || e.key === "F")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  const fontStyle = {
    fontFamily:
      '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  // shadcn/ui + Radix primitives styled with exact measured Geist monochrome tokens
  const T = {
    shellBg: isDark
      ? "bg-[#000000] text-[#ededed]"
      : isLight
      ? "bg-[#ffffff] text-[#171717]"
      : "bg-[#ffffff] text-[#171717] dark:bg-[#000000] dark:text-[#ededed]",
    border: isDark
      ? "border-[#1f1f1f]"
      : isLight
      ? "border-[#e5e5e5]"
      : "border-[#e5e5e5] dark:border-[#1f1f1f]",
    divider: isDark
      ? "border-[#1b1b1b]"
      : isLight
      ? "border-[#ebebeb]"
      : "border-[#ebebeb] dark:border-[#1b1b1b]",
    inputBg: isDark
      ? "bg-[#0a0a0a] border-[#242424] text-[#ededed] placeholder:text-[#6e6e6e] focus-within:border-[#3d3d3d] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
      : isLight
      ? "bg-[#fafafa] border-[#e5e5e5] text-[#171717] placeholder:text-[#737373] focus-within:border-[#a3a3a3]"
      : "bg-[#fafafa] border-[#e5e5e5] text-[#171717] placeholder:text-[#737373] focus-within:border-[#a3a3a3] dark:bg-[#0a0a0a] dark:border-[#242424] dark:text-[#ededed] dark:placeholder:text-[#6e6e6e] dark:focus-within:border-[#3d3d3d] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
    keycap: isDark
      ? "bg-[#141414] border-[#2b2b2b] text-[#8f8f8f] shadow-[0_1px_0_0_rgba(255,255,255,0.04)]"
      : isLight
      ? "bg-[#ffffff] border-[#e5e5e5] text-[#737373] shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
      : "bg-[#ffffff] border-[#e5e5e5] text-[#737373] shadow-[0_1px_1px_rgba(0,0,0,0.04)] dark:bg-[#141414] dark:border-[#2b2b2b] dark:text-[#8f8f8f] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]",
    planBadge: isDark
      ? "bg-[#171717] border-[#282828] text-[#a1a1a1]"
      : isLight
      ? "bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b]"
      : "bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b] dark:bg-[#171717] dark:border-[#282828] dark:text-[#a1a1a1]",
    navActivePill: isDark
      ? "bg-[#1f1f1f] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.045)]"
      : isLight
      ? "bg-[#f2f2f3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]"
      : "bg-[#f2f2f3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:bg-[#1f1f1f] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.045)]",
    navActiveText: isDark
      ? "text-[#ededed]"
      : isLight
      ? "text-[#171717]"
      : "text-[#171717] dark:text-[#ededed]",
    navIdleText: isDark
      ? "text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#1a1a1a]"
      : isLight
      ? "text-[#666666] hover:text-[#171717] hover:bg-[#f5f5f5]"
      : "text-[#666666] hover:text-[#171717] hover:bg-[#f5f5f5] dark:text-[#a1a1a1] dark:hover:text-[#ededed] dark:hover:bg-[#1a1a1a]",
    chevron: isDark
      ? "text-[#8a8a8a]"
      : isLight
      ? "text-[#8c8c8c]"
      : "text-[#8c8c8c] dark:text-[#8a8a8a]",
    mutedText: isDark
      ? "text-[#888888]"
      : isLight
      ? "text-[#737373]"
      : "text-[#737373] dark:text-[#888888]",
    iconButton: isDark
      ? "border-[#242424] bg-[#0a0a0a] text-[#a1a1a1] hover:text-[#ededed] hover:border-[#363636] hover:bg-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
      : isLight
      ? "border-[#e5e5e5] bg-[#ffffff] text-[#52525b] hover:text-[#171717] hover:border-[#d4d4d8] hover:bg-[#f5f5f5] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      : "border-[#e5e5e5] bg-[#ffffff] text-[#52525b] hover:text-[#171717] hover:border-[#d4d4d8] hover:bg-[#f5f5f5] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-[#242424] dark:bg-[#0a0a0a] dark:text-[#a1a1a1] dark:hover:text-[#ededed] dark:hover:border-[#363636] dark:hover:bg-[#1a1a1a] dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
    headerAction: isDark
      ? "text-[#ededed] hover:bg-[#1a1a1a]"
      : isLight
      ? "text-[#171717] hover:bg-[#f5f5f5]"
      : "text-[#171717] hover:bg-[#f5f5f5] dark:text-[#ededed] dark:hover:bg-[#1a1a1a]",
    menuSurface: isDark
      ? "bg-[#0a0a0a] border-[#262626] text-[#ededed] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]"
      : isLight
      ? "bg-[#ffffff] border-[#e5e5e5] text-[#171717] shadow-[0_12px_32px_rgba(0,0,0,0.09)]"
      : "bg-[#ffffff] border-[#e5e5e5] text-[#171717] shadow-[0_12px_32px_rgba(0,0,0,0.09)] dark:bg-[#0a0a0a] dark:border-[#262626] dark:text-[#ededed] dark:shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]",
    menuItem: isDark
      ? "focus:bg-[#1a1a1a] hover:bg-[#1a1a1a]"
      : isLight
      ? "focus:bg-[#f5f5f5] hover:bg-[#f5f5f5]"
      : "focus:bg-[#f5f5f5] hover:bg-[#f5f5f5] dark:focus:bg-[#1a1a1a] dark:hover:bg-[#1a1a1a]",
    fadeMask: isDark
      ? "from-[#000000] via-[#000000]/85 to-transparent"
      : isLight
      ? "from-[#ffffff] via-[#ffffff]/85 to-transparent"
      : "from-[#ffffff] via-[#ffffff]/85 to-transparent dark:from-[#000000] dark:via-[#000000]/85 dark:to-transparent",
    ringBg: isDark
      ? "ring-[#000000]"
      : isLight
      ? "ring-[#ffffff]"
      : "ring-[#ffffff] dark:ring-[#000000]",
    canvasBg: isDark
      ? "bg-[#000000]"
      : isLight
      ? "bg-[#fafafa]"
      : "bg-[#fafafa] dark:bg-[#000000]",
  };

  const renderNavGroup = (items: NavItem[]) => (
    <ul className="space-y-[1px]" role="list">
      {items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded =
          expandedIds.includes(item.id) ||
          (searchQuery.trim().length > 0 && hasChildren);
        const isDirectActive = currentActiveId === item.id;
        const hasActiveChild =
          item.children?.some((c) => c.id === currentActiveId) ?? false;

        if (!hasChildren) {
          return (
            <li key={item.id}>
              <div className="relative">
                {isDirectActive && (
                  <motion.div
                    layoutId={`shell-active-pill-${uid}`}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 540, damping: 40 }
                    }
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[8px]",
                      T.navActivePill
                    )}
                  />
                )}
                <button
                  type="button"
                  aria-current={isDirectActive ? "page" : undefined}
                  onClick={() => handleSelectNav(item.id, item.label)}
                  className={cn(
                    "group relative z-10 flex h-[36px] w-full items-center justify-between rounded-[8px] px-2.5 text-[14px] leading-[20px] tracking-[-0.011em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                    isDirectActive
                      ? cn(T.navActiveText, "font-medium")
                      : cn(T.navIdleText, "font-normal")
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-100",
                        isDirectActive
                          ? T.navActiveText
                          : "text-current opacity-85 group-hover:opacity-100"
                      )}
                    >
                      {renderNavIcon(item.id, theme)}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              </div>
            </li>
          );
        }

        // Expandable section built with shadcn/ui Collapsible (Radix Collapsible)
        return (
          <CollapsiblePrimitive.Root
            key={item.id}
            asChild
            open={isExpanded}
            onOpenChange={(open) => setGroupOpen(item.id, open)}
          >
            <li>
              <div className="relative">
                {isDirectActive && (
                  <motion.div
                    layoutId={`shell-active-pill-${uid}`}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 540, damping: 40 }
                    }
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[8px]",
                      T.navActivePill
                    )}
                  />
                )}
                <CollapsiblePrimitive.Trigger asChild>
                  <button
                    type="button"
                    aria-current={isDirectActive ? "page" : undefined}
                    onClick={() => handleSelectNav(item.id, item.label)}
                    className={cn(
                      "group relative z-10 flex h-[36px] w-full items-center justify-between rounded-[8px] px-2.5 text-[14px] leading-[20px] tracking-[-0.011em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                      isDirectActive
                        ? cn(T.navActiveText, "font-medium")
                        : hasActiveChild
                        ? cn(T.navActiveText, "font-normal")
                        : cn(T.navIdleText, "font-normal")
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-100",
                          isDirectActive
                            ? T.navActiveText
                            : "text-current opacity-85 group-hover:opacity-100"
                        )}
                      >
                        {renderNavIcon(item.id, theme)}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 stroke-[1.7] transition-transform duration-150",
                        T.chevron,
                        isExpanded && "rotate-90 text-current"
                      )}
                    />
                  </button>
                </CollapsiblePrimitive.Trigger>
              </div>

              <CollapsiblePrimitive.Content forceMount asChild>
                <AnimatePresence initial={false}>
                  {isExpanded && item.children && (
                    <motion.ul
                      initial={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden pl-[30px] pr-1 pt-0.5 pb-1"
                    >
                      {item.children.map((child) => {
                        const isChildActive = currentActiveId === child.id;
                        return (
                          <li key={child.id}>
                            <button
                              type="button"
                              aria-current={isChildActive ? "page" : undefined}
                              onClick={() =>
                                handleSelectNav(child.id, child.label)
                              }
                              className={cn(
                                "flex h-[32px] w-full items-center rounded-[7px] px-2.5 text-[13.5px] leading-[18px] tracking-[-0.01em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                                isChildActive
                                  ? cn(
                                      T.navActivePill,
                                      T.navActiveText,
                                      "font-medium"
                                    )
                                  : T.navIdleText
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </CollapsiblePrimitive.Content>
            </li>
          </CollapsiblePrimitive.Root>
        );
      })}
    </ul>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Top Workspace Switcher (shadcn DropdownMenu) */}
      <div className="flex h-[52px] shrink-0 items-center px-3">
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-[8px] px-1.5 py-1.5 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                T.menuItem
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <WorkspaceOrbIcon />
                <span className="truncate text-[14px] font-medium leading-[20px] tracking-[-0.012em]">
                  {selectedWorkspace.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-[1px] text-[11px] font-medium leading-[16px]",
                    T.planBadge
                  )}
                >
                  {selectedWorkspace.plan}
                </span>
              </span>
              <ChevronsUpDown
                className={cn("h-3.5 w-3.5 shrink-0", T.mutedText)}
              />
            </button>
          </DropdownMenuPrimitive.Trigger>

          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align="start"
              sideOffset={6}
              style={fontStyle}
              className={cn(
                "z-50 w-[232px] rounded-[10px] border p-1.5 antialiased outline-none",
                T.menuSurface
              )}
            >
              <DropdownMenuPrimitive.Label
                className={cn(
                  "px-2 py-1 text-[11px] font-medium uppercase tracking-wider",
                  T.mutedText
                )}
              >
                Workspaces
              </DropdownMenuPrimitive.Label>
              {workspaceOptions.map((ws) => {
                const isSelected = ws.name === selectedWorkspace.name;
                return (
                  <DropdownMenuPrimitive.Item
                    key={ws.id}
                    onSelect={() => setSelectedWorkspace(ws)}
                    className={cn(
                      "flex cursor-pointer select-none items-center justify-between rounded-[7px] px-2 py-1.5 text-[13px] outline-none transition-colors",
                      T.menuItem
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <WorkspaceOrbIcon className="h-4 w-4" />
                      <span className="truncate font-medium">{ws.name}</span>
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-[0.5px] text-[10.5px]",
                          T.planBadge
                        )}
                      >
                        {ws.plan}
                      </span>
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </DropdownMenuPrimitive.Item>
                );
              })}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>

      {/* Find Search Input */}
      <div className="shrink-0 px-3 pb-2.5 pt-0.5">
        <div
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[8px] border px-2.5 transition-colors duration-100",
            T.inputBg
          )}
        >
          <Search className={cn("h-3.5 w-3.5 shrink-0", T.mutedText)} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find"
            aria-label="Find navigation item"
            className="w-full min-w-0 bg-transparent text-[13.5px] leading-[18px] outline-none placeholder:text-inherit"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className={cn("rounded p-0.5 transition-colors", T.mutedText)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd
              className={cn(
                "flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-[5px] border px-1 font-sans text-[11px] font-medium",
                T.keycap
              )}
            >
              F
            </kbd>
          )}
        </div>
      </div>

      {/* Scrollable Navigation Sections with Bottom Fade */}
      <div className="relative flex-1 min-h-0">
        <nav
          aria-label="Dashboard Navigation"
          className="cloud-shell-scroll h-full overflow-y-auto px-2 pb-12 pt-0.5"
        >
          {primaryItems.length > 0 && renderNavGroup(primaryItems)}

          {primaryItems.length > 0 && platformItems.length > 0 && (
            <div
              role="separator"
              className={cn("my-3 mx-1.5 border-t", T.divider)}
            />
          )}

          {platformItems.length > 0 && renderNavGroup(platformItems)}

          {primaryItems.length === 0 && platformItems.length === 0 && (
            <div
              className={cn("px-3 py-6 text-center text-[13px]", T.mutedText)}
            >
              No sections matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </nav>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t",
            T.fadeMask
          )}
        />
      </div>

      {/* Pinned User Footer (shadcn DropdownMenu + Popover) */}
      <div className="flex h-[54px] shrink-0 items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            aria-hidden="true"
            className={cn(
              "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold tracking-tight",
              isDark
                ? "border-[#2e2e2e] bg-[#1a1a1a] text-[#ededed]"
                : isLight
                ? "border-[#d4d4d8] bg-[#f4f4f5] text-[#171717]"
                : "border-[#d4d4d8] bg-[#f4f4f5] text-[#171717] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:text-[#ededed]"
            )}
          >
            {getInitials(userName)}
          </div>
          <span className="truncate text-[14px] font-medium leading-[20px] tracking-[-0.011em]">
            {userName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Account Menu (shadcn DropdownMenu) */}
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label="Account options"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                  T.iconButton
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content
                side="top"
                align="end"
                sideOffset={8}
                style={fontStyle}
                className={cn(
                  "z-50 w-[224px] rounded-[10px] border p-1.5 antialiased outline-none",
                  T.menuSurface
                )}
              >
                <div className={cn("border-b px-2 py-1.5", T.border)}>
                  <p className="truncate text-[13px] font-medium">{userName}</p>
                  <p className={cn("truncate text-[11.5px]", T.mutedText)}>
                    {selectedWorkspace.name} · {selectedWorkspace.plan}
                  </p>
                </div>
                {["Account Settings", "Command Menu", "Billing & Usage"].map(
                  (label) => (
                    <DropdownMenuPrimitive.Item
                      key={label}
                      onSelect={() =>
                        handleSelectNav(
                          label.toLowerCase().replace(/\s+/g, "-"),
                          label
                        )
                      }
                      className={cn(
                        "mt-0.5 flex cursor-pointer select-none items-center rounded-[7px] px-2 py-1.5 text-[13px] outline-none transition-colors",
                        T.menuItem
                      )}
                    >
                      {label}
                    </DropdownMenuPrimitive.Item>
                  )
                )}
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>

          {/* Notifications Popover (shadcn Popover) */}
          <PopoverPrimitive.Root>
            <PopoverPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                  T.iconButton
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadDot && (
                  <span
                    aria-label="Unread notifications"
                    className={cn(
                      "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#3b82f6] ring-2",
                      T.ringBg
                    )}
                  />
                )}
              </button>
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="top"
                align="end"
                sideOffset={8}
                style={fontStyle}
                className={cn(
                  "z-50 w-[264px] rounded-[10px] border p-2 antialiased outline-none",
                  T.menuSurface
                )}
              >
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-[12.5px] font-medium">
                    Notifications
                  </span>
                  {unreadDot && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnreadDot(false);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, unread: false }))
                        );
                      }}
                      className="text-[11.5px] text-[#3b82f6] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {notifications.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "flex items-start gap-2 rounded-[7px] px-2 py-1.5 text-[12.5px] transition-colors",
                        T.menuItem
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          note.unread && unreadDot
                            ? "bg-[#3b82f6]"
                            : "bg-transparent"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="leading-snug">{note.title}</p>
                        <p
                          className={cn(
                            "mt-0.5 text-[11px] tabular-nums",
                            T.mutedText
                          )}
                        >
                          {note.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      style={fontStyle}
      className={cn(
        "relative flex h-[760px] w-full overflow-hidden antialiased selection:bg-[#3b82f6]/30",
        T.shellBg,
        className
      )}
    >
      {/* Desktop Left Sidebar */}
      <aside
        aria-label="Sidebar"
        className={cn(
          "hidden h-full w-[256px] shrink-0 flex-col border-r md:flex",
          T.border
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Navigation Sheet (shadcn Dialog/Sheet) */}
      <DialogPrimitive.Root
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] md:hidden" />
          <DialogPrimitive.Content
            style={fontStyle}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r outline-none md:hidden",
              T.shellBg,
              T.border
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              Dashboard Navigation
            </DialogPrimitive.Title>
            {sidebarContent}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Right Column: Top Header + Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header
          className={cn(
            "relative flex h-[52px] shrink-0 items-center justify-between border-b px-3 sm:px-4",
            T.border
          )}
        >
          {/* Left: Mobile Sheet Trigger + Project Switcher (shadcn DropdownMenu) */}
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[7px] md:hidden",
                T.headerAction
              )}
            >
              <Menu className="h-4 w-4" />
            </button>

            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[14px] font-medium leading-[20px] tracking-[-0.011em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                    T.headerAction
                  )}
                >
                  <ProjectMonogramIcon theme={theme} />
                  <span className="max-w-[140px] truncate sm:max-w-[200px]">
                    {selectedProject.name}
                  </span>
                  <ChevronsUpDown
                    className={cn("h-3.5 w-3.5 shrink-0", T.mutedText)}
                  />
                </button>
              </DropdownMenuPrimitive.Trigger>

              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  align="start"
                  sideOffset={6}
                  style={fontStyle}
                  className={cn(
                    "z-50 w-[236px] rounded-[10px] border p-1.5 antialiased outline-none",
                    T.menuSurface
                  )}
                >
                  <DropdownMenuPrimitive.Label
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium uppercase tracking-wider",
                      T.mutedText
                    )}
                  >
                    Projects
                  </DropdownMenuPrimitive.Label>
                  {projectOptions.map((proj) => {
                    const isSelected = proj.name === selectedProject.name;
                    return (
                      <DropdownMenuPrimitive.Item
                        key={proj.id}
                        onSelect={() => setSelectedProject(proj)}
                        className={cn(
                          "flex cursor-pointer select-none items-center justify-between rounded-[7px] px-2 py-1.5 text-[13px] outline-none transition-colors",
                          T.menuItem
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ProjectMonogramIcon
                            theme={theme}
                            className="h-3.5 w-3.5"
                          />
                          <span className="truncate font-medium">
                            {proj.name}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        )}
                      </DropdownMenuPrimitive.Item>
                    );
                  })}
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>

          {/* Center: Current Page Title */}
          <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 sm:block">
            <h1 className="text-[14px] font-medium leading-[20px] tracking-[-0.011em]">
              {activeMeta.label}
            </h1>
          </div>

          {/* Right: Create New (shadcn DropdownMenu) + Agent Toggle */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[14px] font-medium leading-[20px] tracking-[-0.011em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                    T.headerAction
                  )}
                >
                  <Plus className="h-4 w-4 stroke-[1.7]" />
                  <span>Create New</span>
                </button>
              </DropdownMenuPrimitive.Trigger>

              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  align="end"
                  sideOffset={6}
                  style={fontStyle}
                  className={cn(
                    "z-50 w-[236px] rounded-[10px] border p-1.5 antialiased outline-none",
                    T.menuSurface
                  )}
                >
                  {CREATE_OPTIONS.map((opt) => (
                    <DropdownMenuPrimitive.Item
                      key={opt.id}
                      onSelect={() => onCreateNew?.(opt.id)}
                      className={cn(
                        "flex cursor-pointer select-none flex-col rounded-[7px] px-2.5 py-1.5 text-left outline-none transition-colors",
                        T.menuItem
                      )}
                    >
                      <span className="text-[13px] font-medium">
                        {opt.label}
                      </span>
                      <span className={cn("text-[11.5px]", T.mutedText)}>
                        {opt.hint}
                      </span>
                    </DropdownMenuPrimitive.Item>
                  ))}
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>

            <button
              type="button"
              aria-pressed={agentDrawerOpen}
              onClick={() => setAgentDrawerOpen((prev) => !prev)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[14px] font-medium leading-[20px] tracking-[-0.011em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                agentDrawerOpen
                  ? cn(T.navActivePill, T.navActiveText)
                  : T.headerAction
              )}
            >
              <AgentConstellationIcon className="h-4 w-4" />
              <span>Agent</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Canvas + Optional Contextual Agent Drawer */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <main
            aria-label={activeMeta.label}
            className={cn("flex-1 overflow-y-auto", T.canvasBg)}
          >
            {children ?? (
              <div className="flex h-full w-full items-center justify-center p-8">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "mb-3 flex h-10 w-10 items-center justify-center rounded-xl border",
                      T.border,
                      T.navActivePill
                    )}
                  >
                    {renderNavIcon(activeMeta.parentId, theme)}
                  </div>
                  <p className="text-[14px] font-medium tracking-[-0.011em]">
                    {activeMeta.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 max-w-[280px] text-[13px]",
                      T.mutedText
                    )}
                  >
                    {selectedProject.name} · Press{" "}
                    <kbd
                      className={cn(
                        "mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-sans text-[10.5px]",
                        T.keycap
                      )}
                    >
                      F
                    </kbd>{" "}
                    to filter navigation
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* Contextual Agent Slide-Over Drawer */}
          <AnimatePresence>
            {agentDrawerOpen && (
              <motion.aside
                aria-label="Platform Agent"
                initial={
                  prefersReducedMotion ? { opacity: 1 } : { x: 280, opacity: 0 }
                }
                animate={{ x: 0, opacity: 1 }}
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { x: 280, opacity: 0 }
                }
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "flex w-[280px] shrink-0 flex-col border-l",
                  T.shellBg,
                  T.border
                )}
              >
                <div
                  className={cn(
                    "flex h-11 items-center justify-between border-b px-3.5",
                    T.border
                  )}
                >
                  <span className="flex items-center gap-2 text-[13px] font-medium">
                    <AgentConstellationIcon className="h-3.5 w-3.5" />
                    Agent
                  </span>
                  <button
                    type="button"
                    aria-label="Close Agent panel"
                    onClick={() => setAgentDrawerOpen(false)}
                    className={cn("rounded p-1 transition-colors", T.headerAction)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 space-y-3 p-3.5 text-[13px]">
                  <p className={T.mutedText}>
                    Context scoped to{" "}
                    <span className={cn("font-medium", T.navActiveText)}>
                      {activeMeta.label}
                    </span>{" "}
                    on{" "}
                    <span className={cn("font-medium", T.navActiveText)}>
                      {selectedProject.name}
                    </span>
                    .
                  </p>
                  <div className="space-y-1.5">
                    {[
                      `Inspect ${activeMeta.label.toLowerCase()} anomalies`,
                      "Compare latest production build",
                      "Audit environment configuration",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onCreateNew?.(`agent:${prompt}`)}
                        className={cn(
                          "w-full rounded-[8px] border px-2.5 py-2 text-left text-[12.5px] transition-colors",
                          T.border,
                          T.menuItem
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

CloudDashboardShell.displayName = "CloudDashboardShell";

export {
  CloudDashboardShell as component,
  CloudDashboardShell as Component,
};
export default CloudDashboardShell;
