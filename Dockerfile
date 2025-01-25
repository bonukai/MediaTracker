# Build libvips
FROM node:20-alpine3.20 AS node-libvips-dev

ENV VIPS_VERSION=8.16.0
ENV VIPS_ARCHIVE_FILENAME=vips-${VIPS_VERSION}.tar.xz
ENV SHARP_FORCE_GLOBAL_LIBVIPS=true

RUN apk add --no-cache meson gobject-introspection-dev wget g++ make python3 
RUN apk add --no-cache expat-dev glib-dev libwebp-dev jpeg-dev fftw-dev orc-dev libpng-dev tiff-dev lcms2-dev

WORKDIR /libvips
WORKDIR /libvips-build

RUN wget --quiet https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/${VIPS_ARCHIVE_FILENAME}
RUN tar xf ${VIPS_ARCHIVE_FILENAME}

WORKDIR /libvips-build/vips-${VIPS_VERSION}

RUN meson setup build-dir --buildtype=release --prefix=/libvips

WORKDIR /libvips-build/vips-${VIPS_VERSION}/build-dir 
RUN meson compile
RUN meson install

ENV PKG_CONFIG_PATH=/libvips/lib/pkgconfig/
RUN pkg-config --modversion vips-cpp | grep ${VIPS_VERSION} -q

# Copy libvips and install it's dependencies
FROM alpine:3.20 AS alpine-libvips

COPY --from=node-libvips-dev /libvips /libvips
RUN apk add --no-cache expat glib libwebp jpeg fftw orc libpng tiff lcms2

# Build server and client
FROM node-libvips-dev AS build

ENV SHARP_FORCE_GLOBAL_LIBVIPS=true

WORKDIR /app

COPY server/ /app/server
COPY client/ /app/client
COPY rest-api/ /app/rest-api
COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache python3 g++ make
RUN npm ci
RUN npm run build

# Build server for production
FROM node-libvips-dev AS server-build-production


WORKDIR /server
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN apk add --no-cache python3 g++ make
RUN npm ci --omit=dev

FROM node:20-alpine3.20 AS node
FROM alpine-libvips

RUN apk add --no-cache curl shadow

WORKDIR /storage
VOLUME /storage

WORKDIR /assets
VOLUME /assets

WORKDIR /logs
VOLUME /logs

WORKDIR /app

COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/lib/ /usr/lib/

COPY --from=build /app/server/public public
COPY --from=build /app/server/build build

COPY --from=server-build-production /server/node_modules node_modules

COPY server/package.json ./
COPY docker/entrypoint.sh /docker/entrypoint.sh

ENV PORT=7481
EXPOSE $PORT

ENV PUID=1000
ENV PGID=1000

RUN groupadd --non-unique --gid 1000 abc
RUN useradd --non-unique --create-home --uid 1000 --gid abc abc

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl ${HOSTNAME}:${PORT}

ENV DATABASE_PATH="/storage/data.db"
ENV ASSETS_PATH="/assets"
ENV LOGS_PATH="/logs"
ENV NODE_ENV=production

ENTRYPOINT  ["sh", "/docker/entrypoint.sh"]
