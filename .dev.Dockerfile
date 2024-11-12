FROM node:18.20.4

WORKDIR /home/wathing-api

COPY package*.json ./

RUN npm ci

RUN npm i drizzle-kit
RUN npx drizzle-kit generate && npx drizzle-kit migrate

COPY . .

ENV PORT=3000
ENV NODE_ENV=development
ENV TZ=Asia/Seoul

EXPOSE 3000

CMD ["npm", "run", "start"]