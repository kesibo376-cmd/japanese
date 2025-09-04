/**
 * Formats a given time in seconds into a MM:SS string.
 * @param time The time in seconds.
 * @returns A formatted string e.g., "5:23".
 */
export const formatTime = (time: number): string => {
  if (isNaN(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
