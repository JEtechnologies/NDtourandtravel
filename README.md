# NDtourandtravel

Responsive website for **N D Tour & Travel**, Karnal, Haryana.

## Website

The deployable website is in `website/`. It includes the homepage, eight service pages, a custom 404 page, mobile navigation, direct call links, Google Maps directions, and validated WhatsApp enquiries.

Open `website/index.html` locally, or serve the `website/` directory with any static web server. No package installation or build step is required.

## Booking enquiries

The form validates the journey details and prepares a WhatsApp message. Customers must select **Continue on WhatsApp** and send the message to the business. The website does not send email or store enquiry details. Availability and bookings are confirmed directly by the team.

## Deployment

Upload the contents of `website/` to your hosting web root and enable HTTPS. Configure missing pages to serve `404.html` with HTTP status 404.

Before going live, confirm the purchased domain and update the canonical URL, Open Graph URL and structured-data URL in `website/index.html`, plus `website/robots.txt` and `website/sitemap.xml`. The existing domain strings must be verified against the actual hosting domain. Include service-page URLs in the sitemap when configuring production SEO.

## Business contact

- Phone: +91-9896547757
- Email: naagar.travels7757@gmail.com
- Address: 205/7 Gandhi Nagar, Karnal, Haryana – 132001

## Checks performed

The homepage and eight service enquiry forms were checked in desktop Edge automation at 375, 768 and 1440 pixel widths, including required fields, mobile numbers, past dates, WhatsApp message generation, editing, mobile menus and vehicle selection. Native phone/WhatsApp apps and production hosting require device and deployment checks.
