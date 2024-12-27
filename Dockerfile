# Build libvips
FROM node:20-alpine3.20 as node-libvips-dev

ENV VIPS_VERSION=8.13.1

RUN apk add --no-cache meson gobject-introspection-dev wget g++ make expat-dev glib-dev python3 libwebp-dev jpeg-dev fftw-dev orc-dev libpng-dev tiff-dev lcms2-dev

WORKDIR /libvips
RUN wget --quiet https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.gz
RUN tar xf vips-${VIPS_VERSION}.tar.gz

WORKDIR /libvips/vips-${VIPS_VERSION}
RUN meson setup build-dir --buildtype=release

WORKDIR /libvips/vips-${VIPS_VERSION}/build-dir 
RUN meson compile
RUN meson install

# Copy libvips and install dependencies
FROM alpine:3.20 as alpine-libvips
COPY --from=node-libvips-dev /usr/local/lib/pkgconfig/vips* /usr/local/lib/pkgconfig/
COPY --from=node-libvips-dev /usr/local/lib/libvips* /usr/local/lib/
COPY --from=node-libvips-dev /usr/local/lib/girepository-1.0/Vips-8.0.typelib /usr/local/lib/girepository-1.0/Vips-8.0.typelib
COPY --from=node-libvips-dev /usr/local/share/gir-1.0/Vips-8.0.gir /usr/local/share/gir-1.0/Vips-8.0.gir
COPY --from=node-libvips-dev /usr/local/bin/vips* /usr/local/bin/
COPY --from=node-libvips-dev /usr/local/include/vips /usr/local/include/vips
COPY --from=node-libvips-dev /usr/local/bin/light_correct /usr/local/bin/light_correct
COPY --from=node-libvips-dev /usr/local/bin/shrink_width /usr/local/bin/shrink_width
COPY --from=node-libvips-dev /usr/local/bin/batch_image_convert /usr/local/bin/batch_image_convert
COPY --from=node-libvips-dev /usr/local/bin/batch_rubber_sheet /usr/local/bin/batch_rubber_sheet
COPY --from=node-libvips-dev /usr/local/bin/batch_crop /usr/local/bin/batch_crop
COPY --from=node-libvips-dev /usr/local/share/locale/de/LC_MESSAGES/vips* /usr/local/share/locale/de/LC_MESSAGES/
COPY --from=node-libvips-dev /usr/local/share/locale/en_GB/LC_MESSAGES/vips* /usr/local/share/locale/en_GB/LC_MESSAGES/
RUN apk add --no-cache expat glib libwebp jpeg fftw orc libpng tiff lcms2


# Build server and client
FROM node-libvips-dev as build

WORKDIR /app

COPY server/ /app/server
COPY client/ /app/client
COPY rest-api/ /app/rest-api
COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache python3 g++ make
RUN npm install
RUN npm run build

# Build server for production
FROM node-libvips-dev as server-build-production

WORKDIR /server
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN apk add --no-cache python3 g++ make
RUN npm install --production

FROM node:20-alpine3.20 as node
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
