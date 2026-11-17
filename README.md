# Moon Shop BD

Moon Shop BD is a cash-on-delivery e-commerce application for kids' blazers.
Customers can browse products, view sizing information, submit orders, and
contact the shop through WhatsApp. Staff manage products, images, contact
details, and orders through Django Admin.

## Technology

- **Frontend:** React 18, React Router, Vite 5
- **Backend:** Django and Django REST Framework
- **Database:** SQLite locally; PostgreSQL recommended in production
- **Production:** Gunicorn behind Nginx
- **Analytics:** Meta Pixel e-commerce events

## Features

- Responsive product collection and detail pages
- Multiple product images and configurable sizes
- Admin-managed size chart and Inside/Outside Dhaka delivery charges
- Cash-on-delivery order form with server-side validation
- Django Admin product, store-settings, and order management
- Server-controlled pricing; prices submitted by browsers are not trusted
- Order API rate limit of 30 submissions per IP per hour
- Meta events: `PageView`, `ViewContent`, `InitiateCheckout`, `Purchase`, and `Contact`

## Repository layout

```text
blazer-shop/
├── backend/
│   ├── config/                 # Django settings, URLs, and WSGI
│   ├── shop/                   # Models, API, admin, tests, and migrations
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/                 # Logos and size charts
│   ├── src/                    # React application
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Prerequisites

For local development:

- Python 3.11 or newer
- Node.js 18 or newer and npm
- Git

For the production instructions below:

- Ubuntu 22.04/24.04 or similar Linux server
- A domain whose DNS points to the server
- PostgreSQL, Nginx, and systemd
- SSH access with a sudo-enabled user

## Local development

### Docker Compose (PostgreSQL)

The quickest way to run the complete application with PostgreSQL is:

```bash
docker compose up --build
```

Compose reads the root `.env` file automatically. Review its local defaults
before starting, especially `POSTGRES_PASSWORD` and `DJANGO_SECRET_KEY`. Then
open:

- Storefront: <http://localhost:3000>
- Django Admin: <http://localhost:8000/admin/>
- Product API: <http://localhost:8000/api/products/>

The database and uploaded product images are kept in named Docker volumes. To
stop the containers without deleting that data, run `docker compose down`.
Running `docker compose down --volumes` also deletes the local database and
uploads, so use that option only when you intentionally want a clean reset.

To create an admin account in the running backend container:

```bash
docker compose exec backend python manage.py createsuperuser
```

To add or update the demonstration products:

```bash
docker compose exec backend python manage.py seed_products
```

The frontend expects Django at `http://127.0.0.1:8000`. Vite proxies `/api`
and `/media` to Django, so two terminals are required.

### 1. Backend

Windows PowerShell:

```powershell
cd D:\path\to\blazer-shop\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_products
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

Linux/macOS:

```bash
cd /path/to/blazer-shop/backend
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_products
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver
```

`seed_products` creates or updates four demonstration products and is safe to
run repeatedly. Skip it when starting with a completely custom catalogue.

### 2. Frontend

Windows PowerShell:

```powershell
cd D:\path\to\blazer-shop\frontend
npm.cmd install
npm.cmd run dev
```

Linux/macOS:

```bash
cd /path/to/blazer-shop/frontend
npm install
npm run dev
```

Open:

- Storefront: <http://localhost:5173>
- Django Admin: <http://127.0.0.1:8000/admin/>
- Product API: <http://127.0.0.1:8000/api/products/>

### Run checks

```bash
cd backend
.venv/bin/python manage.py test
.venv/bin/python manage.py check

cd ../frontend
npm run build
```

On Windows, use `.venv\Scripts\python.exe` and `npm.cmd` instead.

## Configuration

### Backend environment variables

Django reads environment variables from its process. It does **not** load a
`.env` file automatically. The production systemd service below loads
`/etc/moon-shop.env`.

| Variable | Production | Example | Purpose |
|---|---:|---|---|
| `DJANGO_DEBUG` | Required | `0` | Must be `0` in production |
| `DJANGO_SECRET_KEY` | Required | long random value | Cryptographic signing key |
| `DJANGO_ALLOWED_HOSTS` | Required | `shop.example.com,www.shop.example.com` | Comma-separated hostnames, without schemes |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Required | `https://shop.example.com,https://www.shop.example.com` | Comma-separated HTTPS origins |
| `POSTGRES_DB` | Recommended | `moon_shop` | Enables PostgreSQL when set |
| `POSTGRES_USER` | With PostgreSQL | `moon_shop` | PostgreSQL user |
| `POSTGRES_PASSWORD` | With PostgreSQL | strong password | PostgreSQL password |
| `POSTGRES_HOST` | With PostgreSQL | `127.0.0.1` | PostgreSQL host |
| `POSTGRES_PORT` | Optional | `5432` | PostgreSQL port |

