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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Blocks,
  Box,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Database,
  Eye,
  Gauge,
  Globe,
  ListFilter,
  Menu,
  MoreHorizontal,
  Plug,
  Plus,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ToggleLeft,
  TrendingUp,
  X,
  Zap,
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
      ? "fill-[#18181b]"
      : "fill-[#18181b] dark:fill-[#f4f4f5]";
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
      <rect x="1" y="1" width="16" height="16" rx="4" className={rectFill} />
      <path
        d="M5.2 12V6l3.4 4.4V6M10.4 6l2.4 6M12.8 6l-2.4 6"
        className={pathStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      <circle cx="8" cy="3.5" r="1.1" />
      <circle cx="5.8" cy="7.5" r="1.1" />
      <circle cx="10.2" cy="7.5" r="1.1" />
      <circle cx="3.6" cy="11.5" r="1.1" />
      <circle cx="8" cy="11.5" r="1.1" />
      <circle cx="12.4" cy="11.5" r="1.1" />
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
        d="M4.2 4.5c1.1 0 1.6.5 2.4 2.1l2.8 5.1c.6 1 1.2 1.3 2.2 1.3M11.8 4.5c-1.1 0-1.7.5-2.6 1.9L6.4 11c-.6 1-1.2 1.5-2.2 1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DomainBrowserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2.5 6.2h11M8 6.2v6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="4.3" cy="4.6" r="0.6" fill="currentColor" />
      <circle cx="6.2" cy="4.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

function renderNavIcon(id: string, theme: ShellTheme): React.ReactNode {
  const iconCls = "h-[15px] w-[15px] shrink-0 stroke-[1.6]";
  switch (id) {
    case "overview":
      return (
        <ProjectMonogramIcon theme={theme} className="h-[16px] w-[16px]" />
      );
    case "deployments":
      return <Box className={iconCls} />;
    case "ci":
      return <Zap className={iconCls} />;
    case "logs":
      return <ListFilter className={iconCls} />;
    case "traces":
      return <ScanLine className={iconCls} />;
    case "analytics":
      return <TrendingUp className={iconCls} />;
    case "speed-insights":
      return <Gauge className={iconCls} />;
    case "observability":
      return <Eye className={iconCls} />;
    case "firewall":
      return <Shield className={iconCls} />;
    case "cdn":
      return <Globe className={iconCls} />;
    case "env-vars":
      return <EnvVarIcon className="h-[15px] w-[15px] shrink-0" />;
    case "domains":
      return <DomainBrowserIcon className="h-[15px] w-[15px] shrink-0" />;
    case "connect":
      return <Plug className={iconCls} />;
    case "integrations":
      return <Blocks className={iconCls} />;
    case "storage":
      return <Database className={iconCls} />;
    case "flags":
      return <ToggleLeft className={iconCls} />;
    case "agent":
      return <AgentConstellationIcon className="h-[15px] w-[15px] shrink-0" />;
    case "vulnerabilities":
      return <ShieldAlert className={iconCls} />;
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
  const [activePopover, setActivePopover] = useState<
    "workspace" | "project" | "create" | "notifications" | "account" | null
  >(null);
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
  const shellRef = useRef<HTMLDivElement>(null);

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

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopover(null);
        setMobileMenuOpen(false);
        if (document.activeElement === searchInputRef.current) {
          setSearchQuery("");
          searchInputRef.current?.blur();
        }
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

  useEffect(() => {
    if (!activePopover) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [activePopover]);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  const T = {
    shellBg: isDark
      ? "bg-[#000000] text-[#ededed]"
      : isLight
      ? "bg-[#ffffff] text-[#171717]"
      : "bg-[#ffffff] text-[#171717] dark:bg-[#000000] dark:text-[#ededed]",
    border: isDark
      ? "border-[#1c1c1c]"
      : isLight
      ? "border-[#e5e5e5]"
      : "border-[#e5e5e5] dark:border-[#1c1c1c]",
    inputBg: isDark
      ? "bg-[#0a0a0a] border-[#222222] text-[#ededed] placeholder:text-[#666666] focus-within:border-[#3b3b3b]"
      : isLight
      ? "bg-[#fafafa] border-[#e5e5e5] text-[#171717] placeholder:text-[#737373] focus-within:border-[#a3a3a3]"
      : "bg-[#fafafa] border-[#e5e5e5] text-[#171717] placeholder:text-[#737373] focus-within:border-[#a3a3a3] dark:bg-[#0a0a0a] dark:border-[#222222] dark:text-[#ededed] dark:placeholder:text-[#666666] dark:focus-within:border-[#3b3b3b]",
    keycap: isDark
      ? "bg-[#141414] border-[#2a2a2a] text-[#8a8a8a]"
      : isLight
      ? "bg-[#ffffff] border-[#e5e5e5] text-[#737373]"
      : "bg-[#ffffff] border-[#e5e5e5] text-[#737373] dark:bg-[#141414] dark:border-[#2a2a2a] dark:text-[#8a8a8a]",
    planBadge: isDark
      ? "bg-[#161616] border-[#262626] text-[#a1a1aa]"
      : isLight
      ? "bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b]"
      : "bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b] dark:bg-[#161616] dark:border-[#262626] dark:text-[#a1a1aa]",
    navActiveBg: isDark
      ? "bg-[#1f1f1f]"
      : isLight
      ? "bg-[#f4f4f5]"
      : "bg-[#f4f4f5] dark:bg-[#1f1f1f]",
    navActiveText: isDark
      ? "text-[#ffffff]"
      : isLight
      ? "text-[#09090b]"
      : "text-[#09090b] dark:text-[#ffffff]",
    navIdleText: isDark
      ? "text-[#9ca3af] hover:text-[#ededed] hover:bg-[#141414]"
      : isLight
      ? "text-[#52525b] hover:text-[#09090b] hover:bg-[#f4f4f5]/70"
      : "text-[#52525b] hover:text-[#09090b] hover:bg-[#f4f4f5]/70 dark:text-[#9ca3af] dark:hover:text-[#ededed] dark:hover:bg-[#141414]",
    mutedText: isDark
      ? "text-[#737373]"
      : isLight
      ? "text-[#71717a]"
      : "text-[#71717a] dark:text-[#737373]",
    iconButton: isDark
      ? "border-[#242424] bg-[#0a0a0a] text-[#a1a1aa] hover:text-[#ffffff] hover:border-[#383838] hover:bg-[#141414]"
      : isLight
      ? "border-[#e4e4e7] bg-[#ffffff] text-[#52525b] hover:text-[#09090b] hover:border-[#d4d4d8] hover:bg-[#f4f4f5]"
      : "border-[#e4e4e7] bg-[#ffffff] text-[#52525b] hover:text-[#09090b] hover:border-[#d4d4d8] hover:bg-[#f4f4f5] dark:border-[#242424] dark:bg-[#0a0a0a] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] dark:hover:border-[#383838] dark:hover:bg-[#141414]",
    headerAction: isDark
      ? "text-[#d4d4d8] hover:text-[#ffffff] hover:bg-[#141414]"
      : isLight
      ? "text-[#3f3f46] hover:text-[#09090b] hover:bg-[#f4f4f5]"
      : "text-[#3f3f46] hover:text-[#09090b] hover:bg-[#f4f4f5] dark:text-[#d4d4d8] dark:hover:text-[#ffffff] dark:hover:bg-[#141414]",
    popover: isDark
      ? "bg-[#0d0d0d] border-[#262626] text-[#ededed] shadow-[0_14px_36px_rgba(0,0,0,0.75)]"
      : isLight
      ? "bg-[#ffffff] border-[#e4e4e7] text-[#171717] shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
      : "bg-[#ffffff] border-[#e4e4e7] text-[#171717] shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:bg-[#0d0d0d] dark:border-[#262626] dark:text-[#ededed] dark:shadow-[0_14px_36px_rgba(0,0,0,0.75)]",
    popoverHover: isDark
      ? "hover:bg-[#1a1a1a]"
      : isLight
      ? "hover:bg-[#f4f4f5]"
      : "hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a]",
    fadeMask: isDark
      ? "from-[#000000] via-[#000000]/80 to-transparent"
      : isLight
      ? "from-[#ffffff] via-[#ffffff]/80 to-transparent"
      : "from-[#ffffff] via-[#ffffff]/80 to-transparent dark:from-[#000000] dark:via-[#000000]/80 dark:to-transparent",
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
    <ul className="space-y-[2px]" role="list">
      {items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded =
          expandedIds.includes(item.id) ||
          (searchQuery.trim().length > 0 && hasChildren);
        const isDirectActive = currentActiveId === item.id;
        const hasActiveChild =
          item.children?.some((c) => c.id === currentActiveId) ?? false;

        return (
          <li key={item.id}>
            <div className="relative">
              {isDirectActive && (
                <motion.div
                  layoutId={`shell-active-pill-${uid}`}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 520, damping: 38 }
                  }
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-[7px]",
                    T.navActiveBg
                  )}
                />
              )}
              <button
                type="button"
                aria-current={isDirectActive ? "page" : undefined}
                aria-expanded={hasChildren ? isExpanded : undefined}
                onClick={() => {
                  if (hasChildren) {
                    toggleExpand(item.id);
                    handleSelectNav(item.id, item.label);
                  } else {
                    handleSelectNav(item.id, item.label);
                  }
                }}
                className={cn(
                  "relative z-10 flex h-[34px] w-full items-center justify-between rounded-[7px] px-2.5 text-[13px] font-normal tracking-[-0.005em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                  isDirectActive
                    ? cn(T.navActiveText, "font-medium")
                    : hasActiveChild
                    ? T.navActiveText
                    : T.navIdleText
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex items-center justify-center transition-colors",
                      isDirectActive ? T.navActiveText : "opacity-80"
                    )}
                  >
                    {renderNavIcon(item.id, theme)}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                {hasChildren && (
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-150",
                      isExpanded && "rotate-90 opacity-90"
                    )}
                  />
                )}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {hasChildren && isExpanded && item.children && (
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
                  className="overflow-hidden pl-[26px] pr-1 pt-0.5"
                >
                  {item.children.map((child) => {
                    const isChildActive = currentActiveId === child.id;
                    return (
                      <li key={child.id} className="relative">
                        <button
                          type="button"
                          aria-current={isChildActive ? "page" : undefined}
                          onClick={() => handleSelectNav(child.id, child.label)}
                          className={cn(
                            "flex h-[30px] w-full items-center rounded-[6px] px-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                            isChildActive
                              ? cn(T.navActiveBg, T.navActiveText, "font-medium")
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
          </li>
        );
      })}
    </ul>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Top Workspace Switcher */}
      <div className="relative flex h-[52px] shrink-0 items-center px-3">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={activePopover === "workspace"}
          onClick={() =>
            setActivePopover((prev) =>
              prev === "workspace" ? null : "workspace"
            )
          }
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-[7px] px-1.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
            T.popoverHover
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <WorkspaceOrbIcon />
            <span className="truncate text-[13px] font-medium tracking-[-0.01em]">
              {selectedWorkspace.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-[1px] text-[10.5px] font-medium leading-[16px]",
                T.planBadge
              )}
            >
              {selectedWorkspace.plan}
            </span>
          </span>
          <ChevronsUpDown className={cn("h-3.5 w-3.5 shrink-0", T.mutedText)} />
        </button>

        <AnimatePresence>
          {activePopover === "workspace" && (
            <motion.div
              role="menu"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: -4, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -4, scale: 0.98 }
              }
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute left-3 right-3 top-[50px] z-40 rounded-lg border p-1.5",
                T.popover
              )}
            >
              <div
                className={cn(
                  "px-2 py-1 text-[10.5px] font-medium uppercase tracking-wider",
                  T.mutedText
                )}
              >
                Workspaces
              </div>
              {workspaceOptions.map((ws) => {
                const isSelected = ws.name === selectedWorkspace.name;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setActivePopover(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[12.5px] transition-colors",
                      T.popoverHover
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <WorkspaceOrbIcon className="h-4 w-4" />
                      <span className="truncate font-medium">{ws.name}</span>
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-[0.5px] text-[10px]",
                          T.planBadge
                        )}
                      >
                        {ws.plan}
                      </span>
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Find Search Input */}
      <div className="shrink-0 px-3 pb-2.5 pt-0.5">
        <div
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[7px] border px-2.5 transition-colors",
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
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-inherit"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className={cn("rounded p-0.5 transition-colors", T.mutedText)}
            >
              <X className="h-3 w-3" />
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
          className="h-full overflow-y-auto px-2.5 pb-10 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {primaryItems.length > 0 && renderNavGroup(primaryItems)}

          {primaryItems.length > 0 && platformItems.length > 0 && (
            <div className={cn("my-2.5 mx-1 border-t", T.border)} />
          )}

          {platformItems.length > 0 && renderNavGroup(platformItems)}

          {primaryItems.length === 0 && platformItems.length === 0 && (
            <div
              className={cn("px-3 py-6 text-center text-[12.5px]", T.mutedText)}
            >
              No sections matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </nav>

        {/* Subtle bottom fade matching reference */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t",
            T.fadeMask
          )}
        />
      </div>

      {/* Pinned User Footer */}
      <div className="relative flex h-[52px] shrink-0 items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            aria-hidden="true"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tracking-tight",
              isDark
                ? "border-[#2e2e2e] bg-[#1a1a1a] text-[#e4e4e7]"
                : isLight
                ? "border-[#d4d4d8] bg-[#f4f4f5] text-[#18181b]"
                : "border-[#d4d4d8] bg-[#f4f4f5] text-[#18181b] dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:text-[#e4e4e7]"
            )}
          >
            {getInitials(userName)}
          </div>
          <span className="truncate text-[13px] font-medium tracking-[-0.01em]">
            {userName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Account options"
            aria-expanded={activePopover === "account"}
            onClick={() =>
              setActivePopover((prev) =>
                prev === "account" ? null : "account"
              )
            }
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
              T.iconButton
            )}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={activePopover === "notifications"}
            onClick={() =>
              setActivePopover((prev) =>
                prev === "notifications" ? null : "notifications"
              )
            }
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
              T.iconButton
            )}
          >
            <Bell className="h-3.5 w-3.5" />
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
        </div>

        {/* Account Popover */}
        <AnimatePresence>
          {activePopover === "account" && (
            <motion.div
              role="menu"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 4, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 4, scale: 0.98 }
              }
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute bottom-[54px] left-3 right-3 z-40 rounded-lg border p-1.5",
                T.popover
              )}
            >
              <div className={cn("border-b px-2 py-1.5", T.border)}>
                <p className="truncate text-[12.5px] font-medium">{userName}</p>
                <p className={cn("truncate text-[11px]", T.mutedText)}>
                  {selectedWorkspace.name} · {selectedWorkspace.plan}
                </p>
              </div>
              {["Account Settings", "Command Menu", "Billing & Usage"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleSelectNav(
                        label.toLowerCase().replace(/\s+/g, "-"),
                        label
                      );
                      setActivePopover(null);
                    }}
                    className={cn(
                      "mt-0.5 flex w-full items-center rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
                      T.popoverHover
                    )}
                  >
                    {label}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Popover */}
        <AnimatePresence>
          {activePopover === "notifications" && (
            <motion.div
              role="dialog"
              aria-label="Notifications"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 4, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 4, scale: 0.98 }
              }
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute bottom-[54px] left-3 right-3 z-40 rounded-lg border p-2",
                T.popover
              )}
            >
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-[12px] font-medium">Notifications</span>
                {unreadDot && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnreadDot(false);
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, unread: false }))
                      );
                    }}
                    className="text-[11px] text-[#3b82f6] hover:underline"
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
                      "flex items-start gap-2 rounded-md px-2 py-1.5 text-[12px]",
                      T.popoverHover
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
                          "mt-0.5 text-[10.5px] tabular-nums",
                          T.mutedText
                        )}
                      >
                        {note.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div
      ref={(node) => {
        (shellRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      style={{
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      className={cn(
        "relative flex h-[740px] w-full overflow-hidden antialiased selection:bg-[#3b82f6]/30",
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

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
            />
            <motion.aside
              aria-label="Mobile Navigation"
              initial={prefersReducedMotion ? { x: 0 } : { x: -264 }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion ? { x: 0 } : { x: -264 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r md:hidden",
                T.shellBg,
                T.border
              )}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Right Column: Top Header + Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header
          className={cn(
            "relative flex h-[52px] shrink-0 items-center justify-between border-b px-3 sm:px-4",
            T.border
          )}
        >
          {/* Left: Mobile Menu Trigger + Project Switcher */}
          <div className="relative flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md md:hidden",
                T.headerAction
              )}
            >
              <Menu className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={activePopover === "project"}
              onClick={() =>
                setActivePopover((prev) =>
                  prev === "project" ? null : "project"
                )
              }
              className={cn(
                "flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
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

            <AnimatePresence>
              {activePopover === "project" && (
                <motion.div
                  role="menu"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -4, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -4, scale: 0.98 }
                  }
                  transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "absolute left-0 top-[44px] z-40 w-[230px] rounded-lg border p-1.5",
                    T.popover
                  )}
                >
                  <div
                    className={cn(
                      "px-2 py-1 text-[10.5px] font-medium uppercase tracking-wider",
                      T.mutedText
                    )}
                  >
                    Projects
                  </div>
                  {projectOptions.map((proj) => {
                    const isSelected = proj.name === selectedProject.name;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedProject(proj);
                          setActivePopover(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[12.5px] transition-colors",
                          T.popoverHover
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
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Current Page Title */}
          <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 sm:block">
            <h1 className="text-[13px] font-medium tracking-[-0.01em]">
              {activeMeta.label}
            </h1>
          </div>

          {/* Right: Create New + Agent Actions */}
          <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={activePopover === "create"}
              onClick={() =>
                setActivePopover((prev) =>
                  prev === "create" ? null : "create"
                )
              }
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                T.headerAction
              )}
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
              <span>Create New</span>
            </button>

            <button
              type="button"
              aria-pressed={agentDrawerOpen}
              onClick={() => setAgentDrawerOpen((prev) => !prev)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#52525b]",
                agentDrawerOpen
                  ? cn(T.navActiveBg, T.navActiveText)
                  : T.headerAction
              )}
            >
              <AgentConstellationIcon className="h-3.5 w-3.5" />
              <span>Agent</span>
            </button>

            <AnimatePresence>
              {activePopover === "create" && (
                <motion.div
                  role="menu"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -4, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -4, scale: 0.98 }
                  }
                  transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "absolute right-0 top-[44px] z-40 w-[230px] rounded-lg border p-1.5",
                    T.popover
                  )}
                >
                  {CREATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCreateNew?.(opt.id);
                        setActivePopover(null);
                      }}
                      className={cn(
                        "flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition-colors",
                        T.popoverHover
                      )}
                    >
                      <span className="text-[12.5px] font-medium">
                        {opt.label}
                      </span>
                      <span className={cn("text-[11px]", T.mutedText)}>
                        {opt.hint}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
                      T.navActiveBg
                    )}
                  >
                    {renderNavIcon(activeMeta.parentId, theme)}
                  </div>
                  <p className="text-[14px] font-medium tracking-[-0.01em]">
                    {activeMeta.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 max-w-[280px] text-[12.5px]",
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
                  <span className="flex items-center gap-2 text-[12.5px] font-medium">
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
                <div className="flex-1 space-y-3 p-3.5 text-[12.5px]">
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
                          "w-full rounded-lg border px-2.5 py-2 text-left text-[12px] transition-colors",
                          T.border,
                          T.popoverHover
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