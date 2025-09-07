FROM node:18-slim

# Instalar FFmpeg y fonts
RUN apt-get update && apt-get install -y ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

# Crear carpeta de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Ejecutar servidor
CMD ["node", "server.js"]
