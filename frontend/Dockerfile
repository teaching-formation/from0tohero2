FROM node:20-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm install

# Code source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
