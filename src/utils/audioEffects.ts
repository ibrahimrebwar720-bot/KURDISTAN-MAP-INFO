// Audio effects permanently disabled per user request
// All sound functions are clean, zero-overhead no-ops for instantaneous execution

export function setAudioMuted(_muted: boolean): void {
  // Permanently muted
}

export function getAudioMuted(): boolean {
  return true;
}

export function playTimelineTick(_freq?: number): void {
  // Silent
}

export function playEraTransitionChime(_isAncient?: boolean): void {
  // Silent
}

export function playSoftClick(): void {
  // Silent
}

export function playMarkerPopSound(): void {
  // Silent
}
