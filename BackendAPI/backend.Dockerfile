FROM node
WORKDIR .
COPY package* ./
RUN npm install
COPY . .
EXPOSE 8081
CMD ["npm","run", "start"]