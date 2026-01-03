import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your computer's IP address for testing on real device
// For emulator: use 10.0.2.2 (Android) or localhost (iOS)
const API_URL = 'http://localhost:8000';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.removeItem('access_token');
      // You can add navigation logic here
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ====================

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
      }
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  login: async (phoneNumber, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        phone_number: phoneNumber,
        password: password,
      });
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
      }
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  verifyOTP: async (phoneNumber, otpCode) => {
    try {
      const response = await api.post('/api/auth/verify-otp', {
        phone_number: phoneNumber,
        otp_code: otpCode,
      });
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
  },
};

// ==================== USER SERVICES ====================

export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/api/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/api/users/me', userData);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateLocation: async (locationData) => {
    try {
      const response = await api.post('/api/users/location', locationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== TRIP SERVICES ====================

export const tripService = {
  createTrip: async (tripData) => {
    try {
      const response = await api.post('/api/trips', tripData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyTrips: async () => {
    try {
      const response = await api.get('/api/trips/my-trips');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTrip: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateTrip: async (tripId, updateData) => {
    try {
      const response = await api.put(`/api/trips/${tripId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  cancelTrip: async (tripId) => {
    try {
      const response = await api.delete(`/api/trips/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== MATCH SERVICES ====================

export const matchService = {
  getMatches: async (tripId) => {
    try {
      const response = await api.get(`/api/matches/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  findMatches: async (tripId) => {
    try {
      const response = await api.get(`/api/matches/find/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateMatch: async (matchId, status) => {
    try {
      const response = await api.put(`/api/matches/${matchId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  acceptMatch: async (matchId) => {
    return matchService.updateMatch(matchId, 'accepted');
  },

  rejectMatch: async (matchId) => {
    return matchService.updateMatch(matchId, 'rejected');
  },
};

// ==================== CHAT SERVICES ====================

export const chatService = {
  sendMessage: async (tripId, receiverId, content) => {
    try {
      const response = await api.post(`/api/chat/${tripId}/message`, {
        receiver_id: receiverId,
        content: content,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getChatHistory: async (tripId) => {
    try {
      const response = await api.get(`/api/chat/${tripId}/history`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== NOTIFICATION SERVICES ====================

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== WEBSOCKET SERVICE ====================

export function createLocationWebSocket(userId) {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  function connect(onMessage, onError) {
    const wsUrl = `ws://localhost:8000/ws/location/${userId}`;
    
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        reconnect(onMessage, onError);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  function reconnect(onMessage, onError) {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
        connect(onMessage, onError);
      }, delay);
    }
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  return {
    connect,
    reconnect,
    send,
    disconnect,
  };
}

export default api;
