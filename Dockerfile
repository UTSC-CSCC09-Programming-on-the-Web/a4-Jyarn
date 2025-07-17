FROM node:20.19.2
WORKDIR /app
COPY . .

RUN npm ci

EXPOSE 3000
CMD ["node", "app.js"]
