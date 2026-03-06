// Copyright (c) 2026 Igarin
// This software is released under the MIT License.
// https://opensource.org

module.exports = {
  "roots": [
    "<rootDir>/assets/scripts/tests/unit"
  ],
  "testEnvironment": "jsdom",
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
}
