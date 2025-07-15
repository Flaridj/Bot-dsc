FROM node:18-bullseye

# Installer git (nécessaire pour récupérer les dépôts git)
RUN apt-get update && apt-get install -y git

# Configurer git pour forcer l’utilisation de HTTPS (au cas où)
RUN git config --global url."https://github.com/".insteadOf git@github.com:

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
