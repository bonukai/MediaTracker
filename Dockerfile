# Build server and client
FROM node:16-alpine3.16 as build

WORKDIR /app

COPY server/ /app/server
COPY client/ /app/client
COPY rest-api/ /app/rest-api
COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache python3 g++ make
RUN if [[ $(uname -m) == armv7l ]]; then apk add --no-cache vips-dev; fi
RUN npm install
RUN npm run build

# Build server for production
FROM node:16-alpine3.16 as server-build-production

WORKDIR /server
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN apk add --no-cache python3 g++ make
RUN if [[ $(uname -m) == armv7l ]]; then apk add --no-cache vips-dev; fi
RUN npm install --production

FROM node:16-alpine3.16 as node
FROM alpine:3.16

RUN apk add --no-cache curl shadow
RUN if [[ $(uname -m) == armv7l ]]; then apk add --no-cache vips; fi

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
