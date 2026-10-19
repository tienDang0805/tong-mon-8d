export class AuthoritativeClock {
  private simulatedClockOffsetMs = 0;

  now(): number {
    return Date.now() + this.simulatedClockOffsetMs;
  }

  advanceSimulatedClockMs(deltaMs: number): void {
    this.simulatedClockOffsetMs += deltaMs;
  }
}
