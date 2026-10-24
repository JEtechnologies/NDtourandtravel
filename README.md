# NDtourandtravel

Responsive website for **N Dee Tour & Travel**, Karnal, Haryana.

## Website

The deployable website is in `website/`. It includes the homepage, eight service pages, a custom 404 page, mobile navigation, direct call links, Google Maps directions, and validated WhatsApp enquiries.

Open `website/index.html` locally, or serve the `website/` directory with any static web server. No package installation or build step is required.

## Admin panel

Open `/admin` on the deployed website to manage the business name, address, mobile number, WhatsApp number, email, and service list. The panel supports adding, editing, hiding, deleting services, and uploading service photos. Save commits the content to this GitHub repository; the connected Vercel project then publishes the updated site. New services use a generated detail page unless a custom page link is set.

The admin login is checked by serverless functions and its session is stored in a secure, HTTP-only cookie. Never add the admin password or GitHub token to website files. Before using the panel, add these environment variables to the Vercel project for Production and Preview:

| Variable | Value |
| --- | --- |
| `ADMIN_USERNAME` | Admin ID, set privately in Vercel |
| `ADMIN_PASSWORD` | Admin password, set privately in Vercel |
| `ADMIN_SESSION_SECRET` | A long random secret (at least 32 random bytes) |
| `GITHUB_TOKEN` | Fine-grained GitHub token with Contents read/write for this repository |
| `GITHUB_OWNER` | `JEtechnologies` (optional; this is the default) |
| `GITHUB_REPO` | `NDtourandtravel` (optional; this is the default) |
| `GITHUB_BRANCH` | `main` (optional; this is the default) |

Set the supplied admin ID and password directly in Vercel's encrypted environment settings. Generate `ADMIN_SESSION_SECRET` with a password manager or a secure random generator. After adding the variables, redeploy the site. `/admin` opens the login page; the API returns a setup message until these variables are available. The GitHub token stays in the server environment and is used only by the protected save and image upload endpoints.

## Booking enquiries

The form validates the journey details and prepares a WhatsApp message. Customers must select **Continue on WhatsApp** and send the message to the business. The website does not send email or store enquiry details. Availability and bookings are confirmed directly by the team.

## Deployment

Upload the contents of `website/` to your hosting web root and enable HTTPS. Configure missing pages to serve `404.html` with HTTP status 404.

Before going live, confirm the purchased domain and update the canonical URL, Open Graph URL and structured-data URL in `website/index.html`, plus `website/robots.txt` and `website/sitemap.xml`. The existing domain strings must be verified against the actual hosting domain. Include service-page URLs in the sitemap when configuring production SEO.

## Business contact

- Phone: +91-9896547757
- Email: naagar.travels7757@gmail.com
- Address: 205/7, Gandhi Nagar,Ram Nagar karnal, Haryana,132001

## Checks performed

The homepage and eight service enquiry forms were checked in desktop Edge automation at 375, 768 and 1440 pixel widths, including required fields, mobile numbers, past dates, WhatsApp message generation, editing, mobile menus and vehicle selection. Native phone/WhatsApp apps and production hosting require device and deployment checks.
