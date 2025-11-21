FROM node
WORKDIR .
COPY package* ./
RUN npm install
COPY . .

CMD ["node","post_consumer.js"]
