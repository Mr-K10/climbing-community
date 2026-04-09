# Stage 1: Building the application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (pnpm)
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source code and build
COPY . .

# Pass build-time environment variables (Next.js needs them at build time for some cases)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# Stage 2: Serve the application
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Only copy necessary files for runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
