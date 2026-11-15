# Build context: repository root (docker build -f portfolio/Dockerfile .)
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY portfolio/package.json ./
RUN npm install
COPY portfolio/ ./
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
USER node
EXPOSE 5050
CMD ["npm", "run", "start"]
