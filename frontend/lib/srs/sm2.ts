export type Sm2State = {
  interval: number;
  repetitions: number;
  easinessFactor: number;
};

export function calculateNextReview(
  state: Sm2State,
  quality: number,
): Sm2State {
  if (quality < 3) {
    return {
      interval: 1,
      repetitions: 0,
      easinessFactor: state.easinessFactor,
    };
  }

  const repetitions = state.repetitions + 1;
  const interval =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.interval * state.easinessFactor);
  const easinessFactor = Math.max(
    1.3,
    state.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    interval,
    repetitions,
    easinessFactor,
  };
}
