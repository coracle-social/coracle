# Flotilla

A discord-like nostr client based on the idea of "relays as groups".

If you would like to be interoperable with Flotilla, please check out this guide: https://habla.news/u/hodlbod@coracle.social/1741286140797

# Deploy

To run your own Flotilla, it's as simple as:

```sh
pnpm install
pnpm run build
npx serve build
```

Or, if you prefer to use a container:

```sh
podman run -d -p 3000:3000 ghcr.io/coracle-social/flotilla:latest
```

Alternatively, you can copy the build files into a directory of your choice and serve it yourself:

```sh
mkdir ./mount
podman run -v ./mount:/app/mount ghcr.io/coracle-social/flotilla:latest bash -c 'cp -r build/* mount'
```

## Environment

You can also optionally create an `.env` file and populate it with the following environment variables (see `.env` for examples):

- `VITE_DEFAULT_PUBKEYS` - A comma-separated list of hex pubkeys for bootstrapping web of trust.
- `VITE_PLATFORM_URL` - The url where the app will be hosted. This is only used for build-time population of meta tags.
- `VITE_PLATFORM_NAME` - The name of the app
- `VITE_PLATFORM_LOGO` - A logo url for the app
- `VITE_PLATFORM_RELAY` - A relay url that will make flotilla operate in "platform mode". Disables all space browse/add/select functionality and makes the platform relay the home page.
- `VITE_PLATFORM_ACCENT` - A hex color for the app's accent color
- `VITE_PLATFORM_DESCRIPTION` - A description of the app
- `VITE_GLITCHTIP_API_KEY` - A Sentry DSN for use with glitchtip (error reporting)
- `GLITCHTIP_AUTH_TOKEN` - A glitchtip auth token for error reporting

If you're deploying a custom version of flotilla, be sure to remove the `plausible.coracle.social` script from `app.html`. This sends analytics to a server hosted by the developer.

# Development

Run `pnpm run dev` to get a dev server, and `pnpm run check:watch` to watch for typescript errors. When you're ready to commit, a pre-commit hook will run to lint and typecheck your work.
