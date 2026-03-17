module.exports = {
  extends: ["next/core-web-vitals"],
  plugins: ["import"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        packageDir: [__dirname],
        devDependencies: [
          "**/*.test.*",
          "**/*.spec.*",
          "**/test/**",
          "**/__tests__/**"
        ]
      }
    ]
  }
};
