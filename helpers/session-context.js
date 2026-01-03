import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SessionContext = createContext(null);

function buildInitialState() {
  return {
    bootstrapped: false,
    token: null,
    user: null,
  };
}

function sessionReducer(state, action) {
  if (!action || typeof action.type !== 'string') {
    return state;
  }
  if (action.type === 'bootstrap') {
    return {
      bootstrapped: true,
      token: action.token || null,
      user: action.user || null,
    };
  }
  if (action.type === 'set_session') {
    return {
      ...state,
      token: action.token || null,
      user: action.user || null,
    };
  }
  if (action.type === 'clear_session') {
    return {
      ...state,
      token: null,
      user: null,
    };
  }
  return state;
}

async function readStoredSession() {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      token: token || null,
      user: user && typeof user === 'object' ? user : null,
    };
  } catch (error) {
    return {
      token: null,
      user: null,
    };
  }
}

async function persistSession(token, user) {
  try {
    if (token) {
      await AsyncStorage.setItem('access_token', token);
    } else {
      await AsyncStorage.removeItem('access_token');
    }

    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user');
    }
  } catch (error) {}
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, buildInitialState);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const stored = await readStoredSession();
      if (!mounted) {
        return;
      }
      dispatch({ type: 'bootstrap', token: stored.token, user: stored.user });
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => {
    async function setSession(next) {
      const token = next && typeof next.token === 'string' ? next.token : null;
      const user = next && next.user && typeof next.user === 'object' ? next.user : null;
      dispatch({ type: 'set_session', token, user });
      await persistSession(token, user);
    }

    async function clearSession() {
      dispatch({ type: 'clear_session' });
      await persistSession(null, null);
    }

    const isAuthenticated = !!(state.token && state.user);

    return {
      bootstrapped: state.bootstrapped,
      token: state.token,
      user: state.user,
      isAuthenticated,
      setSession,
      clearSession,
    };
  }, [state.bootstrapped, state.token, state.user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    return {
      bootstrapped: false,
      token: null,
      user: null,
      isAuthenticated: false,
      setSession: async function () {},
      clearSession: async function () {},
    };
  }
  return value;
}
