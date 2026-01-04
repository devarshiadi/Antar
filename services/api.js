import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Change this to your backend URL
// - For local development: http://localhost:8000
// - For Android emulator: http://10.0.2.2:8000
// - For HuggingFace: https://your-gateway-space.hf.space
const API_URL = 'https://loginx-gatewayservice.hf.space';
const WS_URL = API_URL.replace('http', 'ws');

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
      // Token expired, clear storage
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
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

  resendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/auth/resend-otp', {
        phone_number: phoneNumber,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
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
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Switch between rider and passenger roles
  switchRole: async (role) => {
    try {
      const response = await api.post('/api/users/switch-role', { role });
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== RIDE SERVICES ====================

export const rideService = {
  createRide: async (rideData) => {
    try {
      const response = await api.post('/api/rides', rideData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyRides: async () => {
    try {
      const response = await api.get('/api/rides/my-rides');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailableRides: async (type = '') => {
    try {
      const response = await api.get('/api/rides', { params: { type } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRide: async (rideId) => {
    try {
      const response = await api.get(`/api/rides/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateRide: async (rideId, updateData) => {
    try {
      const response = await api.put(`/api/rides/${rideId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  cancelRide: async (rideId) => {
    try {
      const response = await api.delete(`/api/rides/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  requestToJoin: async (rideId, seatsNeeded = 1) => {
    try {
      const response = await api.post(`/api/rides/${rideId}/request`, {
        seats_needed: seatsNeeded,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  respondToRequest: async (rideId, requestId, action) => {
    try {
      const response = await api.put(`/api/rides/${rideId}/request/${requestId}`, {
        action, // 'accept' or 'reject'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRequestsForRide: async (rideId) => {
    try {
      const response = await api.get(`/api/rides/${rideId}/requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  completeRide: async (rideId) => {
    try {
      const response = await api.post(`/api/rides/${rideId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== MATCH SERVICES ====================

export const matchService = {
  getMatches: async (rideId) => {
    try {
      const response = await api.get(`/api/matches/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  findMatches: async (rideId) => {
    try {
      const response = await api.get(`/api/matches/find/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== CHAT SERVICES ====================

export const chatService = {
  getThreads: async () => {
    try {
      const response = await api.get('/api/chat/threads');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getThread: async (threadId) => {
    try {
      const response = await api.get(`/api/chat/threads/${threadId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getThreadByRide: async (rideId) => {
    try {
      const response = await api.get(`/api/chat/ride/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMessages: async (threadId, limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/api/chat/threads/${threadId}/messages`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  sendMessage: async (threadId, content, type = 'text') => {
    try {
      const response = await api.post(`/api/chat/threads/${threadId}/messages`, {
        content,
        type,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  markAsRead: async (threadId) => {
    try {
      const response = await api.put(`/api/chat/threads/${threadId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  sendTypingIndicator: async (threadId, isTyping) => {
    try {
      const response = await api.post(`/api/chat/threads/${threadId}/typing`, {
        is_typing: isTyping,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== LOCATION SERVICES ====================

export const locationService = {
  searchLocation: async (query, lat = null, lng = null) => {
    try {
      const params = { q: query };
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      const response = await api.get('/api/geocode/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const response = await api.get('/api/geocode/reverse', {
        params: { lat, lng },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  calculateRoute: async (fromLat, fromLng, toLat, toLng) => {
    try {
      const response = await api.get('/api/route', {
        params: { from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateLocation: async (rideId, lat, lng, heading = 0, speed = 0) => {
    try {
      const response = await api.post('/api/location/update', {
        ride_id: rideId,
        lat,
        lng,
        heading,
        speed,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getLiveLocation: async (rideId) => {
    try {
      const response = await api.get(`/api/location/live/${rideId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// ==================== WEBSOCKET SERVICES ====================

// Create WebSocket connection for real-time ride updates
export function createRidesWebSocket(userId) {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  function connect(onMessage, onError) {
    const wsUrl = `${WS_URL}/ws/rides?userId=${userId}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Rides WebSocket connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Rides WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = () => {
        console.log('Rides WebSocket disconnected');
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
    send,
    disconnect,
  };
}

// Create WebSocket connection for real-time chat
export function createChatWebSocket(userId, threadId = null) {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  function connect(onMessage, onError) {
    let wsUrl = `${WS_URL}/ws/chat?userId=${userId}`;
    if (threadId) {
      wsUrl += `&threadId=${threadId}`;
    }

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Chat WebSocket connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
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

  function sendMessage(content) {
    send({
      type: 'message',
      thread_id: threadId,
      payload: { content },
    });
  }

  function sendTyping(isTyping) {
    send({
      type: 'typing',
      thread_id: threadId,
      payload: { is_typing: isTyping },
    });
  }

  function subscribeToThread(newThreadId) {
    send({
      type: 'subscribe',
      payload: newThreadId,
    });
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  return {
    connect,
    send,
    sendMessage,
    sendTyping,
    subscribeToThread,
    disconnect,
  };
}

// Create WebSocket connection for real-time location
export function createLocationWebSocket(userId, rideId) {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  function connect(onMessage, onError) {
    const wsUrl = `${WS_URL}/ws/location/${rideId}?userId=${userId}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Location WebSocket connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Location WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = () => {
        console.log('Location WebSocket disconnected');
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

  function sendLocation(lat, lng, heading = 0, speed = 0) {
    send({
      type: 'location_update',
      ride_id: rideId,
      payload: { lat, lng, heading, speed },
    });
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  return {
    connect,
    send,
    sendLocation,
    disconnect,
  };
}

// Legacy exports for backwards compatibility
export const tripService = rideService;
export const notificationService = {
  getNotifications: async () => ({ notifications: [], count: 0 }),
  markAsRead: async () => ({ message: 'Marked as read' }),
};

export default api;