Without `POSTGRES_DB`, Django uses `backend/db.sqlite3`. SQLite is useful
locally but is not recommended for a public store.

Generate a secret key locally:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Frontend and Meta Pixel

The current public Pixel ID is configured in `frontend/src/metaPixel.js`.
Override it at build time with `frontend/.env.production` if needed:

```dotenv
VITE_META_PIXEL_ID=1242084508126895
```

`VITE_` variables are embedded in the browser bundle and are public. Never put
a Meta access token, Conversions API token, database password, or other secret
in a Vite variable. Rebuild the frontend after changing any Vite configuration.

## Vercel storefront and Render backend

The repository includes `render.yaml` for the Django API and PostgreSQL, and
`frontend/vercel.json` for the Vite storefront. Deploy Render first, then Vercel:

1. Push this repository to GitHub. In Render, create a Blueprint from its
   `render.yaml`. During the initial Blueprint setup, set
   `DJANGO_INITIAL_ADMIN_PASSWORD` to a strong password. The first start creates
   an `admin` user; later starts do not reset its password.
2. Wait for the Render service to pass its `/api/products/` health check. Its
   URL is shown in Render, for example
   `https://arrrafi10-moon-shop-api.onrender.com`. The first start creates the
   four demonstration products with their bundled photos.
3. In Vercel, import the same GitHub repository with **Root Directory** set to
   `frontend`, then deploy. The production storefront calls the Render API
   directly; `DJANGO_STOREFRONT_ORIGINS` in `render.yaml` permits the Vercel
   domain to make those requests. `frontend/vercel.json` also forwards `/api/`
   and `/media/` URLs and serves React routes from `index.html`. If either
   service's public hostname changes, update the API URL in `frontend/src/api.js`,
   both rewrite destinations in `frontend/vercel.json`, and the allowed
   storefront origin in `render.yaml`, then redeploy both services.
4. Check the Vercel storefront and the Render `/admin/` page. Log in with
   username `admin` and the password provided during Blueprint setup.

The Blueprint uses Render's free plans for a preview. Free PostgreSQL expires
after 30 days, and free web services have ephemeral filesystems, so new
admin-uploaded photos can disappear after a restart. Before accepting live
orders, upgrade the database and web service to paid plans, attach a persistent
disk at `/var/data`, set `DJANGO_MEDIA_ROOT=/var/data/media`, and update the plan
fields in `render.yaml`. The bundled demonstration photos are restored when
needed; admin-uploaded files require persistent storage.

## Production deployment

These instructions deploy PostgreSQL, Gunicorn, Nginx, and HTTPS on Ubuntu. The
application is designed to use one domain:

```text
https://shop.example.com/          React storefront
https://shop.example.com/api/      Django API
https://shop.example.com/admin/    Django Admin
https://shop.example.com/media/    Uploaded images
https://shop.example.com/static/   Admin static files
```

Replace `shop.example.com`, `/var/www/moon-shop`, repository URL, and all sample
credentials below.

### 1. Install server packages

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip postgresql nginx git
```

Install a current Node.js LTS release using your normal provisioning method.
Verify everything before continuing:

```bash
python3 --version
node --version
npm --version
psql --version
nginx -v
```

### 2. Upload or clone the code

```bash
sudo mkdir -p /var/www/moon-shop
sudo chown -R "$USER":"$USER" /var/www/moon-shop
git clone YOUR_REPOSITORY_URL /var/www/moon-shop
cd /var/www/moon-shop
```

If an uploaded copy is already there, skip `git clone`. Do not transfer local
`.venv`, `node_modules`, `dist`, `db.sqlite3`, or `.env` files. Dependencies and
production configuration should be recreated on the server.

### 3. Create PostgreSQL database

```bash
sudo -u postgres psql
```

In PostgreSQL, replace the password and run:

```sql
CREATE USER moon_shop WITH PASSWORD 'REPLACE_WITH_A_STRONG_PASSWORD';
CREATE DATABASE moon_shop OWNER moon_shop;
\q
```

### 4. Create production environment

```bash
sudo nano /etc/moon-shop.env
```

Add:

```dotenv
DJANGO_DEBUG='0'
DJANGO_SECRET_KEY='REPLACE_WITH_THE_GENERATED_SECRET_KEY'
DJANGO_ALLOWED_HOSTS='shop.example.com,www.shop.example.com'
DJANGO_CSRF_TRUSTED_ORIGINS='https://shop.example.com,https://www.shop.example.com'
POSTGRES_DB='moon_shop'
POSTGRES_USER='moon_shop'
POSTGRES_PASSWORD='REPLACE_WITH_THE_DATABASE_PASSWORD'
POSTGRES_HOST='127.0.0.1'
POSTGRES_PORT='5432'
```

Protect the file:

```bash
sudo chown root:www-data /etc/moon-shop.env
sudo chmod 640 /etc/moon-shop.env
```

Keep values single-quoted if they contain punctuation. Never commit this file.

### 5. Prepare Django

```bash
cd /var/www/moon-shop/backend
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

