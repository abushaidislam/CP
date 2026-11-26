"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Settings, Smartphone, User } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type AccountSwitcherTheme = "auto" | "dark" | "light";
export type AccountSwitcherAlign = "start" | "center" | "end";

export interface SwitcherAccount {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
}

export interface AccountMenuItem {
  id: string;
  label: string;
  icon: "profile" | "settings" | "devices" | "signout";
  showHandle?: boolean;
}

export interface AccountSwitcherMenuProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** List of accounts available to switch between */
  accounts?: SwitcherAccount[];
  /** Controlled active account ID */
  activeAccountId?: string;
  /** Uncontrolled initial active account ID */
  defaultAccountId?: string;
  /** Callback fired when the user switches accounts */
  onAccountChange?: (account: SwitcherAccount) => void;
  /** Controlled open state of the dropdown menu */
  open?: boolean;
  /** Uncontrolled initial open state */
  defaultOpen?: boolean;
  /** Callback fired when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Alignment of the dropdown panel relative to the avatar trigger */
  align?: AccountSwitcherAlign;
  /** Theme mode: "auto" follows Tailwind dark: class, or force "dark" / "light" */
  theme?: AccountSwitcherTheme;
  /** Whether to display the active user's @handle next to "My profile" */
  showHandle?: boolean;
  /** Whether to display the bottom "Sign out of all accounts" button */
  showSignOutAll?: boolean;
  /** Navigation items in the top menu section */
  menuItems?: AccountMenuItem[];
  /** Callback fired when a top menu item is clicked */
  onMenuAction?: (actionId: string, account: SwitcherAccount) => void;
  /** Callback fired when "Sign out of all accounts" is clicked */
  onSignOutAll?: () => void;
}

export const DEFAULT_ACCOUNTS: SwitcherAccount[] = [
  {
    id: "mia",
    name: "Mia de Silva",
    handle: "@mia",
    email: "hi@miadesign.io",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&h=160&q=85",
  },
  {
    id: "caitlyn",
    name: "Caitlyn King",
    handle: "@caitlyn",
    email: "caitlyn@nuvora.co",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&h=160&q=85",
  },
];

export const DEFAULT_MENU_ITEMS: AccountMenuItem[] = [
  { id: "profile", label: "My profile", icon: "profile", showHandle: true },
  { id: "settings", label: "Account settings", icon: "settings" },
  { id: "devices", label: "Device management", icon: "devices" },
  { id: "signout", label: "Sign out", icon: "signout" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function AvatarImage({
  name,
  src,
  sizeClass = "h-10 w-10",
  isDarkForced,
  isLightForced,
}: {
  name: string;
  src?: string;
  sizeClass?: string;
  isDarkForced: boolean;
  isLightForced: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none",
          sizeClass,
          isDarkForced
            ? "bg-[#363538] text-[#F4F4F5] ring-1 ring-white/10"
            : isLightForced
              ? "bg-zinc-200 text-zinc-800 ring-1 ring-black/5"
              : "bg-zinc-200 text-zinc-800 ring-1 ring-black/5 dark:bg-[#363538] dark:text-[#F4F4F5] dark:ring-white/10"
        )}
      >
        {getInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded-full object-cover select-none",
        sizeClass,
        isDarkForced
          ? "bg-[#2C2C2F]"
          : isLightForced
            ? "bg-zinc-100"
            : "bg-zinc-100 dark:bg-[#2C2C2F]"
      )}
    />
  );
}

