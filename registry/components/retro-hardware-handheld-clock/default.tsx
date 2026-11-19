import React from "react";
import Component from "../components/ui/component";

const settings = {
  presetIndex: 0,
  status: 'IDLE' as const
};

export default function Demo(props: Partial<typeof settings>) {
  return (
    <div className="flex min-h-[350px] w-full items-center justify-center p-4">
      <Component {...props} />
    </div>
  );
}