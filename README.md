# local-cleanup

Volunteer coordination app for neighborhood cleanup. Community members
report spots that need attention, sign up to clean them, and track
progress on a map.

Built for Saint Paul, MN. Easily deployable for any city or neighborhood.

## How it works

1. **See the map** -- spots that need cleanup show as pins
2. **Report a spot** -- click the map to drop a pin, name the spot, describe what needs doing
3. **Add tasks** -- each spot has a task list (litter pickup, weeding, brush clearing, etc.)
4. **Claim a task** -- sign up with your name and email
5. **Mark it done** -- complete tasks as you go; the pin turns green when everything is done

Red pins need help. Yellow pins are in progress. Green pins are all done.

## Deploy your own

You need a free [Cloudflare](https://cloudflare.com) account. No credit
card required.

### 1. Fork and clone

Fork this repo on GitHub, then clone it:

```sh
git clone https://github.com/YOUR-USERNAME/local-cleanup.git
cd local-cleanup
npm install
```

### 2. Configure your city

Copy the example environment file and edit it:

```sh
cp .env.example .env
```

Open `.env` and set your city's details:

```
CITY_NAME="Your City, ST"
MAP_CENTER_LAT=44.9537
MAP_CENTER_LNG=-93.0900
MAP_ZOOM=13
```

**To find your coordinates:** open Google Maps, right-click the center
of your city or neighborhood, and click the coordinates that appear.
They'll be copied to your clipboard.

### 3. Create the database

Install the Wrangler CLI (included in dev dependencies), then create
your D1 database:

```sh
npx wrangler login
npx wrangler d1 create local-cleanup-db
```

Wrangler will output a database ID. Open `wrangler.jsonc` and replace
`LOCAL_DEV_PLACEHOLDER` with your actual database ID.

Load the schema:

```sh
npx wrangler d1 execute local-cleanup-db --remote --file=db/schema.sql
```

### 4. Deploy

Connect your GitHub repo to Cloudflare Pages:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages > Create
2. Select "Connect to Git" and choose your forked repo
3. Set build command: `npm run build`
4. Set build output directory: `dist`
5. Add environment variables: `CITY_NAME`, `MAP_CENTER_LAT`, `MAP_CENTER_LNG`, `MAP_ZOOM`
6. Under Settings > Functions > D1 database bindings, add a binding with variable name `DB` pointing to your `local-cleanup-db` database
7. Deploy

Your site will be live at `your-project.pages.dev`. You can add a custom
domain in the Cloudflare Pages settings.

## Local development

```sh
cp .env.example .env         # configure your city
npx wrangler d1 execute local-cleanup-db --local --file=db/schema.sql
npx wrangler d1 execute local-cleanup-db --local --file=db/seed.sql  # optional sample data
npm run dev                  # starts at http://localhost:4321
```

## Running tests

```sh
npm test
```

## Tech stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com)
- [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org) (free, no API key)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite database)
- [Cloudflare Pages](https://pages.cloudflare.com) (hosting + serverless functions)

## License

MIT
