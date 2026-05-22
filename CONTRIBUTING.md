# Contributing to DefineAM

Thank you for considering contributing to DefineAM! We welcome all kinds of contributions, including bug reports, feature requests, code improvements, and tests.

## Table of Contents

* [Contributing to DefineAM](#contributing-to-definam)

  * [Table of Contents](#table-of-contents)
  * [How to Contribute](#how-to-contribute)

    * [Reporting Bugs](#reporting-bugs)
    * [Suggesting Features](#suggesting-features)
    * [Code Contributions](#code-contributions)
    * [Development Workflow](#development-workflow)

      * [Branch Naming Rules](#branch-naming-rules)
      * [Commit Message Rules](#commit-message-rules)
    * [Submitting Pull Requests](#submitting-pull-requests)
    * [Writing Tests](#writing-tests)
    * [Code Style](#code-style)
    * [REST API Conventions](#rest-api-conventions)
  * [Code of Conduct](#code-of-conduct)
  * [License](#license)

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on [GitHub Issues](https://github.com/BuildiItt-Inc/definam-pwa/issues) and include as much detail as possible. Provide steps to reproduce, expected and actual behavior, and any relevant logs.

### Suggesting Features

If you have an idea for a new feature, please open an issue on [GitHub Issues](https://github.com/BuildiItt-Inc/definam-pwa/issues) and describe your proposal. Explain why the feature would be useful and how it should work.

### Code Contributions

> Please make sure to have created a fork of the original repository. This is where you will work in when contributing.

#### Development Workflow

1. Create a new branch for your work:

   ```sh
   git checkout -b feat/DA-2145-your-feature-name
   ```

##### Branch Naming Rules

* You will likely work on features, bug fixes, refactors, chores on the repo, or documentation. Each type of update should be used as a prefix in your branch name: `feat/`, `refactor/`, `fix/`, `chore/`, or `docs/`.
* Include a ticket or issue number, e.g., DA-2145.
* Add a short description of your update (from the ticket title), all in lowercase.

> Example branch names: `feat/DA-1234-create-login-page` or `chore/remove-unused-variables`.

2. Make your changes, and commit them with descriptive messages:

   ```sh
   git commit -m "feat: your commit message"
   ```

##### Commit Message Rules

Commit messages follow this pattern:

```
<type>(<ticket-number>): <short description>
```

* Use imperative tense: "fix login issue", not "fixed login issue".
* Optional ticket number in parentheses:

```
feat(DA-1234): add login functionality
refactor: simplify formData handling
```

> Follow proper Git commit conventions: [Git Commit Message Guide](https://www.fynix.dev/blog/git-commit-message-guide)

3. Push your branch to your cloned repository:

   ```sh
   git push origin <your-branch>
   ```

#### Pre-Commit Hooks

To maintain code quality and consistency, this project uses pre-commit hooks for linting and formatting. These hooks automatically run checks before each commit to catch errors early and ensure the codebase stays clean.

**Setup Instructions:**

1. Install the pre-commit package (if not already installed):

   ```sh
   pip install -r -requirements.txt
   ```
   or

   ```sh
   uv add pre-commit
   ```

2. Install the hooks defined in the repository:

   ```sh
   pre-commit install
   ```

3. Optional: Run all hooks against all files manually to check your code before committing:

   ```sh
   pre-commit run --all-files
   ```

 After this setup, pre-commit will automatically run linting and formatting checks before each commit.


#### Submitting Pull Requests

1. Ensure your branch is up to date with the remote repository:

   ```sh
   git checkout dev
   git pull origin dev
   git checkout <your-branch>
   git rebase dev
   ```

2. Run tests and ensure all pass:

   ```sh
   poetry run pytest
   ```

3. Submit a pull request from your branch to the upstream repository.

4. In your pull request description, explain what changes you made and why.

### Writing Tests

* All new features, bug fixes, and significant changes **must include tests**.
* Run all tests before submitting your PR.
* Aim for comprehensive coverage and meaningful assertions.

### Code Style

* Follow **Python docstring conventions** (Google style): [Python Style Guide](https://google.github.io/styleguide/pyguide.html)
* Keep code clean, readable, and consistent with existing codebase.

### REST API Conventions

* Follow standard **RESTful API conventions** for resource naming, endpoints, and HTTP methods: [REST API Resource Naming](https://restfulapi.net/resource-naming/)
* Use nouns for resources, plural where appropriate, and avoid verbs in URLs.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License](LICENSE).
