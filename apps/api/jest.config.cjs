module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/test/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  clearMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "\\.integration\\.spec\\.ts$"],
};
