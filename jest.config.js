/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          ignoreDeprecations: '6.0',
          types: ['jest'],
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
    ],
  },
};
