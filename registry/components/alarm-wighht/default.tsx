'use client';

import React from 'react';
import {
  FocusTimerWidget,
  DEFAULT_TIMER_PRESETS,
  type RingDirection,
  type TimerSize,
  type TimerTheme,
} from '../component';

const settings = {
  theme: 'dark' as TimerTheme,
  size: 'md' as TimerSize,
  label: 'Timer',
  stopLabel: 'Stop',
  initialPresetId: '20m',
  initialRemainingSeconds: 975,
  initialRunning: true,
  autoStartOnPresetChange: true,
  ringDirection: 'counter-clockwise' as RingDirection,
  showPresets: true,
  showDockBar: true,
  soundEnabled: false,
};

const VALID_THEMES: TimerTheme[] = ['dark', 'light'];
const VALID_SIZES: TimerSize[] = ['sm', 'md', 'lg'];
const VALID_DIRECTIONS: RingDirection[] = ['counter-clockwise', 'clockwise'];
const VALID_PRESET_IDS = DEFAULT_TIMER_PRESETS.map((p) => p.id);

export default function FocusTimerWidgetDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: TimerTheme = VALID_THEMES.includes(config.theme)
    ? config.theme
    : 'dark';
  const size: TimerSize = VALID_SIZES.includes(config.size)
    ? config.size
    : 'md';
  const ringDirection: RingDirection = VALID_DIRECTIONS.includes(
    config.ringDirection
  )
    ? config.ringDirection
    : 'counter-clockwise';
  const initialPresetId = VALID_PRESET_IDS.includes(config.initialPresetId)
    ? config.initialPresetId
    : '20m';
  const initialRemainingSeconds =
    typeof config.initialRemainingSeconds === 'number' &&
    Number.isFinite(config.initialRemainingSeconds)
      ? Math.max(0, Math.round(config.initialRemainingSeconds))
      : 975;

  return (
    <div
      className={`flex min-h-[380px] w-full items-center justify-center rounded-2xl p-6 sm:p-10 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#d5d6db]' : 'bg-[#f4f5f7]'
      }`}
    >
      <FocusTimerWidget
        presets={DEFAULT_TIMER_PRESETS}
        initialPresetId={initialPresetId}
        initialRemainingSeconds={initialRemainingSeconds}
        initialRunning={Boolean(config.initialRunning)}
        autoStartOnPresetChange={Boolean(config.autoStartOnPresetChange)}
        label={config.label || 'Timer'}
        stopLabel={config.stopLabel || 'Stop'}
        theme={theme}
        size={size}
        ringDirection={ringDirection}
        showPresets={Boolean(config.showPresets)}
        showDockBar={Boolean(config.showDockBar)}
        soundEnabled={Boolean(config.soundEnabled)}
      />
    </div>
  );
}