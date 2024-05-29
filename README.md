# MediaTracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bonukai/MediaTracker/blob/main/LICENSE.md) [![Join the chat at https://gitter.im/bonukai/MediaTracker](https://badges.gitter.im/bonukai/MediaTracker.svg)](https://gitter.im/bonukai/MediaTracker?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Crowdin](https://badges.crowdin.net/mediatracker/localized.svg)](https://crowdin.com/project/mediatracker) [![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/bonukai/mediatracker)](https://hub.docker.com/r/bonukai/mediatracker) [![Docker Pulls](https://img.shields.io/docker/pulls/bonukai/mediatracker)](https://hub.docker.com/r/bonukai/mediatracker) [![CodeFactor](https://www.codefactor.io/repository/github/bonukai/mediatracker/badge)](https://www.codefactor.io/repository/github/bonukai/mediatracker) [![codecov](https://codecov.io/gh/bonukai/MediaTracker/branch/main/graph/badge.svg?token=CPMW6R7M1Z)](https://codecov.io/gh/bonukai/MediaTracker)

Self hosted platform for tracking movies, tv shows, video games, books and audiobooks, highly inspired by [flox](https://github.com/devfake/flox)

# Demo

[mediatracker.app](https://mediatracker.app/)\
Username: **demo**\
Password: **demo**

# Development

```bash
npm install
npm run dev

cd client
npm install
npm run dev
```

# Installation

## With docker

### Version Tags

| Tag      | Description     |
| -------- | --------------- |
| latest   | stable releases |
| unstable | pre-releases    |

```bash
docker volume create assets
docker run \
    -d \
    --name mediatracker \
    -p 7481:7481 \
    -v /home/YOUR_HOME_DIRECTORY/.config/mediatracker/data:/storage \
    -v assets:/assets \
    -e TZ=Europe/London \
    bonukai/mediatracker:latest
```

### Parameters

| Parameter   | Function                |
| ----------- | ----------------------- |
| -p 7481     | Port web API            |
| -v /storage | Directory with database |
| -v /assets  | Posters directory       |
| -v /logs    | Logs directory          |

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
      TZ: Europe/London
    image: bonukai/mediatracker:latest

volumes:
  assetsVolume: null
```

### Environment variables

| Name                       | Description                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| DATABASE_CLIENT            | Database client: `SQLite` (default) or `PostgreSQL`                                      |
| DATABASE_CONNECTION_STRING | Database connection string, `postgres://someuser:somepassword@somehost:381/somedatabase` |

# Similar projects

-   [devfake/flox](https://github.com/devfake/flox)
-   [FuzzyGrim/Yamtrack](https://github.com/FuzzyGrim/Yamtrack)
-   [IgnisDa/ryot](https://github.com/IgnisDa/ryot)
-   [krateng/maloja](https://github.com/krateng/maloja)
-   [leepeuker/movary](https://github.com/leepeuker/movary)
-   [MaarifaMaarifa/series-troxide](https://github.com/MaarifaMaarifa/series-troxide)
-   [sbondCo/Watcharr](https://github.com/sbondCo/Watcharr)

#

![TMDB logo](./tmdb_logo.png)
This product uses the TMDB API but is not endorsed or certified by TMDB.
