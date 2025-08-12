FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i -g pnpm && pnpm i --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5173
CMD ["pnpm","preview","--host","0.0.0.0","--port","5173"]
