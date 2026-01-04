package matchmaking

import (
	"math"
	"time"
)

const (
	// Matching algorithm weights
	RouteOverlapWeight = 0.50
	TimeMatchWeight    = 0.25
	RatingBonusWeight  = 0.25

	// Thresholds
	MinMatchScore      = 70.0  // Minimum score for a valid match
	MaxPickupDistance  = 2.0   // km - max distance for pickup point matching
	MaxDropDistance    = 3.0   // km - max distance for drop point matching
	MaxTimeDifference  = 60.0  // minutes - max time difference allowed
	PerfectTimeWindow  = 15.0  // minutes - perfect match time window
)

// MatchingAlgorithm calculates match scores between rides
type MatchingAlgorithm struct{}

// NewMatchingAlgorithm creates a new matching algorithm instance
func NewMatchingAlgorithm() *MatchingAlgorithm {
	return &MatchingAlgorithm{}
}

// CalculateMatchScore calculates the compatibility score between an offer and request
func (m *MatchingAlgorithm) CalculateMatchScore(offer, request *Ride) float64 {
	// Skip if same user
	if offer.UserID == request.UserID {
		return 0
	}

	// Calculate individual components
	routeScore := m.calculateRouteOverlap(offer, request)
	timeScore := m.calculateTimeMatch(offer, request)
	ratingScore := m.calculateRatingBonus(offer, request)

	// Weighted sum
	totalScore := (routeScore * RouteOverlapWeight * 100) +
		(timeScore * TimeMatchWeight * 100) +
		(ratingScore * RatingBonusWeight * 100)

	return math.Min(totalScore, 100)
}

// calculateRouteOverlap calculates how well the routes overlap
func (m *MatchingAlgorithm) calculateRouteOverlap(offer, request *Ride) float64 {
	// Calculate pickup point distance
	pickupDistance := haversine(
		offer.FromLat, offer.FromLng,
		request.FromLat, request.FromLng,
	)

	// Calculate drop point distance
	dropDistance := haversine(
		offer.ToLat, offer.ToLng,
		request.ToLat, request.ToLng,
	)

	// If either distance exceeds threshold, no match
	if pickupDistance > MaxPickupDistance || dropDistance > MaxDropDistance {
		return 0
	}

	// Calculate overlap score (closer = higher score)
	pickupScore := 1.0 - (pickupDistance / MaxPickupDistance)
	dropScore := 1.0 - (dropDistance / MaxDropDistance)

	// Weight pickup more than drop (60-40 split)
	return (pickupScore * 0.6) + (dropScore * 0.4)
}

// calculateTimeMatch calculates how well the departure times match
func (m *MatchingAlgorithm) calculateTimeMatch(offer, request *Ride) float64 {
	timeDiff := math.Abs(offer.DepartureTime.Sub(request.DepartureTime).Minutes())

	// Perfect match within 15 minutes
	if timeDiff <= PerfectTimeWindow {
		return 1.0
	}

	// No match if more than 60 minutes apart
	if timeDiff > MaxTimeDifference {
		return 0
	}

	// Linear decrease from 15 to 60 minutes
	return 1.0 - ((timeDiff - PerfectTimeWindow) / (MaxTimeDifference - PerfectTimeWindow))
}

// calculateRatingBonus calculates bonus based on user ratings
func (m *MatchingAlgorithm) calculateRatingBonus(offer, request *Ride) float64 {
	avgRating := (offer.UserRating + request.UserRating) / 2.0
	// Normalize to 0-1 (assuming 5-star system)
	return avgRating / 5.0
}

// FindMatchesForRide finds all compatible rides for a given ride
func (m *MatchingAlgorithm) FindMatchesForRide(targetRide *Ride, allRides []*Ride) []*Match {
	var matches []*Match

	for _, ride := range allRides {
		// Skip same user or same ride
		if ride.UserID == targetRide.UserID || ride.ID == targetRide.ID {
			continue
		}

		// Skip if not compatible types (offer needs request, request needs offer)
		if targetRide.Type == ride.Type {
			continue
		}

		// Skip unavailable rides
		if ride.Status != "available" {
			continue
		}

		// Check seat availability
		if targetRide.Type == "request" && ride.AvailSeats < 1 {
			continue
		}

		score := m.CalculateMatchScore(targetRide, ride)
		if score >= MinMatchScore {
			var offerID, requestID string
			if targetRide.Type == "offer" {
				offerID = targetRide.ID
				requestID = ride.ID
			} else {
				offerID = ride.ID
				requestID = targetRide.ID
			}

			match := &Match{
				OfferRideID:   offerID,
				RequestRideID: requestID,
				Score:         score,
				RouteOverlap:  m.calculateRouteOverlap(targetRide, ride) * 100,
				TimeDiff:      math.Abs(targetRide.DepartureTime.Sub(ride.DepartureTime).Minutes()),
				Status:        "suggested",
				CreatedAt:     time.Now(),
			}
			matches = append(matches, match)
		}
	}

	// Sort by score (highest first)
	sortMatchesByScore(matches)

	return matches
}

// haversine calculates the distance between two points on Earth in kilometers
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0 // km

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// sortMatchesByScore sorts matches by score in descending order
func sortMatchesByScore(matches []*Match) {
	for i := 0; i < len(matches)-1; i++ {
		for j := i + 1; j < len(matches); j++ {
			if matches[j].Score > matches[i].Score {
				matches[i], matches[j] = matches[j], matches[i]
			}
		}
	}
}
