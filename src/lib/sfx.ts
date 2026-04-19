"use client";

let clickAudio: HTMLAudioElement | null = null;

function getClickAudio() {
  if (typeof window === "undefined") return null;

  if (!clickAudio) {
    clickAudio = new Audio("/sfx/click.mp3");
    clickAudio.preload = "auto";
    clickAudio.volume = 0.7;
  }

  return clickAudio;
}

export function playClickSfx() {
  try {
    const audio = getClickAudio();
    if (!audio) return;

    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.error("click sound play error:", err);
      });
    }
  } catch (err) {
    console.error("click sound setup error:", err);
  }
}