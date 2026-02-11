# Contributing to Osaifill

First off, thank you for considering contributing to Osaifill! It is people like you who make Osaifill such a great tool for everyone.

Please take a moment to review this document to make the contribution process easy and effective for everyone involved.

## Code of Conduct

By participating in this project, you are expected to uphold our commitment to a welcoming and inclusive community.

## Developer Certificate of Origin (DCO)

To improve trackability of contributions, we require all commits to be signed off. This is a declaration that you have the right to submit the code under the project's license.

### How to sign off
You must add a `Signed-off-by` line to every commit message. You can do this automatically by using the `-s` or `--signoff` flag with `git commit`:

```bash
git commit -s -m "Your commit message"
```

This will add a line like this to your commit:
`Signed-off-by: Random J Developer <random@developer.example.org>`

**PRs without signed-off commits will not be accepted.**

## How to Contribute

### Reporting Bugs
Before creating bug reports, please check the existing issues to see if the problem has already been reported. When reporting a bug, please use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml).

### Suggesting Enhancements
We welcome new ideas! Please use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml) to describe your suggestion.

### Pull Requests
1. **Branching**: Please create a new branch for your feature or bug fix.
2. **Coding Standards**: 
   - Backend: Ensure your code passes `mypy` and follows PEP 8.
   - Frontend: Ensure your code passes `npm run lint`.
3. **Tests**: Add tests for new features or bug fixes whenever possible. Ensure all existing tests pass.
4. **Documentation**: Update the README or other documentation if your change introduces new behavior.

## Development Setup

### Backend
1. Navigate to the `backend/` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it and install dependencies: `pip install -e ".[dev]"`.
4. Run tests: `pytest`.

### Frontend
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.

## Review Process

**Please Note:** Osaifill is a personal project. While I appreciate every contribution, I may not be able to review your Pull Request immediately. It may take several days or even weeks depending on my availability. Thank you for your patience.

## Security Vulnerabilities

If you discover a security vulnerability, please do **NOT** create a public issue. Instead, please contact the maintainer directly via GitHub profile or email (if provided).

## License

By contributing to Osaifill, you agree that your contributions will be licensed under the [MIT License](LICENSE).
