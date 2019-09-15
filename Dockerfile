FROM node:12.1

WORKDIR /usr/src/app

COPY static /usr/src/app/

RUN npm install && npm audit fix

CMD node bot.js

