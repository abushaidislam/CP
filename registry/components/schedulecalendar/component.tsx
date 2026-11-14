"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ScheduleEvent {
  id: string;
  title: string;
  timeRange: string;
  location?: string;
  notes?: string;
}

export interface ScheduleDay {
  weekday: string;
  date: number;
  isoDate?: string;
  events: ScheduleEvent[];
}

export interface ScheduleCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  monthLabel?: string;
  days?: ScheduleDay[];
  selectedDate?: number;
  defaultSelectedDate?: number;
  onSelectDate?: (date: number, day: ScheduleDay) => void;
  onEventClick?: (event: ScheduleEvent, day: ScheduleDay) => void;
  emptyStateMessage?: string;
}

export const DEFAULT_SCHEDULE_DAYS: ScheduleDay[] = [
  {
    weekday: "Su",
    date: 10,
    isoDate: "2023-02-10",
    events: [
      {
        id: "evt-10-1",
        title: "Design System Sync",
        timeRange: "09:30 – 10:15",
        location: "Studio Room B",
      },
    ],
  },
  {
    weekday: "Mo",
    date: 11,
    isoDate: "2023-02-11",
    events: [
      {
        id: "evt-11-1",
        title: "Sprint Planning",
        timeRange: "11:00 – 12:00",
        location: "Main Conference",
      },
      { id: "evt-11-2", title: "1:1 Check-in", timeRange: "15:00 – 15:30" },
    ],
  },
  {
    weekday: "Tu",
    date: 12,
    isoDate: "2023-02-12",
    events: [
      {
        id: "evt-12-1",
        title: "Project Review",
        timeRange: "10:00 – 11:00",
        location: "Design Lab",
      },
      { id: "evt-12-2", title: "Lunch Time", timeRange: "12:00 – 12:30" },
    ],
  },
  { weekday: "We", date: 13, isoDate: "2023-02-13", events: [] },
  {
    weekday: "Th",
    date: 14,
    isoDate: "2023-02-14",
    events: [
      {
        id: "evt-14-1",
        title: "Architecture Workshop",
        timeRange: "14:00 – 15:30",
        location: "Huddle 3",
      },
    ],
  },
  { weekday: "Fr", date: 15, isoDate: "2023-02-15", events: [] },
  {
    weekday: "Sa",
    date: 16,
    isoDate: "2023-02-16",
    events: [
      { id: "evt-16-1", title: "Weekly Wrap-up", timeRange: "16:30 – 17:00" },
    ],
  },
];

const pillSpring = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };
const contentEase = [0.22, 1, 0.36, 1] as const;

