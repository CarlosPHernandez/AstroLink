# Apply the expert onboarding migrations

The public apply page and the hours check need two migrations. Apply them on the hosted project before opening `/for-experts` in production.

1. `supabase/migrations/20260924120000_expert_applications_and_hours.sql`
2. `supabase/migrations/20260924120100_expert_application_submitted_email.sql`

Until those run, submitting an application or saving hours returns an error. Existing bookings keep working, because experts with no saved hours are still bookable.

After the migrations:

- Applicants use `/for-experts`.
- An admin approves or declines from the admin dashboard.
- Approve creates an unlisted expert. Listing still requires the existing approved-and-listed check.
- The expert finishes services and hours in the invite setup, or later in settings.