Create the writable directories before running management commands:

```bash
mkdir -p media staticfiles
sudo chown -R www-data:www-data media staticfiles
```

Run Django management commands as the same user that will run Gunicorn. This
shell loads the protected environment file without copying secrets into the
command line:

```bash
sudo -u www-data bash
set -a
source /etc/moon-shop.env
set +a
.venv/bin/python manage.py migrate
.venv/bin/python manage.py collectstatic --noinput
.venv/bin/python manage.py check --deploy
.venv/bin/python manage.py createsuperuser
exit
```

Optionally load the demonstration catalogue:

```bash
sudo -u www-data bash -c 'set -a; source /etc/moon-shop.env; set +a; .venv/bin/python manage.py seed_products'
```

### 6. Build React

```bash
cd /var/www/moon-shop/frontend
npm ci
npm run build
```

Production files are generated in `frontend/dist/`. Rebuild after every
frontend or `VITE_` configuration change.

### 7. Configure Gunicorn systemd service

Create `/etc/systemd/system/moon-shop.service`:

```ini
[Unit]
Description=Moon Shop BD Django application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/moon-shop/backend
EnvironmentFile=/etc/moon-shop.env
RuntimeDirectory=moon-shop
RuntimeDirectoryMode=0755
ExecStart=/var/www/moon-shop/backend/.venv/bin/gunicorn config.wsgi:application --workers 3 --bind unix:/run/moon-shop/gunicorn.sock --timeout 60
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now moon-shop
sudo systemctl status moon-shop --no-pager
```

Inspect failures with:

```bash
sudo journalctl -u moon-shop -n 100 --no-pager
```

### 8. Configure Nginx

