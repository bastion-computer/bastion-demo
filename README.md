# Bastion Demo Tracker

This repository is a small issue tracker to showcase Bastion features. It is
intentionally simple: Bun, TypeScript, a tiny HTTP API, static frontend files,
JSON file storage, and no external package dependencies.

Use it to see how Bastion turns one prepared coding environment into many
isolated environments for parallel agent work.

## What You Will Do

- Install and prepare Bastion on a Linux host.
- Create a reusable Bastion template for a Bun and TypeScript project.
- Launch multiple environments from the same template.
- Attach to environments with `bastion ssh`, `bastion opencode`, and `bastion mux`.
- Run several coding agents in parallel with concrete prompts.
- Preview an environment's web app through a Bastion tunnel.
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

| Command         | Description                       |
| --------------- | --------------------------------- |
| `bun run start` | Start the HTTP server.            |
| `bun run dev`   | Start the server in watch mode.   |
| `bun test`      | Run store and API tests with Bun. |

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

The included template configures OpenCode with OpenAI credentials from environment
variables in `/etc/default/bastion`. Add the following line to the file.

```
OPENAI_API_KEY=sk_xxxxxx
```

And then restart bastion services.

```sh
sudo systemctl restart bastiond.service bastion-api.service
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
stores the prepared template. When each environment starts, it pulls the latest
repo changes and launches `bun run dev` in the background. The template also
registers a `tracker` tunnel for the app's guest-local port `3000`.

The template currently clones:

```text
https://github.com/bastion-computer/bastion-demo.git
```

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
bastion ssh --key demo-fix-bug -- 'cd /workspace/bastion-demo && bun test'
```

## 5. Use Bastion Mux

Using Bastion's built in multiplexer is the fastest way to move between parallel
environments. However, it does require a [tmux](https://github.com/tmux/tmux/wiki/Installing)
dependency on your system.

```sh
bastion mux
```

In the tmux session, you can create a new tabs with `ctrl + b & c`, select one of
the `demo-*` environments, then choose either `SSH` or `OpenCode`.

Bastion mux uses default `tmux` shortcuts. Refer to the [tmux cheat sheet](https://tmuxcheatsheet.com/)
if you are unfamiliar.

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

Because each environment has its own VM, file system, process tree, and package
state, these sessions can run at the same time without sharing ports or mutating
each other's working copies.

## 7. Preview The App With Tunnels

The template registers a Bastion tunnel named `tracker` for port `3000` inside
each environment. The dev server starts automatically in the background when the
environment starts.

Since this server is running inside a VM, we will need to use a local proxy to
route requests to a Bastion tunnel. In a separate terminal run:

```sh
bastion proxy --env-key demo-fix-bug --name tracker
```

Open the given `url` in a browser on your host to use the tracker running inside
the VM. You can also append API paths to the same proxy URL, such as
`/api/health` or `/api/issues`.

Each `demo-*` environment gets its own `tracker` tunnel, so multiple
agents can run the same app port at the same time without colliding.

## 8. Optional: Remote Access And `bastion client`

If Bastion runs on a remote Linux server, you can drive it from your local machine
by exposing the host API through a private network with Tailscale.

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
