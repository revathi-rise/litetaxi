# Build context: repository root (docker build -f portfolio/Dockerfile .)
FROM node:20-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY portfolio/package.json portfolio/package.json
RUN npm ci --workspace portfolio --include-workspace-root=false
COPY portfolio portfolio
RUN npm run build -w portfolio

FROM node:20-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/portfolio ./portfolio
WORKDIR /repo/portfolio
USER node
EXPOSE 5050
CMD ["npx", "next", "start", "-p", "5050"]
