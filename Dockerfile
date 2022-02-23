# Build server and client
FROM node:17-alpine as build

WORKDIR /app

COPY server/ /app/server
COPY client/ /app/client
COPY rest-api/ /app/rest-api
COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache python3 g++ make
RUN npm install
RUN npm run build
RUN npm run lint
RUN npm run test

# Build server for production
FROM node:17-alpine as server-build-production
WORKDIR /server
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN apk add --no-cache python3 g++ make
RUN npm install --production

FROM node:17-alpine

RUN apk add --no-cache curl

WORKDIR /storage
WORKDIR /assets

VOLUME /storage
VOLUME /assets

WORKDIR /app

COPY --from=build /app/server/public public
COPY --from=build /app/server/build build
COPY --from=server-build-production /server/node_modules node_modules

ENV PORT=7481
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl ${HOSTNAME}:${PORT}

ENV DATABASE_PATH="/storage/data.db"
ENV ASSETS_PATH="/assets"
ENV LOGS_PATH="/logs"
ENV NODE_ENV=production

CMD [ "node", "build/index.js"]
