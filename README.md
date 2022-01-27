# MediaTracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bonukai/MediaTracker/blob/main/LICENSE) [![Crowdin](https://badges.crowdin.net/mediatracker/localized.svg)](https://crowdin.com/project/mediatracker)

Self hosted platform for tracking movies, tv shows, video games, books and audiobooks, highly inspired by [flox](https://github.com/devfake/flox)

# Demo

[https://mediatracker-bonukai.herokuapp.com](https://mediatracker-bonukai.herokuapp.com)\
Username: **demo**\
Password: **demo**

# API Documentation

[https://bonukai.github.io/MediaTracker/](https://bonukai.github.io/MediaTracker/)

# Installation

## Building from source

```bash
git clone https://github.com/bonukai/MediaTracker.git
cd MediaTracker
npm install
npm run build
npm run start
```

## With docker

```bash
docker volume create assets
docker run \
    -d \
    --name mediatracker \
    -p 7481:7481 \
    -v .config/mediatracker/data:/storage \
    -v assets:/assets \
    -e TMDB_LANG=us \
    -e AUDIBLE_LANG=us \
    bonukai/mediatracker
```

## With docker-compose

```bash
version: "3"
services:
  mediatracker:
    container_name: MediaTracker
    ports:
      - 7481:7481
    volumes:
      - .config/mediatracker/data:/storage
      - assetsVolume:/assets
    environment:
      LANG: en
      TMDB_LANG: us
      AUDIBLE_LANG: us
    image: bonukai/mediatracker

volumes:
  assetsVolume: null
```

### Parameters

| Parameter   | Function                |
| ----------- | ----------------------- |
| -p 7481     | Port web API            |
| -v /storage | Directory with database |
| -v /assets  | Posters directory       |

### Environment variables

| Name              | Description                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| TMDB_LANG         | [ISO 639-1 country code used by TMDB](https://developers.themoviedb.org/3/getting-started/languages) |
| AUDIBLE_LANG      | ISO 639-1 country code used by audible, one of: au, ca, de, fr, in, it, jp, gb, us                   |
| DATABASE_CLIENT   | Database client: better-sqlite3 or pg                                                                |
| DATABASE_PATH     | Only for sqlite, path to database                                                                    |
| DATABASE_URL      | Connection string                                                                                    |
| DATABASE_HOST     | Database host                                                                                        |
| DATABASE_PORT     | Database port                                                                                        |
| DATABASE_USER     | Database user                                                                                        |
| DATABASE_PASSWORD | Database password                                                                                    |
| DATABASE_DATABASE | Database name                                                                                        |

## Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# Building docker image

```bash
docker build --tag mediatracker:latest https://github.com/bonukai/MediaTracker.git
docker run -p 7481:7481 mediatracker
```

# Features

-   notifications
-   calendar
-   multiple users
-   REST API
-   watchlist
-   docker image

# Metadata providers

| Provider                                                                       | Media type     | Localization |
| ------------------------------------------------------------------------------ | -------------- | :----------: |
| [TMDB](https://www.themoviedb.org/)                                            | movie, tv show |      ✓       |
| [IGDB](https://www.igdb.com/)\*                                                | video game     |      ✗       |
| [Audible API](https://audible.readthedocs.io/en/latest/misc/external_api.html) | audiobooks     |      ✓       |
| [Open Library](https://openlibrary.org/)                                       | books          |      ✗       |

\* IGDB has a limit of 4 requests per second. Because of that IGDB API key is not provided with MediaTracker, it can be acquired [here](https://api-docs.igdb.com/#account-creation) and set in `#/settings/metadata-providers-credentials`

# Notification platforms

-   [gotify](https://gotify.net)
-   [ntfy](https://ntfy.sh)
-   [Pushbullet](https://www.pushbullet.com)
-   [Pushover](https://pushover.net)
-   [Pushsafer](https://www.pushsafer.com)
