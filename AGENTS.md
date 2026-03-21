# Agent Instructions

This repository contains `parse-jtl`, a Node.js library for parsing JMeter JTL results.

## Project Structure

- `src/index.js`: Main entry point for the library, contains parsing and aggregation logic.
- `src/helpers/csvjson.js`: Custom helper for parsing CSV to JSON without external dependencies.
- `tests/`: Contains Mocha/Chai tests for verifying parsing logic.

## Key Directives

- **No New Dependencies**: Always prefer built-in Node.js modules or custom helpers over adding new npm dependencies.
- **Node.js Compatibility**: Maintain compatibility with Node.js 22.x and newer as specified in GitHub Workflows.
- **Testing**: Ensure all changes are covered by tests in `tests/`. Run tests using `npm test`.

## Development Workflow

### Testing
To run the existing tests:
```bash
npm test
```

### Coverage
To check test coverage:
```bash
npm test # c8 is used to generate coverage reports
```

### Release Process
This project uses `release-please` for automated versioning and changelog generation.
- Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/).
- Releases are automatically created by pushing to the `main` branch.
