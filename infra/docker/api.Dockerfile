FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY services/api/package.json services/api/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json
RUN npm install

COPY packages/shared-contracts packages/shared-contracts
COPY services/api services/api

WORKDIR /app/services/api
RUN npm run prisma:generate
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm start"]
