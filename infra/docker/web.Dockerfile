FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web-dashboard/package.json apps/web-dashboard/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json
RUN npm install

COPY packages/shared-contracts packages/shared-contracts
COPY apps/web-dashboard apps/web-dashboard

WORKDIR /app/apps/web-dashboard
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
