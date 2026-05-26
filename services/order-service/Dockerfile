FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./package/shared/
COPY services/order-service/package*.json ./services/order-service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/order-service/ ./services/order-service/

EXPOSE 4001

CMD ["npm", "run", "container:dev", "--workspace=services/order-service"]
