import AsyncStorage from '@react-native-async-storage/async-storage';

export const RIDES_STORAGE_KEY = '@rides_offered';
const RIDE_REQUESTS_KEY = '@ride_requests';

function parseStoredList(value) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveStoredRides(rides) {
  try {
    await AsyncStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(rides));
  } catch (error) {
    console.error('Failed to save rides:', error);
  }
}

async function saveRideRequests(requests) {
  try {
    await AsyncStorage.setItem(RIDE_REQUESTS_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to save ride requests:', error);
  }
}

export async function getStoredRides() {
  try {
    const stored = await AsyncStorage.getItem(RIDES_STORAGE_KEY);
    return parseStoredList(stored);
  } catch (error) {
    console.error('Failed to read rides:', error);
    return [];
  }
}

export async function addRide(ride) {
  const rides = await getStoredRides();
  const updated = [ride, ...rides];
  await saveStoredRides(updated);
  return ride;
}

export async function getRideById(rideId) {
  const rides = await getStoredRides();
  return rides.find((ride) => ride.id === rideId) || null;
}

export async function updateRide(rideId, updates) {
  const rides = await getStoredRides();
  const updated = rides.map((ride) =>
    ride.id === rideId
      ? {
          ...ride,
          ...updates,
        }
      : ride,
  );
  await saveStoredRides(updated);
  return updated.find((ride) => ride.id === rideId) || null;
}

export async function updateRideStatus(rideId, status) {
  return updateRide(rideId, { status });
}

export async function getRideRequests() {
  try {
    const stored = await AsyncStorage.getItem(RIDE_REQUESTS_KEY);
    return parseStoredList(stored);
  } catch (error) {
    console.error('Failed to read ride requests:', error);
    return [];
  }
}

export async function getRideRequestsByRide(rideId) {
  const requests = await getRideRequests();
  return requests.filter((request) => request.rideId === rideId);
}

export async function getRideRequestById(requestId) {
  const requests = await getRideRequests();
  return requests.find((request) => request.id === requestId) || null;
}

export async function addRideRequest(request) {
  const requests = await getRideRequests();
  const next = {
    id: request.id ?? String(Date.now()),
    status: request.status ?? 'pending',
    createdAt: Date.now(),
    ...request,
  };
  const updated = [next, ...requests];
  await saveRideRequests(updated);
  return next;
}

export async function updateRideRequest(requestId, updates) {
  const requests = await getRideRequests();
  const updated = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          ...updates,
        }
      : request,
  );
  await saveRideRequests(updated);
  return updated.find((request) => request.id === requestId) || null;
}
