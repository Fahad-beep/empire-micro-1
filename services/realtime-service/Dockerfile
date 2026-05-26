FROM node:20-alpine

WORKDIR /app

COPY package*.json .
COPY packages/shared/package*.json ./packages/shared/
COPY services/realtime-service/package*.json ./services/realtime-service/

RUN npm ci

COPY packages/shared/ ./packages/shared
COPY services/realtime-service ./services/realtime-service

CMD ["npm", "run", "container:dev", "--workspace=services/realtime-service"]