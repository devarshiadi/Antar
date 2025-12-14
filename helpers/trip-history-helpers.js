function formatTripDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function normalizeTripFromApi(raw, index) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `trip-${index}`,
      date: '',
      time: '',
      from: 'Pickup',
      to: 'Drop',
      fare: 0,
      type: 'trip',
      partner: 'Ride partner',
    };
  }
  const idValue =
    raw.id !== undefined && raw.id !== null
      ? raw.id
      : raw.trip_id !== undefined && raw.trip_id !== null
      ? raw.trip_id
      : raw._id !== undefined && raw._id !== null
      ? raw._id
      : `trip-${index}`;
  const id = String(idValue);
  const fromRaw =
    raw.from ||
    raw.from_location ||
    raw.pickup ||
    raw.pickup_location ||
    raw.source ||
    raw.source_address ||
    raw.start ||
    '';
  const toRaw =
    raw.to ||
    raw.to_location ||
    raw.drop ||
    raw.drop_location ||
    raw.destination ||
    raw.destination_address ||
    raw.end ||
    '';
  const fareRaw =
    raw.fare !== undefined && raw.fare !== null
      ? raw.fare
      : raw.price !== undefined && raw.price !== null
      ? raw.price
      : raw.amount !== undefined && raw.amount !== null
      ? raw.amount
      : raw.total_fare !== undefined && raw.total_fare !== null
      ? raw.total_fare
      : 0;
  const parsedFare = typeof fareRaw === 'number' ? fareRaw : parseFloat(String(fareRaw || '0'));
  const typeValue = String(raw.type || raw.role || '').toLowerCase();
  let normalizedType = 'trip';
  if (typeValue === 'driver' || typeValue === 'rider') {
    normalizedType = 'rider';
  } else if (typeValue === 'passenger') {
    normalizedType = 'passenger';
  }
  const createdRaw = raw.date || raw.created_at || raw.started_at || raw.completed_at || raw.updated_at || '';
  const timeValue = raw.time || '';
  const partnerRaw =
    raw.partner ||
    raw.counterparty_name ||
    raw.other_user_name ||
    raw.driver_name ||
    raw.passenger_name ||
    raw.contact_name ||
    '';
  return {
    id,
    date: createdRaw ? formatTripDate(createdRaw) : '',
    time: timeValue,
    from: fromRaw || 'Pickup',
    to: toRaw || 'Drop',
    fare: Number.isNaN(parsedFare) ? 0 : parsedFare,
    type: normalizedType,
    partner: partnerRaw || 'Ride partner',
  };
}

export function extractTripList(raw) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (Array.isArray(raw.results)) {
    return raw.results;
  }
  if (Array.isArray(raw.trips)) {
    return raw.trips;
  }
  if (Array.isArray(raw.items)) {
    return raw.items;
  }
  return [];
}

export function computeTripHistoryStats(trips) {
  if (!Array.isArray(trips) || trips.length === 0) {
    return {
      totalTrips: 0,
      asRider: 0,
      asPassenger: 0,
      totalSaved: 0,
    };
  }
  let asRider = 0;
  let asPassenger = 0;
  let totalFare = 0;
  trips.forEach((trip) => {
    const typeValue = String(trip.type || '').toLowerCase();
    if (typeValue === 'rider' || typeValue === 'driver') {
      asRider += 1;
    } else if (typeValue === 'passenger') {
      asPassenger += 1;
    }
    const fareValue =
      typeof trip.fare === 'number' ? trip.fare : parseFloat(String(trip.fare !== undefined ? trip.fare : '0'));
    if (!Number.isNaN(fareValue) && fareValue > 0) {
      totalFare += fareValue;
    }
  });
  return {
    totalTrips: trips.length,
    asRider,
    asPassenger,
    totalSaved: Math.round(totalFare),
  };
}
