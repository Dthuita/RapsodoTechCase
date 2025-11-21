FROM node
WORKDIR .
COPY package* ./
RUN npm install
COPY . .

CMD ["node","get_consumer.js"]