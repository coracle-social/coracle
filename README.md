# Flotilla

A discord-like nostr client based on the idea of "relays as groups".

If you would like to be interoperable with Flotilla, please check out this draft NIP: https://github.com/coracle-social/nips/blob/relay-chat/xx.md

# Deploy

To run your own Flotilla, it's as simple as:

- `npm install`
- `npm run build`
- `npx serve build`

## Environment

You can also optionally create an `.env.local` file and populate it with the following environment variables (see `.env` for examples):

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

## Nginx/TLS (optional)

If you'd like to set up flotilla on a server you control, you'll want to set up a reverse proxy and provision a TSL certificate for the domain you'll be using. You should also make sure to add swap to your server.

There will be some parts of the following templates, for example `<SERVER NAME>`, which you'll need to fill in before running the code.

First, create an `A` record with your DNS provider pointing to the IP of your server. This will allow certbot to create your certificate later.

Next install `nginx`, `git`, and `certbot`. If you're on a debian- or ubuntu-based distro, run `sudo apt-get update && sudo apt-get install nginx git certbot python3-certbot-nginx`.

Now, create a new user where your code will be stored, clone the repository, fill in your `.env.local` file, and build the app.

```sh
# Replace with your password
PASSWORD=<YOUR PASSWORD HERE>

# Add the user and set a password
adduser flotilla
echo flotilla:$PASSWORD | chpasswd

# Login as flotilla
sudo su flotilla

# Go to flotilla's home directory
cd ~

# Install nvm, yarn, clone repos
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Update PATH
. ~/.bashrc

# Clone repository and install dependencies
git clone https://github.com/coracle-social/flotilla.git
cd ~/flotilla
nvm install
nvm use
npm i

# Optionally create and populate .env.local to suit your use case

# Build the app
NODE_OPTIONS=--max_old_space_size=16384 npm run build

# Exit back to root
exit
```

Once you've exited back to root, you can set up nginx. Place the following in a file named after your domain in the `/etc/nginx/sites-available` directory, for example, `flotilla.example.com`. This should match the `A` record you registered above.

```conf
server {
    listen              80;
    server_name         <SERVER NAME>;
    root                /home/flotilla/flotilla/build;
    index               index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Now you can run `certbot`, which will provision a TLS certificate for your domain and update your nginx configuration.

```
certbot --nginx -d <SERVER NAME>
```

Now, enable the site and restart nginx. If you want to be careful, run `nginx -t` before restarting nginx.

```
ln -s /etc/nginx/sites-{available,enabled}/<SERVER NAME>
service nginx restart
```

Now, visit your domain. You should be all set up!

# Development

Run `npm run dev` to get a dev server, and `npm run check:watch` to watch for typescript errors. When you're ready to commit, run `npm run format && npm run lint` and fix any errors that come up.
