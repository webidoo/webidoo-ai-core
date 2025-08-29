# Contributing to webidoo-ai-core

Thank you for your interest in contributing to webidoo-ai-core! This document provides guidelines for contributing to this project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/webidoo/webidoo-ai-core.git
   cd webidoo-ai-core
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with required variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   REDIS_URL=redis://localhost:6379
   ```

4. **Build the project**
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

Currently, the project doesn't have tests set up. When contributing:
- Consider adding tests for new features
- Ensure existing functionality isn't broken

## Contribution Guidelines

### Issues

- Search existing issues before creating a new one
- Use clear, descriptive titles
- Provide detailed reproduction steps for bugs
- Include environment information (Node.js version, OS, etc.)

### Pull Requests

1. **Fork the repository** and create a feature branch from `main`
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - List of changes made

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

```
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

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
