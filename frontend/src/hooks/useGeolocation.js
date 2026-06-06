import { useState, useCallback } from 'react';

function readPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function formatLocationError(err) {
  let msg = 'Unable to get your location. ';
  if (err.code === 1) {
    msg += 'Permission denied. Allow location access in your browser settings, then retry.';
  } else if (err.code === 2) {
    msg += 'Position unavailable. Move closer to a window or try again in a moment.';
  } else if (err.code === 3) {
    msg += 'Request timed out. On desktop, Wi‑Fi location can be slow — click Retry, or enable location for this site in browser settings.';
  } else {
    msg += 'Please enable location access for this site.';
  }
  return msg;
}

const LOCATION_ATTEMPTS = [
  { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 },
  { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
];

export default function useGeolocation() {
  const [loc, setLoc] = useState(null);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser.';
      setLocError(msg);
      throw new Error(msg);
    }

    setLocLoading(true);
    setLocError(null);

    let lastError = null;

    for (const options of LOCATION_ATTEMPTS) {
      try {
        const pos = await readPosition(options);
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLoc(coords);
        setLocError(null);
        setLocLoading(false);
        return coords;
      } catch (err) {
        lastError = err;
        if (err.code === 1) break;
      }
    }

    const msg = formatLocationError(lastError || { code: 3 });
    setLocError(msg);
    setLocLoading(false);
    throw new Error(msg);
  }, []);

  const useTestLocation = useCallback(() => {
    const testCoords = { latitude: 0, longitude: 0 };
    setLoc(testCoords);
    setLocError(null);
    return testCoords;
  }, []);

  return { loc, locError, locLoading, getLocation, useTestLocation };
}
