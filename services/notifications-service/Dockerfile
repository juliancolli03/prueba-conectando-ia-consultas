FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# Asegurar que la carpeta credentials existe
RUN mkdir -p credentials

EXPOSE 4002

CMD ["npm", "start"]