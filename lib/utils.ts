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

/**
 * Formats bytes into a human-readable string (KB, MB, GB).
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to include.
 * @returns A formatted string e.g., "1.23 MB".
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || bytes < 0) return '';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}