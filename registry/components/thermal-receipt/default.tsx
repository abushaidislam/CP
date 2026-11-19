"use client";

import React from "react";
import { ThermalReceipt } from "@/components/ui/component";

const settings = {
  merchantName: "BLUE TOKAI COFFEE",
  orderNumber: "#4471",
  printSpeed: 200,
  typewriter: true,
  showQrCode: true,
  autoPrint: false,
};

export default function ThermalReceiptDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const merchantName =
    typeof config.merchantName === "string" && config.merchantName.trim().length > 0
      ? config.merchantName
      : settings.merchantName;

  const orderNumber =
    typeof config.orderNumber === "string" && config.orderNumber.trim().length > 0
      ? config.orderNumber
      : settings.orderNumber;

  const printSpeed =
    typeof config.printSpeed === "number" && Number.isFinite(config.printSpeed)
      ? Math.max(60, Math.min(500, config.printSpeed))
      : settings.printSpeed;

  const typewriter =
    typeof config.typewriter === "boolean"
      ? config.typewriter
      : settings.typewriter;

  const showQrCode =
    typeof config.showQrCode === "boolean"
      ? config.showQrCode
      : settings.showQrCode;

  const autoPrint =
    typeof config.autoPrint === "boolean"
      ? config.autoPrint
      : settings.autoPrint;

  return (
    <div className="flex min-h-[540px] w-full items-center justify-center p-6">
      <ThermalReceipt
        merchantName={merchantName}
        orderNumber={orderNumber}
        printSpeed={printSpeed}
        typewriter={typewriter}
        showQrCode={showQrCode}
        autoPrint={autoPrint}
      />
    </div>
  );
}

export { ThermalReceiptDemo as Demo, ThermalReceiptDemo as demo };