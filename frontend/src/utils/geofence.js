const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function getPremisesStatus(location, geofence) {
  if (!geofence?.enabled) {
    return { withinPremises: true, distance: null, enabled: false };
  }
  if (!location) {
    return { withinPremises: false, distance: null, enabled: true, waitingForLocation: true };
  }

  const distance = haversineDistance(
    location.latitude,
    location.longitude,
    geofence.school_latitude,
    geofence.school_longitude
  );

  return {
    withinPremises: distance <= geofence.allowed_radius,
    distance: Math.round(distance),
    enabled: true,
    allowedRadius: geofence.allowed_radius,
  };
}
