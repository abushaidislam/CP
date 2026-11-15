import React, { useState } from "react";
import { AnimatedHandshakeIcon } from "./AnimatedHandshakeIcon";

export default function PartnerButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition"
    >
      <AnimatedHandshakeIcon size={24} isHovered={hovered} />
      <span>Partner With Us</span>
    </button>
  );
}