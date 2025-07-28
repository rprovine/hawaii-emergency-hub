# Contributing to Hawaii Emergency Network Hub

🌺 Mahalo for your interest in contributing to the Hawaii Emergency Network Hub! This project aims to protect Hawaii's residents and visitors through timely emergency alerts.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions.

### Our Standards

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

1. **Fork the Repository**
   ```bash
   # Fork via GitHub UI, then:
   git clone https://github.com/YOUR_USERNAME/hawaii-emergency-hub.git
   cd hawaii-emergency-hub
   git remote add upstream https://github.com/ORIGINAL_OWNER/hawaii-emergency-hub.git
   ```

2. **Set Up Development Environment**
   - Follow the setup instructions in the [README](README.md#quick-start)
   - Ensure all tests pass before making changes

3. **Find an Issue**
   - Check the [Issues](https://github.com/ORIGINAL_OWNER/hawaii-emergency-hub/issues) page
   - Look for issues labeled `good first issue` or `help wanted`
   - Comment on the issue to let others know you're working on it

## Development Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards for each language
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add tsunami warning integration"

# Bug fixes
git commit -m "fix: correct alert delivery timing"

# Documentation
git commit -m "docs: update API endpoint documentation"

# Performance improvements
git commit -m "perf: optimize WebSocket connection handling"

# Tests
git commit -m "test: add tests for alert filtering"
```

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

## Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass: `./deploy.sh test`
   - Run linters and formatters
   - Update documentation if needed
   - Add entries to CHANGELOG.md if applicable

2. **Submit Your PR**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   
   ## Related Issues
   Fixes #123
   ```

## Coding Standards

### Python (Backend)

- Follow [PEP 8](https://pep8.org/)
- Use type hints
- Format with Black: `black app/`
- Sort imports with isort: `isort app/`
- Lint with flake8: `flake8 app/`

```python
# Good example
from typing import List, Optional
from fastapi import HTTPException

async def get_alerts(
    severity: Optional[str] = None,
    limit: int = 20
) -> List[Alert]:
    """Retrieve alerts with optional filtering."""
    pass
```

### TypeScript/JavaScript

- Use ESLint and Prettier
- Prefer functional components in React
- Use TypeScript strict mode
- Follow React Hooks rules

```typescript
// Good example
interface AlertProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
}

export const AlertCard: React.FC<AlertProps> = ({ alert, onDismiss }) => {
  // Component logic
};
```

### CSS/Styling

- Use Tailwind CSS classes
- Follow shadcn/ui patterns
- Maintain consistent spacing
- Ensure responsive design

## Testing

### Backend Tests

```bash
cd backend
pytest                    # Run all tests
pytest -v                # Verbose output
pytest --cov=app        # With coverage
pytest -k "test_alert"  # Run specific tests
```

### Frontend Tests

```bash
# Mobile
cd mobile
npm test
npm run test:watch

# Dashboard
cd web-dashboard
npm test
npm run test:e2e
```

### Writing Tests

- Aim for >80% code coverage
- Test edge cases and error conditions
- Use meaningful test names
- Mock external dependencies

```python
# Example backend test
async def test_create_alert_requires_auth():
    response = client.post("/api/v1/alerts", json={...})
    assert response.status_code == 401
```

## Documentation

### Code Documentation

- Add docstrings to all public functions
- Include type information
- Provide usage examples
- Document complex algorithms

### API Documentation

- Update OpenAPI schemas
- Include request/response examples
- Document error cases
- Keep Postman collection updated

### User Documentation

- Update README for new features
- Add screenshots for UI changes
- Include migration guides
- Document configuration options

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time chat (if available)

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Be patient and respectful

### Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## Specific Contribution Areas

### 🚨 Emergency Algorithms
Help improve alert routing, severity assessment, and delivery optimization.

### 🌐 Translations
Add support for more languages spoken in Hawaii.

### 📱 Mobile Features
Enhance the React Native app with new features and better offline support.

### 📊 Analytics
Improve data visualization and reporting capabilities.

### 🔒 Security
Help identify and fix security vulnerabilities.

### ♿ Accessibility
Ensure the app is usable by everyone, including those with disabilities.

## Resources

- [Project Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Policy](SECURITY.md)

---

## Thank You! 🌺

Your contributions help keep Hawaii safe. Every improvement, no matter how small, makes a difference in emergency preparedness and response.

Mahalo nui loa for your kokua (help)!