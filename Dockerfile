FROM node:18-bullseye

# Installer git (au cas où)
RUN apt-get update && apt-get install -y git

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
