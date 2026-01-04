package location

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"
)

// Geocoder handles geocoding operations using Nominatim (OpenStreetMap)
type Geocoder struct {
	nominatimURL string
	osrmURL      string
	httpClient   *http.Client
	rateLimiter  *RateLimiter
}

// RateLimiter implements a simple rate limiter
type RateLimiter struct {
	lastRequest time.Time
	minInterval time.Duration
	mutex       sync.Mutex
}

// NewGeocoder creates a new geocoder
func NewGeocoder(nominatimURL, osrmURL string) *Geocoder {
	if nominatimURL == "" {
		nominatimURL = "https://nominatim.openstreetmap.org"
	}
	if osrmURL == "" {
		osrmURL = "https://router.project-osrm.org"
	}

	return &Geocoder{
		nominatimURL: nominatimURL,
		osrmURL:      osrmURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		rateLimiter: &RateLimiter{
			minInterval: time.Second, // Nominatim requires max 1 req/sec
		},
	}
}

// Wait implements rate limiting
func (r *RateLimiter) Wait() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	elapsed := time.Since(r.lastRequest)
	if elapsed < r.minInterval {
		time.Sleep(r.minInterval - elapsed)
	}
	r.lastRequest = time.Now()
}

// Search searches for locations by query
func (g *Geocoder) Search(query string, lat, lng float64, limit int) ([]*SearchResult, error) {
	g.rateLimiter.Wait()

	if limit <= 0 || limit > 10 {
		limit = 5
	}

	// Build URL
	params := url.Values{}
	params.Set("q", query)
	params.Set("format", "json")
	params.Set("limit", strconv.Itoa(limit))
	params.Set("addressdetails", "1")

	// Add viewbox if coordinates provided (search nearby)
	if lat != 0 && lng != 0 {
		// Create a bounding box around the point (roughly 50km)
		delta := 0.5 // ~50km
		params.Set("viewbox", fmt.Sprintf("%f,%f,%f,%f", 
			lng-delta, lat-delta, lng+delta, lat+delta))
		params.Set("bounded", "0")
	}

	reqURL := fmt.Sprintf("%s/search?%s", g.nominatimURL, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	// User-Agent is required by Nominatim
	req.Header.Set("User-Agent", "Antar-RideSharing-App/1.0 (https://github.com/antar)")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse response
	var nominatimResults []struct {
		PlaceID     int     `json:"place_id"`
		Lat         string  `json:"lat"`
		Lon         string  `json:"lon"`
		DisplayName string  `json:"display_name"`
		Type        string  `json:"type"`
		Importance  float64 `json:"importance"`
	}

	if err := json.Unmarshal(body, &nominatimResults); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to our format
	var results []*SearchResult
	for _, r := range nominatimResults {
		lat, _ := strconv.ParseFloat(r.Lat, 64)
		lng, _ := strconv.ParseFloat(r.Lon, 64)

		results = append(results, &SearchResult{
			PlaceID:     strconv.Itoa(r.PlaceID),
			DisplayName: r.DisplayName,
			Lat:         lat,
			Lng:         lng,
			Type:        r.Type,
			Importance:  r.Importance,
		})
	}

	return results, nil
}

// ReverseGeocode converts coordinates to address
func (g *Geocoder) ReverseGeocode(lat, lng float64) (*Location, error) {
	g.rateLimiter.Wait()

	params := url.Values{}
	params.Set("lat", strconv.FormatFloat(lat, 'f', 6, 64))
	params.Set("lon", strconv.FormatFloat(lng, 'f', 6, 64))
	params.Set("format", "json")
	params.Set("addressdetails", "1")

	reqURL := fmt.Sprintf("%s/reverse?%s", g.nominatimURL, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Antar-RideSharing-App/1.0 (https://github.com/antar)")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reverse geocode: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		DisplayName string `json:"display_name"`
		Address     struct {
			Road        string `json:"road"`
			Suburb      string `json:"suburb"`
			City        string `json:"city"`
			Town        string `json:"town"`
			Village     string `json:"village"`
			State       string `json:"state"`
			Country     string `json:"country"`
			PostCode    string `json:"postcode"`
		} `json:"address"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Get city (could be city, town, or village)
	city := result.Address.City
	if city == "" {
		city = result.Address.Town
	}
	if city == "" {
		city = result.Address.Village
	}

	return &Location{
		Lat:         lat,
		Lng:         lng,
		Address:     result.Address.Road,
		DisplayName: result.DisplayName,
		City:        city,
		State:       result.Address.State,
		Country:     result.Address.Country,
		PostalCode:  result.Address.PostCode,
	}, nil
}

// CalculateRoute calculates route between two points using OSRM
func (g *Geocoder) CalculateRoute(fromLat, fromLng, toLat, toLng float64) (*Route, error) {
	// OSRM uses lng,lat format
	reqURL := fmt.Sprintf("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
		g.osrmURL, fromLng, fromLat, toLng, toLat)

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate route: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Code   string `json:"code"`
		Routes []struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`
			Geometry struct {
				Type        string      `json:"type"`
				Coordinates [][]float64 `json:"coordinates"`
			} `json:"geometry"`
		} `json:"routes"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Code != "Ok" || len(result.Routes) == 0 {
		return nil, fmt.Errorf("no route found")
	}

	route := result.Routes[0]
	return &Route{
		Distance: route.Distance,
		Duration: route.Duration,
		StartPoint: Location{
			Lat: fromLat,
			Lng: fromLng,
		},
		EndPoint: Location{
			Lat: toLat,
			Lng: toLng,
		},
		Geometry: &RouteGeometry{
			Type:        route.Geometry.Type,
			Coordinates: route.Geometry.Coordinates,
		},
	}, nil
}
