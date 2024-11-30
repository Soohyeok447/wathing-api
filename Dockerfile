FROM node:18.20.4

WORKDIR /home/wathing-api

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx drizzle-kit generate

RUN npm run build

ENV PORT=3000
ENV NODE_ENV=production
ENV TZ=Asia/Seoul

EXPOSE 3000

CMD ["npm", "run", "start"]
