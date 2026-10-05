# IP Address Finder

A React app that looks up any IP address and pins its geolocation on an
interactive map.

## Features

On page load, the app auto-detects the user's own IP address and shows its
location immediately. Users can also manually enter any other IP address to
look it up.

## API integration

The app integrates with the ipapi.co REST API to fetch city, region,
country, ISP, and latitude/longitude coordinates for a given IP. Error
handling is included for failed or invalid lookups, so the app doesn't
crash on a bad IP address.

## Map interaction

The map is built with react-leaflet, and includes smooth "fly-to" animations
so that when a new IP is looked up, the map glides to the new location
instead of jumping instantly.