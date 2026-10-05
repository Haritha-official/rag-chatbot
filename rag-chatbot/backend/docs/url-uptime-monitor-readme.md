# URL Uptime Monitor

A full-stack uptime monitoring app built with React, Node.js, and Express that
tracks website availability and response time.

## Features

The app supports both manual checks and automatic checks every 60 seconds.
Each monitor tracks whether a URL is online, offline, or pending, along with
how long it took to respond.

## API design

The Express backend exposes a REST API with full CRUD operations for
monitors (create, read, update, delete). There's also a dedicated async
endpoint that actively pings a live URL and measures its response time in
real time, rather than relying only on cached status.

## Frontend dashboard

The React dashboard displays live monitor status using color-coded
indicators -- green for online, yellow for pending, red for offline -- along
with relative "last checked" timestamps (e.g. "checked 12 seconds ago")
instead of raw datetimes, to make the dashboard easier to scan at a glance.