function MenuIcon({
  icon,
  className,
}: {
  icon: AccountMenuItem["icon"];
  className?: string;
}) {
  switch (icon) {
    case "profile":
      return <User className={className} strokeWidth={1.75} aria-hidden="true" />;
    case "settings":
      return (
        <Settings className={className} strokeWidth={1.75} aria-hidden="true" />
      );
    case "devices":
      return (
        <Smartphone className={className} strokeWidth={1.75} aria-hidden="true" />
      );
    case "signout":
      return <LogOut className={className} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export const AccountSwitcherMenu = React.forwardRef<
  HTMLDivElement,
  AccountSwitcherMenuProps
>(function AccountSwitcherMenu(
  {
    accounts = DEFAULT_ACCOUNTS,
    activeAccountId,
    defaultAccountId,
    onAccountChange,
    open: controlledOpen,
    defaultOpen = true,
    onOpenChange,
    align = "end",
    theme = "auto",
    showHandle = true,
    showSignOutAll = true,
    menuItems = DEFAULT_MENU_ITEMS,
    onMenuAction,
    onSignOutAll,
    className,
    ...rest
  },
  forwardedRef
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const safeAccounts = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [internalAccountId, setInternalAccountId] = useState(
    defaultAccountId ?? safeAccounts[0].id
  );
  const currentAccountId =
    activeAccountId !== undefined ? activeAccountId : internalAccountId;

  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(
    menuItems[0]?.id ?? null
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  const activeAccount = useMemo(
    () =>
      safeAccounts.find((acc) => acc.id === currentAccountId) ?? safeAccounts[0],
    [safeAccounts, currentAccountId]
  );

  useEffect(() => {
    if (controlledOpen === undefined) {
      setInternalOpen(defaultOpen);
    }
  }, [defaultOpen, controlledOpen]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const setOpenState = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );

  const flashNotice = useCallback((message: string) => {
    setStatusNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 2200);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenState(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenState(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpenState]);

  const handleSelectAccount = useCallback(
    (account: SwitcherAccount) => {
      if (activeAccountId === undefined) {
        setInternalAccountId(account.id);
      }
      onAccountChange?.(account);
    },
    [activeAccountId, onAccountChange]
  );

  const handleMenuClick = useCallback(
    (item: AccountMenuItem) => {
      onMenuAction?.(item.id, activeAccount);
      if (!onMenuAction) {
        flashNotice(
          item.id === "signout"
            ? `Signed out of ${activeAccount.handle}`
            : `Opened ${item.label}`
        );
      }
    },
    [activeAccount, onMenuAction, flashNotice]
  );

  const handleSignOutAllClick = useCallback(() => {
    onSignOutAll?.();
    if (!onSignOutAll) {
      flashNotice("Signed out of all accounts");
    }
  }, [onSignOutAll, flashNotice]);

  const handleRadioKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const nextIndex = (index + 1) % safeAccounts.length;
        handleSelectAccount(safeAccounts[nextIndex]);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const prevIndex =
          (index - 1 + safeAccounts.length) % safeAccounts.length;
        handleSelectAccount(safeAccounts[prevIndex]);
      }
    },
    [safeAccounts, handleSelectAccount]
  );

  const isDarkForced = theme === "dark";
  const isLightForced = theme === "light";

  const alignWrapperClass =
    align === "start"
      ? "items-start"
      : align === "center"
        ? "items-center"
        : "items-end";

  const panelOriginStyle =
    align === "start"
      ? "top left"
      : align === "center"
        ? "top center"
        : "top right";

  const springTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.8 };

  const popoverTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 460, damping: 34, mass: 0.75 };

  return (
    <div
      ref={setMergedRef}
      className={cn(
        "relative inline-flex flex-col font-sans antialiased",
        alignWrapperClass,
        className
      )}
      {...rest}
    >
      {/* Avatar Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={`account-menu-panel-${uid}`}
        aria-label={`Account menu for ${activeAccount.name}`}
        onClick={() => setOpenState(!isOpen)}
        className={cn(
          "relative rounded-full p-0.5 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7CFC] focus-visible:ring-offset-2",
          isDarkForced
            ? "ring-1 ring-white/15 hover:ring-white/30 focus-visible:ring-offset-[#1F1F21]"
            : isLightForced
              ? "ring-1 ring-black/10 hover:ring-black/20 focus-visible:ring-offset-white"
              : "ring-1 ring-black/10 hover:ring-black/20 focus-visible:ring-offset-white dark:ring-white/15 dark:hover:ring-white/30 dark:focus-visible:ring-offset-[#1F1F21]"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={activeAccount.id}
            initial={prefersReducedMotion ? false : { opacity: 0.4, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0.4, scale: 0.92 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="block rounded-full"
          >
            <AvatarImage
              name={activeAccount.name}
              src={activeAccount.avatarUrl}
              sizeClass="h-10 w-10"
              isDarkForced={isDarkForced}
              isLightForced={isLightForced}
            />
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Dropdown Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`account-menu-panel-${uid}`}
            role="menu"
            aria-label="Account navigation and switcher"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: -6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: -6 }
            }
            transition={popoverTransition}
            style={{ transformOrigin: panelOriginStyle }}
            className={cn(
              "mt-2.5 w-[316px] max-w-[calc(100vw-2rem)] rounded-[18px] border p-2",
              isDarkForced
                ? "border-white/[0.08] bg-[#1F1F21] text-[#F4F4F5] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset]"
                : isLightForced
                  ? "border-zinc-200/90 bg-white text-zinc-900 shadow-[0_20px_44px_-12px_rgba(15,23,42,0.14),0_2px_6px_-1px_rgba(15,23,42,0.06)]"
                  : "border-zinc-200/90 bg-white text-zinc-900 shadow-[0_20px_44px_-12px_rgba(15,23,42,0.14),0_2px_6px_-1px_rgba(15,23,42,0.06)] dark:border-white/[0.08] dark:bg-[#1F1F21] dark:text-[#F4F4F5] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset]"
            )}
          >
            {/* Primary Navigation Actions */}
            <div
              className="flex flex-col gap-0.5"
              onMouseLeave={() => setHoveredMenuId(null)}
            >
              {menuItems.map((item) => {
                const isHighlighted = hoveredMenuId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onMouseEnter={() => setHoveredMenuId(item.id)}
                    onFocus={() => setHoveredMenuId(item.id)}
                    onClick={() => handleMenuClick(item)}
                    className={cn(
                      "group relative flex h-[42px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7CFC]",
                      isHighlighted
                        ? isDarkForced
                          ? "text-white"
                          : isLightForced
                            ? "text-zinc-950"
                            : "text-zinc-950 dark:text-white"
                        : isDarkForced
                          ? "text-[#B4B4B8]"
                          : isLightForced
                            ? "text-zinc-600"
                            : "text-zinc-600 dark:text-[#B4B4B8]"
                    )}
                  >
                    {isHighlighted && (
                      <motion.span
                        layoutId={`menu-hover-pill-${uid}`}
                        transition={springTransition}
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 rounded-[10px]",
                          isDarkForced
                            ? "bg-[#363538]"
                            : isLightForced
                              ? "bg-zinc-100"
                              : "bg-zinc-100 dark:bg-[#363538]"
                        )}
                      />
                    )}

                    <MenuIcon
                      icon={item.icon}
                      className={cn(
                        "relative z-10 h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                        isHighlighted
                          ? isDarkForced
                            ? "text-[#B4B4B8]"
                            : isLightForced
                              ? "text-zinc-700"
                              : "text-zinc-700 dark:text-[#B4B4B8]"
                          : isDarkForced
                            ? "text-[#8E8D91]"
                            : isLightForced
                              ? "text-zinc-400"
                              : "text-zinc-400 dark:text-[#8E8D91]"
                      )}
                    />

                    <span className="relative z-10 flex min-w-0 items-baseline gap-1.5 truncate">
                      <span
                        className={cn(
                          "truncate",
                          isHighlighted ? "font-semibold" : "font-medium"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.showHandle && showHandle && (
                        <span
                          className={cn(
                            "truncate text-[14px] font-normal",
                            isDarkForced
                              ? "text-[#9B9A9D]"
                              : isLightForced
                                ? "text-zinc-400"
                                : "text-zinc-400 dark:text-[#9B9A9D]"
                          )}
                        >
                          {activeAccount.handle}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Section Divider */}
            <div
              role="separator"
              className={cn(
                "-mx-2 my-2 h-px",
                isDarkForced
                  ? "bg-[#2C2B2E]"
                  : isLightForced
                    ? "bg-zinc-200/80"
                    : "bg-zinc-200/80 dark:bg-[#2C2B2E]"
              )}
            />

            {/* Switch Account Section */}
            <div className="pt-1">
              <div
                id={`switch-account-heading-${uid}`}
                className={cn(
                  "px-3 pb-2 text-[11px] font-semibold tracking-[0.06em] uppercase select-none",
                  isDarkForced
                    ? "text-[#949398]"
                    : isLightForced
                      ? "text-zinc-400"
                      : "text-zinc-400 dark:text-[#949398]"
                )}
              >
                Switch Account
              </div>

              <div
                role="radiogroup"
                aria-labelledby={`switch-account-heading-${uid}`}
                className="flex flex-col gap-1"
              >
                {safeAccounts.map((account, index) => {
                  const isSelected = account.id === activeAccount.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectAccount(account)}
                      onKeyDown={(e) => handleRadioKeyDown(e, index)}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7CFC]",
                        !isSelected &&
                          (isDarkForced
                            ? "hover:bg-white/[0.04]"
                            : isLightForced
                              ? "hover:bg-zinc-100/70"
                              : "hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]")
                      )}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId={`active-account-bg-${uid}`}
                          transition={springTransition}
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none absolute inset-0 rounded-[12px]",
                            isDarkForced
                              ? "bg-[#373639]"
                              : isLightForced
                                ? "bg-zinc-100"
                                : "bg-zinc-100 dark:bg-[#373639]"
                          )}
                        />
                      )}

                      <span className="relative z-10">
                        <AvatarImage
                          name={account.name}
                          src={account.avatarUrl}
                          sizeClass="h-10 w-10"
                          isDarkForced={isDarkForced}
                          isLightForced={isLightForced}
                        />
                      </span>

                      <span className="relative z-10 flex min-w-0 flex-1 flex-col">
                        <span
                          className={cn(
                            "truncate text-[14px] leading-snug font-semibold",
                            isDarkForced
                              ? "text-white"
                              : isLightForced
                                ? "text-zinc-900"
                                : "text-zinc-900 dark:text-white"
                          )}
                        >
                          {account.name}
                        </span>
                        <span
                          className={cn(
                            "truncate text-[13px] leading-snug font-normal",
                            isDarkForced
                              ? "text-[#9B9A9D]"
                              : isLightForced
                                ? "text-zinc-500"
                                : "text-zinc-500 dark:text-[#9B9A9D]"
                          )}
                        >
                          {account.email}
                        </span>
                      </span>

                      {/* Radio Indicator */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                          isSelected
                            ? "border-[#8C7CFC] bg-[#8C7CFC]"
                            : isDarkForced
                              ? "border-[#4A494D] bg-transparent"
                              : isLightForced
                                ? "border-zinc-300 bg-transparent"
                                : "border-zinc-300 bg-transparent dark:border-[#4A494D]"
                        )}
                      >
                        <AnimatePresence initial={false}>
                          {isSelected && (
                            <motion.span
                              initial={
                                prefersReducedMotion
                                  ? false
                                  : { scale: 0, opacity: 0 }
                              }
                              animate={{ scale: 1, opacity: 1 }}
                              exit={
                                prefersReducedMotion
                                  ? undefined
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={springTransition}
                              className="h-2 w-2 rounded-full bg-white"
                            />
                          )}
                        </AnimatePresence>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Sign Out of All Accounts Button */}
            {showSignOutAll && (
              <div className="mt-2.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOutAllClick}
                  className={cn(
                    "flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] border text-[14px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7CFC]",
                    isDarkForced
                      ? "border-white/[0.08] bg-[#373639] text-[#F4F4F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#414044] active:bg-[#323134]"
                      : isLightForced
                        ? "border-zinc-200 bg-zinc-100 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-zinc-200/80 active:bg-zinc-200"
                        : "border-zinc-200 bg-zinc-100 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-zinc-200/80 active:bg-zinc-200 dark:border-white/[0.08] dark:bg-[#373639] dark:text-[#F4F4F5] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:bg-[#414044] dark:active:bg-[#323134]"
                  )}
                >
                  <LogOut
                    className={cn(
                      "h-[16px] w-[16px] shrink-0",
                      isDarkForced
                        ? "text-[#9B9A9D]"
                        : isLightForced
                          ? "text-zinc-500"
                          : "text-zinc-500 dark:text-[#9B9A9D]"
                    )}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Sign out of all accounts</span>
                </button>
              </div>
            )}

            {/* Subtle Accessible Live Feedback Region */}
            <AnimatePresence>
              {statusNotice && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    "mt-2 rounded-[8px] px-3 py-1.5 text-center text-[12px] font-medium",
                    isDarkForced
                      ? "bg-[#2A292D] text-[#C4C3C8]"
                      : isLightForced
                        ? "bg-zinc-100 text-zinc-600"
                        : "bg-zinc-100 text-zinc-600 dark:bg-[#2A292D] dark:text-[#C4C3C8]"
                  )}
                >
                  {statusNotice}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AccountSwitcherMenu.displayName = "AccountSwitcherMenu";

export { AccountSwitcherMenu as component, AccountSwitcherMenu as Component };
export default AccountSwitcherMenu;