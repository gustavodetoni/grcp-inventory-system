FROM node:20

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY .env .env

RUN npm install

RUN npx prisma generate

COPY . .

CMD [ "npx", "ts-node", "src/server.ts" ]