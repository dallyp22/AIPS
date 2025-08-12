FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i -g pnpm && pnpm i --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node","dist/main.js"]
