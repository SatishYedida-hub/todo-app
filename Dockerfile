FROM node:20-alpine

RUN apk add --no-cache ca-certificates

WORKDIR /app

ARG BUILD_SHA=local
ENV BUILD_SHA=$BUILD_SHA

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
