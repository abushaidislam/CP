"use client";

import React, { useMemo } from "react";
import {
  LeatherWalletWidget,
  type WalletAccountCard,
} from "@/components/ui/component";

const settings = {
  stripeBalance: 84500,
  paypalBalance: 35500,
  currencySymbol: "$",
  balanceLabel: "Total Balance",
  interactive: true,
  showCents: false,
  leatherFinish: "pebbled",
};

type LeatherFinish = "pebbled" | "matte" | "obsidian";

const VALID_FINISHES: LeatherFinish[] = ["pebbled", "matte", "obsidian"];

export default function LeatherWalletWidgetDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const stripeBalance =
    typeof config.stripeBalance === "number" &&
    Number.isFinite(config.stripeBalance)
      ? Math.max(0, config.stripeBalance)
      : settings.stripeBalance;

  const paypalBalance =
    typeof config.paypalBalance === "number" &&
    Number.isFinite(config.paypalBalance)
      ? Math.max(0, config.paypalBalance)
      : settings.paypalBalance;

  const leatherFinish: LeatherFinish = VALID_FINISHES.includes(
    config.leatherFinish as LeatherFinish
  )
    ? (config.leatherFinish as LeatherFinish)
    : "pebbled";

  const cards: WalletAccountCard[] = useMemo(
    () => [
      {
        id: "stripe",
        name: "Stripe",
        balance: stripeBalance,
        accentColor: "#6372E8",
        textColor: "#FFFFFF",
        logo: "stripe",
        last4: "4821",
        status: "Connected",
      },
      {
        id: "paypal",
        name: "PayPal",
        balance: paypalBalance,
        accentColor: "#FFFFFF",
        textColor: "#0F172A",
        logo: "paypal",
        last4: "9034",
        status: "Verified",
      },
    ],
    [stripeBalance, paypalBalance]
  );

  return (
    <div className="w-full min-h-[460px] flex items-center justify-center p-8 bg-[#F4F3EF] dark:bg-[#0A0A0B]">
      <LeatherWalletWidget
        cards={cards}
        currencySymbol={config.currencySymbol || "$"}
        balanceLabel={config.balanceLabel || "Total Balance"}
        interactive={Boolean(config.interactive)}
        showCents={Boolean(config.showCents)}
        leatherFinish={leatherFinish}
      />
    </div>
  );
}