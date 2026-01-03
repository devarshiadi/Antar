jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => {
  return require('@react-native-async-storage/async-storage/jest/async-storage-mock');
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  function SafeAreaView(props) {
    return React.createElement(View, props);
  }
  return {
    SafeAreaView,
    SafeAreaProvider: SafeAreaView,
    useSafeAreaInsets: function () {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    },
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  function Icon(props) {
    return React.createElement(Text, props);
  }
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});
