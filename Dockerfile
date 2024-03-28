FROM alpine:3.18 as alpine
FROM node:21-alpine3.18 as node

# Build libvips
FROM node as node-libvips-dev

RUN apk add --no-cache meson gobject-introspection-dev wget g++ make expat-dev glib-dev python3 libwebp-dev jpeg-dev fftw-dev orc-dev libpng-dev tiff-dev lcms2-dev

ENV VIPS_VERSION=8.15.1

WORKDIR /libvips
RUN wget --quiet https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz
RUN tar xf vips-${VIPS_VERSION}.tar.xz

WORKDIR /libvips/vips-${VIPS_VERSION}
RUN meson setup build-dir --buildtype=release

WORKDIR /libvips/vips-${VIPS_VERSION}/build-dir 
RUN meson compile
RUN meson install

# Copy libvips and install dependencies
FROM alpine as alpine-libvips
RUN apk add --no-cache expat glib libwebp jpeg fftw orc libpng tiff lcms2
COPY --from=node-libvips-dev /usr/local/lib/pkgconfig/vips* /usr/local/lib/pkgconfig/
COPY --from=node-libvips-dev /usr/local/lib/libvips* /usr/local/lib/
COPY --from=node-libvips-dev /usr/local/lib/girepository-1.0/Vips-8.0.typelib /usr/local/lib/girepository-1.0/Vips-8.0.typelib
COPY --from=node-libvips-dev /usr/local/share/gir-1.0/Vips-8.0.gir /usr/local/share/gir-1.0/Vips-8.0.gir
COPY --from=node-libvips-dev /usr/local/bin/vips* /usr/local/bin/
COPY --from=node-libvips-dev /usr/local/include/vips /usr/local/include/vips
COPY --from=node-libvips-dev /usr/local/share/locale/de/LC_MESSAGES/vips* /usr/local/share/locale/de/LC_MESSAGES/
COPY --from=node-libvips-dev /usr/local/share/locale/en_GB/LC_MESSAGES/vips* /usr/local/share/locale/en_GB/LC_MESSAGES/

# Build server and client
FROM node-libvips-dev as build

WORKDIR /app/

COPY ./ /app

RUN npm install && npm run build
RUN cd client && npm install && npm run build

# Build server for production
FROM node-libvips-dev as server-build-production

WORKDIR /app/

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --omit=dev


FROM alpine-libvips

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
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

COPY --from=build /app/client/dist  /app/client/dist
COPY --from=build /app/build /app/build

COPY --from=server-build-production /app/node_modules /app/node_modules

COPY package.json ./
COPY docker/entrypoint.sh /docker/entrypoint.sh

ENV PORT=7481
EXPOSE $PORT

ENV PUID=1000
ENV PGID=1000

RUN groupadd --non-unique --gid 1000 abc
RUN useradd --non-unique --create-home --uid 1000 --gid abc abc

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl ${HOSTNAME}:${PORT}


ENV NODE_ENV=production

ENTRYPOINT  ["sh", "/docker/entrypoint.sh"]