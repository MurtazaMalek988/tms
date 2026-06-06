const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function isWithinGeofence(userLat, userLon, schoolLat, schoolLon, radiusMeters) {
  return haversineDistance(userLat, userLon, schoolLat, schoolLon) <= radiusMeters;
}

function isGeofenceEnabled(settings) {
  const lat = parseFloat(settings.school_latitude);
  const lon = parseFloat(settings.school_longitude);
  return !(lat === 0 && lon === 0);
}

function checkGeofence(latitude, longitude, settings) {
  const schoolLat = parseFloat(settings.school_latitude);
  const schoolLon = parseFloat(settings.school_longitude);
  const radius = parseInt(settings.allowed_radius, 10) || 100;

  if (!isGeofenceEnabled(settings)) {
    return { valid: true, enabled: false, distance: null, allowed_radius: radius };
  }

  const distance = haversineDistance(
    parseFloat(latitude),
    parseFloat(longitude),
    schoolLat,
    schoolLon
  );
  const within = distance <= radius;

  return {
    valid: within,
    enabled: true,
    distance: Math.round(distance),
    allowed_radius: radius,
    school_latitude: schoolLat,
    school_longitude: schoolLon,
  };
}

module.exports = { isWithinGeofence, haversineDistance, isGeofenceEnabled, checkGeofence };
