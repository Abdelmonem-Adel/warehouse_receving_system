# 1️⃣ Base Image
FROM node:18-alpine

# 2️⃣ Set working directory inside container
WORKDIR /app

# 3️⃣ Copy package files first (for caching)
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm install --production

# 5️⃣ Copy project files
COPY . .

# 6️⃣ Expose app port
EXPOSE 5000

# 7️⃣ Start the application
CMD ["npm", "start"]