export default function ScheduleCalendar({
  monthLabel = "2023년 2월",
  days = DEFAULT_SCHEDULE_DAYS,
  selectedDate: controlledSelectedDate,
  defaultSelectedDate = 12,
  onSelectDate,
  onEventClick,
  emptyStateMessage = "No events scheduled",
  className,
  ...props
}: ScheduleCalendarProps) {
  const [uncontrolledDate, setUncontrolledDate] =
    useState<number>(defaultSelectedDate);
  const [direction, setDirection] = useState<number>(0);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const dayButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isControlled = controlledSelectedDate !== undefined;
  const activeDate = isControlled ? controlledSelectedDate : uncontrolledDate;

  const activeIndex = Math.max(
    0,
    days.findIndex((d) => d.date === activeDate)
  );
  const activeDay = days[activeIndex] ?? days[0] ?? null;

  const handleSelectDay = (day: ScheduleDay, nextIndex: number) => {
    setDirection(nextIndex >= activeIndex ? 1 : -1);
    if (!isControlled) setUncontrolledDate(day.date);
    setActiveEventId(null);
    onSelectDate?.(day.date, day);
  };

  const handleDayKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % days.length;
    else if (e.key === "ArrowLeft")
      nextIndex = (index - 1 + days.length) % days.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = days.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      const targetDay = days[nextIndex];
      if (targetDay) {
        handleSelectDay(targetDay, nextIndex);
        dayButtonRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        aria-label={`Schedule for ${monthLabel}`}
        className={cn(
          "w-full max-w-[360px] rounded-[26px] bg-[#191919] p-[4px] pt-[20px]",
          "shadow-[0_24px_48px_-12px_rgba(0,0,0,0.22),0_4px_12px_-2px_rgba(0,0,0,0.12)]",
          "select-none font-sans antialiased",
          className
        )}
        {...props}
      >
        <header className="px-[18px] pb-[16px]">
          <h2 className="text-[15.5px] font-semibold tracking-[-0.015em] text-white leading-tight">
            {monthLabel}
          </h2>
        </header>

        <div
          role="tablist"
          aria-label="Days of the week"
          className="grid grid-cols-7 items-start px-[10px] pb-[10px]"
        >
          {days.map((day, index) => {
            const isSelected = day.date === activeDay?.date;
            const hasEvents = day.events.length > 0;
            return (
              <div
                key={day.isoDate ?? `${day.weekday}-${day.date}`}
                className="flex flex-col items-center"
              >
                <span
                  aria-hidden="true"
                  className="mb-[10px] text-[12px] font-medium tracking-[-0.01em] text-[#e5e5e5]"
                >
                  {day.weekday}
                </span>
                <motion.button
                  ref={(el) => (dayButtonRefs.current[index] = el)}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${day.weekday} ${day.date}${hasEvents ? `, ${day.events.length} scheduled` : ""}`}
                  tabIndex={isSelected ? 0 : -1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleSelectDay(day, index)}
                  onKeyDown={(e) => handleDayKeyDown(e, index)}
                  className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full text-[13px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]"
                >
                  {isSelected && (
                    <motion.span
                      layoutId="schedule-active-date-pill"
                      transition={pillSpring}
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-[#ffffff] via-[#f6f6f6] to-[#dedede] shadow-[0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 transition-colors duration-150",
                      isSelected
                        ? "font-semibold text-[#191919]"
                        : "font-normal text-[#e0e0e0] hover:text-white"
                    )}
                  >
                    {day.date}
                  </span>
                </motion.button>
                <div className="mt-[4px] flex h-[6px] items-center justify-center">
                  <AnimatePresence initial={false}>
                    {hasEvents && !isSelected && (
                      <motion.span
                        key="dot"
                        aria-hidden="true"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.16, ease: contentEase }}
                        className="h-[4px] w-[4px] rounded-full bg-[#4b4b4b]"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        <div
          role="tabpanel"
          className="relative h-[186px] overflow-y-auto overflow-x-hidden rounded-[22px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={activeDay?.isoDate ?? activeDay?.date ?? "empty"}
              custom={direction}
              initial={{ opacity: 0, x: direction * 14, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: direction * -14, filter: "blur(2px)" }}
              transition={{ duration: 0.2, ease: contentEase }}
              className="h-full"
            >
              {activeDay && activeDay.events.length > 0 ? (
                <ul className="divide-y divide-[#f0f0f0] px-[20px]">
                  {activeDay.events.map((event) => {
                    const isExpanded =
                      activeEventId === event.id && !onEventClick;
                    return (
                      <motion.li key={event.id} layout="position">
                        <motion.button
                          type="button"
                          layout="position"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setActiveEventId((prev) =>
                              prev === event.id ? null : event.id
                            );
                            onEventClick?.(event, activeDay);
                          }}
                          className="group flex w-full items-center justify-between py-[22px] text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#191919]/30"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#111111]">
                              {event.title}
                            </p>
                            <p className="mt-[4px] text-[12.5px] font-normal tabular-nums text-[#8e8e93]">
                              {event.timeRange}
                            </p>
                            <AnimatePresence initial={false}>
                              {isExpanded &&
                                (event.location || event.notes) && (
                                  <motion.p
                                    initial={{
                                      opacity: 0,
                                      height: 0,
                                      marginTop: 0,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      height: "auto",
                                      marginTop: 6,
                                    }}
                                    exit={{
                                      opacity: 0,
                                      height: 0,
                                      marginTop: 0,
                                    }}
                                    transition={{
                                      duration: 0.18,
                                      ease: contentEase,
                                    }}
                                    className="overflow-hidden text-[12px] text-[#666666]"
                                  >
                                    {[event.location, event.notes]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </motion.p>
                                )}
                            </AnimatePresence>
                          </div>
                          <ChevronRight
                            aria-hidden="true"
                            className="h-[16px] w-[16px] shrink-0 text-[#b5b5b8] transition-transform duration-150 group-hover:translate-x-[2px] group-hover:text-[#6e6e73]"
                            strokeWidth={2}
                          />
                        </motion.button>
                      </motion.li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-[20px] text-center">
                  <p className="text-[14px] font-medium text-[#6e6e73]">
                    {emptyStateMessage}
                  </p>
                  <p className="mt-[4px] text-[12px] text-[#a0a0a5]">
                    Select a highlighted date to view scheduled items.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </MotionConfig>
  );
}
