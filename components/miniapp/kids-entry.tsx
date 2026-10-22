"use client";
import { Baby } from "lucide-react";
export function MenorahKidsEntry({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="miniapp-kids-entry" data-kids-entry onClick={onOpen}>
    <span className="miniapp-icon"><Baby aria-hidden="true" size={27} /></span>
    <span><strong>Menorah Kids</strong><b>Детские программы</b><span>Занятия, творчество, традиции и развитие для детей общины</span><em>Открыть Menorah Kids →</em></span>
  </button>;
}
