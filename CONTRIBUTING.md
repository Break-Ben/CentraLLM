# Contributing to CentraLLM

Thank you for your interest in contributing to CentraLLM!

---

## Recommended Development Setup

[VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## Getting Started

1. Fork the repository and create a feature branch off `main`:

```bash
git checkout -b feature/my-new-feature
```

2. Install dependencies:

```bash
npm install
```

3. Run the development environment:

```bash
npm run dev
```

---

## Code Guidelines & Standards

- **Minimal Changes:** Only make the minimal changes required for a feature or fix. Avoid unnecessary refactoring or style adjustments outside the scope of your PR.
- **Code Consistency:** Stick closely to the style and patterns of the existing codebase, such as avoiding single-character variable names.
- **Spelling & Locale:** Use Australian English for user-facing text and documentation.
- **Comments:** Do not add unnecessary inline code comments.
- **Dependencies:** Prefer existing dependencies over adding new ones or writing manual code. Use Shadcn components built on Base UI rather than raw HTML elements.
- **Styling:** Avoid adding custom CSS or padding unless strictly necessary. Use existing Shadcn and Tailwind utility classes where possible.

---

## Validation & Formatting

Before committing or submitting a pull request, verify that your code passes all linting, formatting, and type checks:

```bash
# Format and lint fix
npm run tidy

# Run TypeScript typechecks for main and renderer processes
npm run typecheck
```

---

## Submitting Pull Requests

1. Ensure all code satisfies the checks above, compiles and passes `npm run build`.
2. Provide a clear description of the issue solved or feature added.
3. Keep pull requests focused on a single logical change set.
