# local-cleanup

Volunteer coordination app for neighborhood cleanup. Community members
report spots that need attention, add tasks, claim work, and track
progress on a map.

Built for Saint Paul, MN. Easily deployable for any city or neighborhood.

## How it works

1. **See the map** -- spots that need cleanup show as colored pins
2. **Report a spot** -- click the map to drop a pin, name it, pick the type of work
3. **Add tasks** -- each spot has a task list (litter, weeding, brush clearing, etc.)
4. **Add notes** -- leave tips about access, parking, hazards for other volunteers
5. **Claim a task** -- sign up with your name and email, get a calendar invite
6. **Mark it done** -- complete tasks as you go; the pin turns green when everything is done
7. **Plan a trip** -- add spots to your trip, export GPX for cycling apps, or open a Google Maps route

Red pins need help. Yellow pins are in progress. Green pins are all done.

**"Near me"** tracks your location as you walk or bike. **Street View**
lets you recon a spot before heading out. Claims expire after 14 days
if not completed, so tasks don't get stuck.

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
ADMIN_TOKEN=pick-a-random-secret-string
```

**To find your coordinates:** open Google Maps, right-click the center
of your city or neighborhood, and click the coordinates that appear.
They'll be copied to your clipboard.

**ADMIN_TOKEN** gives you access to `/admin?token=YOUR_TOKEN` where you
can hide and restore spots. Pick any random string you'll remember.

### 3. Create the database

Install the Wrangler CLI (included in dev dependencies), then create
your D1 database:

```sh
npx wrangler login
npx wrangler d1 create local-cleanup-db
```

Wrangler will output a database ID. Open `wrangler.jsonc` and replace
the existing `database_id` value with your database's ID.

Load the schema:

```sh
npx wrangler d1 execute local-cleanup-db --remote --file=db/schema.sql
```

### 4. Deploy

Connect your GitHub repo to Cloudflare Pages:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages > Create
2. Select "Connect to Git" and choose your forked repo
3. Set build command: `npm run build`
4. Set deploy command: `npx wrangler deploy`
5. Add environment variables: `CITY_NAME`, `MAP_CENTER_LAT`, `MAP_CENTER_LNG`, `MAP_ZOOM`, `ADMIN_TOKEN`
6. Deploy

Your site will be live at `your-project.workers.dev`. You can add a
custom domain in the Cloudflare dashboard.

## Local development

```sh
cp .env.example .env         # configure your city + admin token
npx wrangler d1 execute local-cleanup-db --local --file=db/schema.sql
npx wrangler d1 execute local-cleanup-db --local --file=db/seed.sql  # optional sample data
npm run dev                  # starts at http://localhost:4321
```

Admin page: `http://localhost:4321/admin?token=YOUR_ADMIN_TOKEN`

## Running tests

```sh
npm test
```

## Tech stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com)
- [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org) (free, no API key)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite database)
- [Cloudflare Workers](https://workers.cloudflare.com) (hosting + serverless)

## License

MIT
