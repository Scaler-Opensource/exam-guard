module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb/hooks',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false, // Disable the need for a Babel config file
    babelOptions: {
      presets: ['@babel/preset-react'], // Add relevant presets
    },
  },
  ignorePatterns: ['dist/'],
  rules: {
    // Define or override rules here
    'no-console': 'off', // Example: Allow console statements
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': 'off',
    'react/prop-types': 'off', // Disables prop-types validation
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-restricted-exports': 'off',
  },
  parser: '@babel/eslint-parser',
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
    node: {
      extensions: ['.js', '.jsx'],
    },
  },
};
