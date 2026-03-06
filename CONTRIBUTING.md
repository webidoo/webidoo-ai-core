# Contributing to webidoo-ai-core

Thank you for your interest in contributing to webidoo-ai-core! This document provides guidelines for contributing to this project.

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/webidoo-ai-core.git
   cd webidoo-ai-core
   ```

3. **Add the upstream remote** so you can keep your fork in sync

   ```bash
   git remote add upstream https://github.com/webidoo/webidoo-ai-core.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment variables**
   Create a `.env` file with required variables:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   REDIS_URL=redis://localhost:6379
   ```

6. **Build the project**

   ```bash
   npm run build
   ```

## Development Workflow

### Code Style

This project uses Biome for code formatting and linting. Run the following commands:

```bash
# Format code
npx biome format --write .

# Lint code
npx biome lint .
```

### TypeScript

- All code must be written in TypeScript
- Ensure type safety - avoid `any` types when possible
- Run type checking with: `npm run type-check`

### Testing

This project uses Vitest for testing with both unit and integration tests.

#### Unit Tests

Unit tests use mocked dependencies and run quickly without external services:

```bash
# Run unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit -- --watch
```

#### Integration Tests

Integration tests require a running Redis Stack instance and test real interactions:

```bash
# Start Redis Stack (required for integration tests)
docker compose -f src/docker-compose.yml up -d

# Run integration tests
npm run test:integration

# Stop Redis when done
docker compose -f src/docker-compose.yml down
```

#### Run All Tests

To run both unit and integration tests sequentially:

```bash
npm run test
```

This runs unit tests first, then integration tests (requires Redis to be running).

#### Testing Guidelines

- **Unit tests**: Test business logic, parameter validation, and error handling with mocked dependencies
- **Integration tests**: Test end-to-end workflows and real Redis interactions
- **Both test types**: Ensure comprehensive coverage of new features
- **Run both**: Always run both test suites before submitting pull requests

## Contribution Guidelines

### Issues

- Search existing issues before creating a new one
- Use clear, descriptive titles
- Provide detailed reproduction steps for bugs
- Include environment information (Node.js version, OS, etc.)

### Pull Requests

1. **Create a feature branch** from `main` on your fork

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Keep your fork in sync** before starting work

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Make your changes** following the code style guidelines
4. **Test your changes** thoroughly
5. **Update documentation** if needed
6. **Push to your fork** and open a pull request against `webidoo/webidoo-ai-core`'s `main` branch
7. In your pull request, include:
   - A clear title and description
   - Reference to related issues
   - A list of changes made

### Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example: `feat: add vector similarity search with filtering`

## Code Architecture

### Project Structure

```bash
src/
├── ai/
│   ├── InferenceModel.ts    # OpenAI wrapper with tool support
│   ├── Message.ts           # Message type definitions
│   └── vector.db.ts         # Redis vector store implementation
├── config/
│   ├── config-service.ts    # Configuration management
│   ├── defaults.ts          # Default configuration values
│   └── index.ts             # Config exports
└── index.ts                 # Main entry point
```

### Key Components

- **ConfigService**: Centralized configuration management
- **InferenceModel**: OpenAI API wrapper with streaming and tool support
- **VectorStore**: Redis-based vector database for RAG applications

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md (if exists)
3. Create a pull request
4. After merge, create a git tag
5. Publish to npm: `npm publish`

## Getting Help

- Check existing documentation in README.md
- Search through existing issues
- Create a new issue for questions or problems

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read and follow it in all interactions.

## License

By contributing to this project, you agree that your contributions will be licensed under the Apache 2.0 License.
