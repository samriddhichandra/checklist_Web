"use client";

import dynamic from "next/dynamic";

const ChecklistApp = dynamic(() => import("../components/ChecklistApp"), { ssr: false });

export default function FormClient() {
  return <ChecklistApp />;
}

