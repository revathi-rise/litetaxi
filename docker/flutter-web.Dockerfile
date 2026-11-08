# Shared Dockerfile for both Flutter web apps.
# docker build -f docker/flutter-web.Dockerfile --build-arg APP_DIR=apps/customer_flutter --build-arg API_URL=https://api.example.com .
FROM ghcr.io/cirruslabs/flutter:stable AS build
ARG APP_DIR
ARG API_URL
WORKDIR /src
COPY ${APP_DIR}/pubspec.* ./
RUN flutter pub get
COPY ${APP_DIR} .
RUN flutter build web --release --dart-define=API_URL=${API_URL}

FROM nginx:1.27-alpine
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/build/web /usr/share/nginx/html
EXPOSE 80

