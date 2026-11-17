'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  FocusTimerWidget,
  DEFAULT_TIMER_PRESETS,
  type RingDirection,
  type TimerSize,
  type TimerTheme,
} from '../component';

interface TimerPreviewSettings {
  theme: TimerTheme;
  size: TimerSize;
  label: string;
  stopLabel: string;
  ringDirection: RingDirection;
  showPresets: boolean;
  showDockBar: boolean;
  autoStartOnPresetChange: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: TimerPreviewSettings = {
  theme: 'dark',
  size: 'md',
  label: 'Timer',
  stopLabel: 'Stop',
  ringDirection: 'counter-clockwise',
  showPresets: true,
  showDockBar: true,
  autoStartOnPresetChange: true,
  soundEnabled: false,
};

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-flow-col auto-cols-fr rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800/80"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-950 dark:text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex flex-col">
        <label
          htmlFor={id}
          className="text-xs font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
          checked ? 'bg-neutral-900 dark:bg-sky-500' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  );
}

export default function FocusTimerWidgetDemo() {
  const [settings, setSettings] = useState<TimerPreviewSettings>(DEFAULT_SETTINGS);
  const [instanceKey, setInstanceKey] = useState<number>(0);

  const updateSetting = <K extends keyof TimerPreviewSettings>(
    key: K,
    value: TimerPreviewSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setInstanceKey((k) => k + 1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Live Component Preview Stage */}
        <div
          className={`relative flex min-h-[380px] items-center justify-center p-6 sm:p-10 transition-colors duration-200 ${
            settings.theme === 'dark' ? 'bg-[#d5d6db]' : 'bg-[#f4f5f7]'
          }`}
        >
          <FocusTimerWidget
            key={instanceKey}
            presets={DEFAULT_TIMER_PRESETS}
            initialPresetId="20m"
            initialRemainingSeconds={975}
            initialRunning={true}
            theme={settings.theme}
            size={settings.size}
            label={settings.label}
            stopLabel={settings.stopLabel}
            ringDirection={settings.ringDirection}
            showPresets={settings.showPresets}
            showDockBar={settings.showDockBar}
            autoStartOnPresetChange={settings.autoStartOnPresetChange}
            soundEnabled={settings.soundEnabled}
          />
        </div>

        {/* 21st.dev-Style Settings Panel */}
        <aside
          aria-label="Component settings"
          className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Customize
              </h2>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            {/* Appearance */}
            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Appearance
              </span>
              <SegmentedControl
                label="Theme"
                value={settings.theme}
                options={[
                  { label: 'Dark', value: 'dark' },
                  { label: 'Light', value: 'light' },
                ]}
                onChange={(v) => updateSetting('theme', v)}
              />
              <SegmentedControl
                label="Size"
                value={settings.size}
                options={[
                  { label: 'SM', value: 'sm' },
                  { label: 'MD', value: 'md' },
                  { label: 'LG', value: 'lg' },
                ]}
                onChange={(v) => updateSetting('size', v)}
              />
              <ToggleRow
                id="toggle-presets"
                label="Show preset pills"
                checked={settings.showPresets}
                onChange={(v) => updateSetting('showPresets', v)}
              />
              <ToggleRow
                id="toggle-dock"
                label="Show dock indicator"
                checked={settings.showDockBar}
                onChange={(v) => updateSetting('showDockBar', v)}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Content
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-label"
                    className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
                  >
                    Title
                  </label>
                  <input
                    id="input-label"
                    type="text"
                    value={settings.label}
                    onChange={(e) => updateSetting('label', e.target.value)}
                    className="h-8 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-stop"
                    className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
                  >
                    Stop button
                  </label>
                  <input
                    id="input-stop"
                    type="text"
                    value={settings.stopLabel}
                    onChange={(e) => updateSetting('stopLabel', e.target.value)}
                    className="h-8 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* Behavior & Motion */}
            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Behavior & Motion
              </span>
              <SegmentedControl
                label="Ring drain direction"
                value={settings.ringDirection}
                options={[
                  { label: 'Counter-CW', value: 'counter-clockwise' },
                  { label: 'Clockwise', value: 'clockwise' },
                ]}
                onChange={(v) => updateSetting('ringDirection', v)}
              />
              <ToggleRow
                id="toggle-autostart"
                label="Auto-start on preset"
                description="Begin countdown immediately when switching pills"
                checked={settings.autoStartOnPresetChange}
                onChange={(v) => updateSetting('autoStartOnPresetChange', v)}
              />
              <ToggleRow
                id="toggle-sound"
                label="Completion chime"
                description="Play a soft Web Audio chime at 00:00"
                checked={settings.soundEnabled}
                onChange={(v) => updateSetting('soundEnabled', v)}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}