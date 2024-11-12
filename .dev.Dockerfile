FROM node:18.20.4

WORKDIR /home/wathing-api

COPY package*.json ./

RUN npm ci

COPY . .

ENV PORT=3000
ENV NODE_ENV=development
ENV TZ=Asia/Seoul

EXPOSE 3000

CMD ["npm", "run", "start"]