"use client";

import React from "react";
import Component from "../components/ui/component";

export default function Demo() {
  return (
    <div className="w-full min-h-screen">
      <Component minHeight="min(620px, 100%)" />
    </div>
  );
}
