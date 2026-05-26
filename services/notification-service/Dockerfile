FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package*.json ./services/notification-service/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/notification-service/ ./services/notification-service/

CMD ["npm", "run", "container:dev", "--workspace=services/notification-service"]
