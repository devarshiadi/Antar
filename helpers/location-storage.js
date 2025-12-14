import AsyncStorage from '@react-native-async-storage/async-storage';

const GLOBAL_ROUTE_KEY = '@global_route_selection';

function buildLocationPayload(location) {
  if (!location) {
    return null;
  }
  const hasLatitude = typeof location.latitude === 'number';
  const hasLongitude = typeof location.longitude === 'number';
  const address = typeof location.address === 'string' ? location.address : '';
  if (!hasLatitude || !hasLongitude) {
    return null;
  }
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    address,
  };
}

export async function saveGlobalRoute(sourceLocation, destinationLocation) {
  try {
    const payload = {
      source: buildLocationPayload(sourceLocation),
      destination: buildLocationPayload(destinationLocation),
    };
    if (!payload.source && !payload.destination) {
      await AsyncStorage.removeItem(GLOBAL_ROUTE_KEY);
      return;
    }
    await AsyncStorage.setItem(GLOBAL_ROUTE_KEY, JSON.stringify(payload));
  } catch (error) {}
}

export async function loadGlobalRoute() {
  try {
    const stored = await AsyncStorage.getItem(GLOBAL_ROUTE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      source: parsed.source || null,
      destination: parsed.destination || null,
    };
  } catch (error) {
    return null;
  }
}
