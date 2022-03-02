# MediaTracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bonukai/MediaTracker/blob/main/LICENSE) [![Crowdin](https://badges.crowdin.net/mediatracker/localized.svg)](https://crowdin.com/project/mediatracker) ![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/bonukai/mediatracker) ![Docker Pulls](https://img.shields.io/docker/pulls/bonukai/mediatracker)

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
    -v /home/YOUR_HOME_DIRECTORY/.config/mediatracker/data:/storage \
    -v assets:/assets \
    -e TMDB_LANG=en \
    -e AUDIBLE_LANG=us \
    bonukai/mediatracker
```

## With docker-compose

```bash
version: "3"
services:
  mediatracker:
    container_name: mediatracker
    ports:
      - 7481:7481
    volumes:
      - /home/YOUR_HOME_DIRECTORY/.config/mediatracker/data:/storage
      - assetsVolume:/assets
    environment:
      SERVER_LANG: en
      TMDB_LANG: en
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
| -v /logs    | Logs directory          |

### Environment variables

| Name               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TMDB_LANG          | ISO 639-1 country code, one of: om, ab, aa, af, sq, am, ar, hy, as, ay, az, ba, eu, bn, dz, bh, bi, br, bg, my, be, km, ca, zh, co, hr, cs, da, nl, en, eo, et, fo, fj, fi, fr, fy, gl, ka, de, el, kl, gn, gu, ha, he, hi, hu, is, id, ia, ie, ik, iu, ga, it, ja, jw, kn, ks, kk, rw, ky, rn, ko, ku, lo, la, lv, ln, lt, mk, mg, ms, ml, mt, mi, mr, mo, mn, na, ne, no, oc, or, ps, fa, pl, pt, pa, qu, rm, ro, ru, sm, sg, sa, gd, sr, sh, st, tn, sn, sd, si, ss, sk, sl, so, es, su, sw, sv, tl, tg, ta, tt, te, th, bo, ti, to, ts, tr, tk, tw, ug, uk, ur, uz, vi, vo, cy, wo, xh, yi, yo, za, zu |
| AUDIBLE_LANG       | ISO 639-1 country code, one of: au, ca, de, es, fr, in, it, jp, gb, us                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| SERVER_LANG        | ISO 639-1 country code, one of: da, de, en, es                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| DATABASE_CLIENT    | Database client: better-sqlite3 or pg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| DATABASE_PATH      | Only for sqlite, path to database                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DATABASE_URL       | Connection string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DATABASE_HOST      | Database host                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DATABASE_PORT      | Database port                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DATABASE_USER      | Database user                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DATABASE_PASSWORD  | Database password                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DATABASE_DATABASE  | Database name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| IGDB_CLIENT_ID     | IGDB API key, needed for game lookup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| IGDB_CLIENT_SECRET | IGDB secret                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# Building docker image

```bash
docker build --tag mediatracker:latest https://github.com/bonukai/MediaTracker.git
docker run -p 7481:7481 mediatracker
```

# Features

- notifications
- calendar
- multiple users
- REST API
- watchlist
- docker image
- import from [Trakt](https://trakt.tv)
- import from [goodreads](https://www.goodreads.com)

# Import

| Service                                | Imported data                                  |
| -------------------------------------- | ---------------------------------------------- |
| [Trakt](https://trakt.tv)              | Watchlist, watched history, ratings            |
| [goodreads](https://www.goodreads.com) | Read, Currently Reading, Want to Read, ratings |

# Metadata providers

| Provider                                                                       | Media type     | Localization |
| ------------------------------------------------------------------------------ | -------------- | :----------: |
| [TMDB](https://www.themoviedb.org/)                                            | movie, tv show |      ✓       |
| [IGDB](https://www.igdb.com/)\*                                                | video game     |      ✗       |
| [Audible API](https://audible.readthedocs.io/en/latest/misc/external_api.html) | audiobooks     |      ✓       |
| [Open Library](https://openlibrary.org/)                                       | books          |      ✗       |

\* IGDB has a limit of 4 requests per second. Because of that IGDB API key is not provided with MediaTracker, it can be acquired [here](https://api-docs.igdb.com/#account-creation) and set in [http://localhost:7481/#/settings/configuration](http://localhost:7481/#/settings/configuration)

# Notification platforms

- [gotify](https://gotify.net)
- [ntfy](https://ntfy.sh)
- [Pushbullet](https://www.pushbullet.com)
- [Pushover](https://pushover.net)
- [Pushsafer](https://www.pushsafer.com)

# Contributors

- [URBANsUNITED](https://github.com/URBANsUNITED) (German translation)
