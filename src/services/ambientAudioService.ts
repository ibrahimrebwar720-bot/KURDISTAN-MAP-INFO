/**
 * Ambient Audio Synthesizer - Disabled per user request
 * All operations are silent and instant with zero Web Audio allocations.
 */

class AmbientAudioEngine {
  public startAtmosphere(): void {
    // Disabled
  }

  public playStationTransitionChime(): void {
    // Disabled
  }

  public stopAtmosphere(): void {
    // Disabled
  }

  public toggleMute(): boolean {
    return true;
  }

  public getIsMuted(): boolean {
    return true;
  }
}

export const ambientAudio = new AmbientAudioEngine();
