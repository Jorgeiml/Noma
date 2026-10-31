module.exports = {
  ...require("./jest.config.cjs"),
  testMatch: ["<rootDir>/test/**/*.integration.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  testTimeout: 30000,
};
