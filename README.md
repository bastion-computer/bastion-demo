# Bastion Demo Tracker

This repository is a small issue tracker for Bastion demos. It is intentionally
simple: Bun, TypeScript, a tiny HTTP API, static frontend files, JSON file
storage, and no external package dependencies.

Use it to demonstrate how Bastion turns one prepared coding environment into many
isolated environments for parallel agent work.

## What You Will Demo

- Install and prepare Bastion on a Linux host.
- Create a reusable Bastion template for a Bun and TypeScript project.
- Launch multiple environments from the same template.
- Attach to environments with `bastion ssh`, `bastion opencode`, and `bastion mux`.
- Run several coding agents in parallel with concrete prompts.
- Configure a remote CLI with `bastion client` commands.

## Local App Usage

You can run the demo app without Bastion first:

```sh
bun install
bun test
bun run start
```

Open `http://localhost:3000` to use the tracker. The app creates
`data/issues.json` from `data/issues.seed.json` on first run.

Useful scripts:

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `bun run start` | Start the HTTP server.              |
| `bun run dev`   | Start the server in watch mode.     |
| `bun test`      | Run store and API tests with Bun.   |

## Repository Layout

```text
.
├── bastion/template.json       # Bastion environment template
├── data/issues.seed.json       # Seed data copied on first app run
├── prompts/                    # Example prompts for parallel agents
├── public/                     # Static frontend
└── src/                        # TypeScript API, store, stats, and tests
```

## 1. Install Bastion

Bastion currently targets Linux hosts with x86_64 KVM support.

Install the `bastion` CLI, `bastiond`, and the systemd services:

```sh
curl -fsSL https://bastion.computer/install.sh | bash
```

Check that the services are running:

```sh
sudo systemctl status bastiond.service bastion-api.service
```

Prepare the host for Cloud Hypervisor environments:

```sh
bastion system check
bastion system add cloud-hypervisor --with-utilities
```

## 2. Configure The Agent Provider

The included template configures OpenCode with OpenAI credentials from the host
environment:

```sh
export OPENAI_API_KEY=sk_xxxxxx
```

If you use another provider, edit `bastion/template.json` before creating the
template. Update `agents.opencode.auth` and `agents.opencode.config.model` to
match your provider.

## 3. Create A Template

From this repository, register the demo template:

```sh
bastion templates create --key bastion-demo --file bastion/template.json
```

Template creation boots a temporary VM, installs Bun, installs `git`, clones this
repo, runs `bun install --frozen-lockfile`, runs `bun test`, snapshots the VM, and
stores the prepared template.

The template currently clones:

```text
https://github.com/bastion-computer/bastion-demo.git
```

If you fork or rename the repository, update the clone URL in
`bastion/template.json` first.

## 4. Create Parallel Environments

Create one environment per coding session. These commands can run from separate
terminals, or you can run them one after another:

```sh
bastion env create --template-key bastion-demo --key demo-fix-bug --tag demo --tag task:fix-bug
bastion env create --template-key bastion-demo --key demo-refactor --tag demo --tag task:refactor
bastion env create --template-key bastion-demo --key demo-labels --tag demo --tag task:feature
bastion env create --template-key bastion-demo --key demo-tests --tag demo --tag task:tests
bastion env create --template-key bastion-demo --key demo-search --tag demo --tag task:feature
```

List the environments:

```sh
bastion env list --tag demo
```

Run a quick command inside one environment:

```sh
bastion ssh --key demo-fix-bug -- bun test
```

Open an interactive shell in the repo directory:

```sh
bastion ssh --key demo-fix-bug
```

The shell starts in `/workspace/bastion-demo` because the template uses the
`set_default_ssh_directory` action.

## 5. Use Bastion Mux

Open Bastion's tmux environment picker:

```sh
bastion mux
```

In the tmux session, create a new tab, select one of the `demo-*` environments,
then choose either `SSH` or `OpenCode`. This is the fastest way to move between
parallel environments during a live demo.

## 6. Run Parallel Coding Sessions

Each environment is isolated. Start one OpenCode session per environment and
paste a different prompt.

Example session map:

| Environment     | Prompt file                              | Demo goal                         |
| --------------- | ---------------------------------------- | --------------------------------- |
| `demo-fix-bug`  | `prompts/01-fix-whitespace-title-bug.md` | Fix a validation bug.             |
| `demo-refactor` | `prompts/02-refactor-api-router.md`      | Refactor without behavior change. |
| `demo-labels`   | `prompts/03-add-labels-feature.md`       | Add a product feature.            |
| `demo-tests`    | `prompts/04-add-api-tests.md`            | Expand test coverage.             |
| `demo-search`   | `prompts/05-add-search-filter.md`        | Improve the frontend.             |

Attach OpenCode to each environment from separate terminals:

```sh
bastion opencode --key demo-fix-bug
bastion opencode --key demo-refactor
bastion opencode --key demo-labels
bastion opencode --key demo-tests
bastion opencode --key demo-search
```

You can also launch these sessions through `bastion mux` and keep them in one
tmux session.

Suggested workflow for each session:

```sh
bun test
git status --short
```

Then paste the relevant prompt file into OpenCode. When an agent finishes, verify
inside that environment:

```sh
bun test
git diff
```

Because each environment has its own VM, file system, process tree, and package
state, these sessions can run at the same time without sharing ports or mutating
each other's working copies.

## 7. Touch The App Over SSH

The app listens on port `3000` inside the environment. For quick API checks, run
commands inside the VM:

```sh
bastion ssh --key demo-fix-bug -- bun run start
```

In another SSH session to the same environment:

```sh
bastion ssh --key demo-fix-bug -- curl -fsS http://localhost:3000/api/health
bastion ssh --key demo-fix-bug -- curl -fsS http://localhost:3000/api/issues
```

For frontend changes, ask the agent to rely on code review and targeted tests, or
open an interactive shell and use whatever browser or forwarding workflow your
demo host supports.

## 8. Remote Access And `bastion client`

If Bastion runs on a Linux host but you drive it from a laptop, expose the host
API through your private network. With Tailscale Serve on the Bastion host:

```sh
tailscale serve --bg localhost:3148
tailscale serve status
```

On the remote client machine, persist the API URL:

```sh
bastion client set api-url https://bastion-host.example.ts.net
bastion client config
```

After that, normal commands target the remote host API:

```sh
bastion env list --tag demo
bastion opencode --key demo-fix-bug
```

You can also skip persisted config and pass the URL for one command:

```sh
bastion --api-url https://bastion-host.example.ts.net env list --tag demo
```

Remove the persisted remote URL when you want to return to the local default:

```sh
bastion client remove api-url
```

## 9. Clean Up

Remove demo environments:

```sh
bastion env remove --key demo-fix-bug
bastion env remove --key demo-refactor
bastion env remove --key demo-labels
bastion env remove --key demo-tests
bastion env remove --key demo-search
```

Remove the template if you no longer need it:

```sh
bastion templates remove --key bastion-demo
```

## Notes For Demo Authors

- Keep this repo dependency-free so template creation stays fast.
- Keep prompts small and independent so each one fits a parallel environment.
- If you add dependencies later, commit the updated Bun lockfile and keep
  `bastion/template.json` using `bun install --frozen-lockfile`.
- If the public GitHub repo moves, update both `bastion/template.json` and any
  docs that link to it.
