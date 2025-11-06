---
trigger: always_on
---

Develop a mobile application using React Native with Expo under strict architectural and coding discipline:

Apply functional and declarative programming paradigms.

Avoid classes entirely; use pure functions and functional components.

Enforce modularization: group code logically by feature, not file type.

Structure directories in lowercase-with-dashes; use named exports.

Split architecture: /components, /subcomponents, /helpers, /static.

Prefer iteration and composition over duplication.

Write concise, deterministic code with descriptive variable and function names using auxiliary verbs.

Always use strict equality and avoid implicit type coercion.

Enable React Strict Mode.

Use function keyword for pure functions; arrow functions only for inline callbacks.

Omit unnecessary curly braces and verbose return blocks.

Format automatically using Prettier.

Write declarative, self-explanatory JSX—avoid nested anonymous functions inside render.

Build all layout using Expo’s built-in components; use Flexbox for alignment and responsiveness.

Handle responsive scaling with useWindowDimensions.

Use styled-components or tailwindcss-react-native for styling.

Integrate useColorScheme from Expo for dark/light mode support.

Ensure accessibility using accessibilityRole, accessibilityLabel, and accessible props.

Implement thumb-friendly UI: place core interactive elements within reachable bottom zones; restrict navigation depth to ≤3 levels.

Group related user flows into single-screen clusters; prefer modals, sheets, and tabs over multi-screen routing.

Keep interactions atomic—one task per motion gesture or tap.

Use react-native-reanimated and react-native-gesture-handler for smooth, non-blocking animations and gestures.

Follow data-driven UI logic: use hooks and controlled states; avoid mutable references.

Store reusable logic in helpers as pure utility functions.

Keep state minimal and local; prefer useReducer for predictable state transitions.

Validate input deterministically; handle edge cases explicitly.

Maintain one-screen-one-feature rule; prevent cross-screen dependencies.

Optimize render cycles by memoizing heavy components.

Write all code in plain JavaScript; no TypeScript or runtime type coercion.

Maintain accessibility and performance parity across iOS and Android.

Do not generate documentation or comments within the code.