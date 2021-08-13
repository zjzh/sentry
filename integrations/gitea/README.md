# Run in Docker
docker-compose up
# use -d flag to run in background

# Tear down
docker-compose down

# To re-build
docker-compose build


# Notes:
- Runs a Node + MongoDb microservice on port 7500.
- Oauth flow from Sentry should point to http://localhost:7500. Oauth flow redirects from external service needs to be to http://localhost:7500. This service will save auth info and redirect to the correct page on Sentry.
- Added new UI Component: `configuration-settings`:
    - This fetches data from the microservice onload and will make a POST request onBlur.
    - We can use any component type from the FieldFromConfig component.

- We can have multiple Sentry App installations per organization. This allows us to converge our UI towards the first-party integration UI.
    - We should add a `canAdd` key to the UI schema. The microservice should determine the organization is allowed more installations. We can default to `false` for consistency with our current Sentry Apps.

- Added webhooks for comments:
    - created, edited, deleted
    - Sentry App can subscribe to these events.
