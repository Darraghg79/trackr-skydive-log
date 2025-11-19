/**
 * Utility functions for formatting and parsing freefall time
 * Database stores time in seconds, but UI shows HH:MM:SS format
 */

/**
 * Convert seconds to HH:MM:SS format
 * @param totalSeconds - Total seconds
 * @returns Formatted string "HH:MM:SS"
 */
export function secondsToHHMMSS(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === 0) {
    return '00:00:00'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map(val => val.toString().padStart(2, '0'))
    .join(':')
}

/**
 * Parse HH:MM:SS format to total seconds
 * @param timeString - Time in format "HH:MM:SS", "MM:SS", or just "SS"
 * @returns Total seconds
 */
export function parseHHMMSSToSeconds(timeString: string): number {
  if (!timeString || timeString.trim() === '') {
    return 0
  }

  const parts = timeString.split(':').map(p => parseInt(p.trim(), 10) || 0)

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts
    return (hours * 3600) + (minutes * 60) + seconds
  } else if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts
    return (minutes * 60) + seconds
  } else if (parts.length === 1) {
    // Just seconds
    return parts[0]
  }

  return 0
}

/**
 * Validate HH:MM:SS format
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidHHMMSS(timeString: string): boolean {
  if (!timeString || timeString.trim() === '') {
    return true // Empty is valid (means 0)
  }

  const hhmmssRegex = /^\d{1,2}:\d{2}:\d{2}$/
  const mmssRegex = /^\d{1,2}:\d{2}$/
  const ssRegex = /^\d+$/

  return hhmmssRegex.test(timeString) || mmssRegex.test(timeString) || ssRegex.test(timeString)
}

/**
 * Format freefall time with hours, minutes, and seconds labels
 * @param totalSeconds - Total seconds
 * @returns Formatted string like "1h 23m 45s"
 */
export function secondsToReadable(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === 0) {
    return '0s'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`)
  }

  return parts.join(' ')
}
