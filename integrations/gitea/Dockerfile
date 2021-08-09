FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . /app

EXPOSE 7500

CMD ["npm", "start"]
