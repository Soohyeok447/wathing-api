FROM node:18.20.4

WORKDIR /home/wathing-api

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm i drizzle-kit
RUN npx drizzle-kit generate

ENV PORT=3000
ENV TZ=Asia/Seoul

EXPOSE 3000

CMD npx drizzle-kit migrate && npm run start
