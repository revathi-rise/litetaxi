# Build context: repository root  (docker build -f apps/admin/Dockerfile .)
FROM node:20-alpine AS build
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN npm ci --workspace apps/admin --include-workspace-root=false
COPY apps/admin apps/admin
RUN npm run build -w apps/admin

FROM node:20-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/admin ./apps/admin
WORKDIR /repo/apps/admin
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

