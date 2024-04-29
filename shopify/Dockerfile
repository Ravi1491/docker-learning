
FROM node:slim AS node-app
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 3000
CMD ["node", "shopify.js"]
