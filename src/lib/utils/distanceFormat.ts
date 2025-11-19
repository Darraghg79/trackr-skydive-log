/**
 * Utility functions for formatting and calculating freefall distances
 * Displays as Miles:Feet (Imperial) or Km:m (Metric)
 */

import { UnitPreference } from '@prisma/client'

/**
 * Calculate freefall distance based on altitude and deployment altitude
 * Average freefall speed is approximately 120 mph (193 km/h) or 176 ft/s (53.6 m/s)
 *
 * @param exitAltitude - Exit altitude in feet (imperial) or meters (metric)
 * @param deploymentAltitude - Deployment altitude in feet (imperial) or meters (metric)
 * @param freefallTimeSeconds - Freefall time in seconds
 * @param units - Unit preference (IMPERIAL or METRIC)
 * @returns Formatted distance string
 */
export function calculateFreefallDistance(
  exitAltitude: number | null | undefined,
  deploymentAltitude: number | null | undefined,
  freefallTimeSeconds: number | null | undefined,
  units: UnitPreference
): string {
  // If we don't have the necessary data, return default
  if (
    !exitAltitude ||
    !deploymentAltitude ||
    !freefallTimeSeconds ||
    freefallTimeSeconds === 0
  ) {
    return units === 'IMPERIAL' ? '0:0' : '0:0'
  }

  // Calculate vertical distance traveled
  const verticalDistance = exitAltitude - deploymentAltitude

  if (units === 'IMPERIAL') {
    // Vertical distance is already in feet
    // Average freefall speed: 176 ft/s
    // For more accurate calculation, we can use the vertical distance directly
    const miles = Math.floor(verticalDistance / 5280)
    const feet = Math.round(verticalDistance % 5280)
    return `${miles}:${feet}`
  } else {
    // METRIC
    // Vertical distance is in meters
    const kilometers = Math.floor(verticalDistance / 1000)
    const meters = Math.round(verticalDistance % 1000)
    return `${kilometers}:${meters}`
  }
}

/**
 * Format distance for display with units
 * @param distanceString - Distance in format "miles:feet" or "km:m"
 * @param units - Unit preference
 * @returns Formatted string with units like "1 mile 234 feet" or "2 km 456 m"
 */
export function formatDistanceWithUnits(distanceString: string, units: UnitPreference): string {
  const parts = distanceString.split(':')

  if (parts.length !== 2) {
    return distanceString
  }

  const [major, minor] = parts

  if (units === 'IMPERIAL') {
    const milesLabel = parseInt(major) === 1 ? 'mile' : 'miles'
    const feetLabel = 'feet'

    if (parseInt(major) === 0) {
      return `${minor} ${feetLabel}`
    }

    return `${major} ${milesLabel} ${minor} ${feetLabel}`
  } else {
    // METRIC
    const kmLabel = 'km'
    const mLabel = 'm'

    if (parseInt(major) === 0) {
      return `${minor} ${mLabel}`
    }

    return `${major} ${kmLabel} ${minor} ${mLabel}`
  }
}

/**
 * Parse altitude difference to compact distance format
 * @param altitudeDifference - Difference in feet or meters
 * @param units - Unit preference
 * @returns Distance string in format "major:minor"
 */
export function altitudeDifferenceToDistance(
  altitudeDifference: number,
  units: UnitPreference
): string {
  if (altitudeDifference <= 0) {
    return '0:0'
  }

  if (units === 'IMPERIAL') {
    const miles = Math.floor(altitudeDifference / 5280)
    const feet = Math.round(altitudeDifference % 5280)
    return `${miles}:${feet}`
  } else {
    const kilometers = Math.floor(altitudeDifference / 1000)
    const meters = Math.round(altitudeDifference % 1000)
    return `${kilometers}:${meters}`
  }
}
