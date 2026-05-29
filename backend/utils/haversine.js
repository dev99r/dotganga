const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculates the great-circle distance between two GPS coordinates (Haversine formula).
 * Returns distance in meters.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Returns true if the given coordinates are within the allowed radius of the office.
 */
function isWithinGeofence(userLat, userLng, officeLat, officeLng, allowedRadiusMeter) {
  const distance = haversineDistance(userLat, userLng, officeLat, officeLng);
  return { withinBoundary: distance <= allowedRadiusMeter, distanceMeters: Math.round(distance) };
}

module.exports = { haversineDistance, isWithinGeofence };
