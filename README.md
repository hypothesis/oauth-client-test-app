# Hypothesis OAuth Client Test

This is a simple browser-based client for the Hypothesis API.

It demonstrates authenticating a client-side only web app with the API and
performing simple API requests.

## Usage

1. **Create an OAuth Client.** In order to use this app you will need to
   register an OAuth client on the Hypothesis service and get its client ID.

   TODO: Add instructions on _how_ to do that here.

   Register the client's redirect URL as "http://localhost:4000/index.html"
   and its origin as "http://localhost:4000".
2. **Run the app.** Run `./run.sh` to start the app.
3. Browse to http://localhost:4000
4. Paste in your OAuth client ID and click 'Login'.

The OAuth client ID would usually be hardcoded into the app or provided as part
of its configuration when serving it.
