# JSON-PACK Development Guide

## Build & Test Commands
- Build: `yarn build`
- Lint: `yarn lint` or `yarn tslint`
- Format: `yarn prettier`
- Check format: `yarn prettier:check`
- Run all tests: `yarn test`
- Run single test: `yarn jest -t "test name pattern"` or `yarn jest path/to/file.spec.ts`
- Run tests with coverage: `yarn coverage`

## Code Style
- **Formatting**: Uses Prettier with 120 char width, 2-space indent, single quotes
- **Naming**: PascalCase for classes/interfaces/types, camelCase for methods/variables, UPPER_SNAKE for constants
- **Imports**: Group by external then internal, use destructuring when appropriate
- **TypeScript**: Enable strict mode, use interfaces for API contracts, types for aliases
- **Error handling**: Use explicit `throw new Error()` with descriptive messages
- **Documentation**: JSDoc comments for public API methods with @param annotations

## Project Structure
- Format-specific code in dedicated directories (json/, cbor/, msgpack/, etc.)
- Tests in `__tests__` subdirectories alongside implementation
- Benchmarks in `__bench__` directory
- Common types in `types.ts` files

Following these guidelines ensures consistency across the codebase and maintains the project's focus on performance and type safety.