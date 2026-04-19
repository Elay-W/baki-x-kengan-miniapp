"use client";

import { useEffect } from "react";
import { playClickSfx } from "@/lib/sfx";

function isClickableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const clickable = target.closest(
    'button, a, [role="button"], [data-click-sound="true"]'
  );

  if (!clickable) return false;

  if (clickable instanceof HTMLButtonElement && clickable.disabled) {
    return false;
  }

  if (
    clickable.getAttribute("aria-disabled") === "true" ||
    clickable.getAttribute("data-click-sound") === "false"
  ) {
    return false;
  }

  return true;
}

export default function GlobalClickSound() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isClickableElement(event.target)) return;
      console.log("click sound trigger");
      playClickSfx();
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}