Create `/etc/nginx/sites-available/moon-shop`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name shop.example.com www.shop.example.com;

    root /var/www/moon-shop/frontend/dist;
    index index.html;
    client_max_body_size 10M;

    location /api/ {
        include proxy_params;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://unix:/run/moon-shop/gunicorn.sock;
    }

    location /admin/ {
        include proxy_params;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://unix:/run/moon-shop/gunicorn.sock;
    }

    location /static/ {
        alias /var/www/moon-shop/backend/staticfiles/;
        expires 7d;
    }

    location /media/ {
        alias /var/www/moon-shop/backend/media/;
        expires 7d;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and validate it:

```bash
sudo ln -s /etc/nginx/sites-available/moon-shop /etc/nginx/sites-enabled/moon-shop
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The `try_files` fallback is required for direct visits and refreshes on React
routes such as `/blazers/charcoal-herringbone`.

### 9. Enable HTTPS

After confirming DNS points to the server:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.example.com -d www.shop.example.com
sudo certbot renew --dry-run
```

If only one hostname is used, remove the other from Nginx, Certbot,
`DJANGO_ALLOWED_HOSTS`, and `DJANGO_CSRF_TRUSTED_ORIGINS`.

### 10. Verify production

```bash
curl -I https://shop.example.com/
curl https://shop.example.com/api/products/
curl https://shop.example.com/api/store-settings/
sudo systemctl status moon-shop nginx postgresql --no-pager
```

Then verify in a browser:

1. Open the storefront and a product page.
2. Submit a test order with valid details.
3. Log in at `/admin/` and confirm the order appears.
4. Upload a product image and verify its `/media/` URL loads.
5. Use Meta Events Manager **Test Events** or Meta Pixel Helper to verify
   `PageView`, `ViewContent`, `InitiateCheckout`, and `Purchase`.

## Updating production

Back up the database and media first, then run:

```bash
cd /var/www/moon-shop
git pull --ff-only

backend/.venv/bin/python -m pip install -r backend/requirements.txt

sudo -u www-data bash -c '
  set -a
  source /etc/moon-shop.env
  set +a
  backend/.venv/bin/python backend/manage.py migrate
  backend/.venv/bin/python backend/manage.py collectstatic --noinput
'

cd frontend
npm ci
npm run build

sudo systemctl restart moon-shop
sudo nginx -t
sudo systemctl reload nginx
```

Ensure `backend/media/` remains writable by `www-data` after an update.

## Backups

Back up both PostgreSQL and uploaded media:

```bash
mkdir -p "$HOME/moon-shop-backups"
pg_dump -h 127.0.0.1 -U moon_shop -Fc moon_shop > "$HOME/moon-shop-backups/moon-shop-$(date +%F).dump"
tar -czf "$HOME/moon-shop-backups/moon-shop-media-$(date +%F).tar.gz" -C /var/www/moon-shop/backend media
```

Store copies away from the web server and test restoration periodically. The
database dump does not contain uploaded product photos.

## Admin usage

Open `/admin/` using the superuser created during setup.

- **Products:** names, prices, sizes, visibility, images, and display order
- **Orders:** customer delivery information, selected delivery area, saved delivery fee, totals, and fulfilment status
- **Store settings:** public helpline, support email, Inside/Outside Dhaka delivery charges, and an optional size chart upload. The supplied chart is shown until an admin uploads a replacement. WhatsApp uses the configured helpline number.

Customer-submitted order fields are read-only in Admin to preserve the original
order record.

## API summary

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/products/` | List active products |
| `GET` | `/api/products/<slug>/` | Get one product and its images |
| `GET` | `/api/store-settings/` | Get public contact settings |
| `POST` | `/api/orders/` | Create an order |

Example order request:

```json
{
  "product": "charcoal-herringbone",
  "size": "28",
  "quantity": 1,
  "delivery_area": "inside_dhaka",
  "customer_name": "Example Customer",
  "phone": "+8801712345678",
  "email": "",
  "address": "House 1, Road 2",
  "city": "Dhaka",
  "note": ""
}
```

The public API cannot list orders. Orders are available through Django Admin.

## Troubleshooting

### `502 Bad Gateway`

Gunicorn is stopped or Nginx cannot access its socket:

```bash
sudo systemctl status moon-shop --no-pager
sudo journalctl -u moon-shop -n 100 --no-pager
ls -l /run/moon-shop/gunicorn.sock
```

### Admin has no styling

Run `collectstatic`, verify Nginx's `/static/` alias, and reload Nginx.

### Images return `404` or cannot be uploaded

Verify Nginx's `/media/` alias and confirm `backend/media/` is writable by
`www-data`.

### React page returns `404` after refresh

Confirm the storefront Nginx location contains:

```nginx
try_files $uri $uri/ /index.html;
```

### Django reports `DisallowedHost`

Add the hostname without `https://` to `DJANGO_ALLOWED_HOSTS`, then restart the
Gunicorn service.

### CSRF errors in Admin

Add the full HTTPS origin to `DJANGO_CSRF_TRUSTED_ORIGINS`, confirm Nginx sends
`X-Forwarded-Proto`, and restart Gunicorn.

### Meta Pixel events do not appear

- Disable ad blockers during testing.
- Rebuild the frontend after changing the Pixel ID.
- Use Meta Pixel Helper and Events Manager **Test Events**.
- Check Meta traffic permissions if the Pixel has a domain allowlist.
- Search browser DevTools Network for `fbevents.js` and `facebook.com/tr`.

## Production security checklist

- Keep `DJANGO_DEBUG=0`.
- Use unique, randomly generated Django and PostgreSQL secrets.
- Never commit environment files, dumps, access tokens, or private keys.
- Never place secrets in `VITE_` variables or frontend source code.
- Use HTTPS and verify automatic certificate renewal.
- Keep the operating system and dependencies updated.
- Restrict SSH, configure a firewall, and back up regularly.
- Rotate any credential immediately if exposed in source, logs, or chat.

## Customisation

- Store name and fallback contacts: `frontend/src/config.js`
- Live contact details: Django Admin → Store settings
- Products, prices, sizes, descriptions, and images: Django Admin → Products
- Seed data: `backend/shop/management/commands/seed_products.py`
- Meta Pixel integration: `frontend/src/metaPixel.js`
