FROM docker.io/library/node:22.22.3-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY angular.json tsconfig*.json .prettierrc .editorconfig ./
COPY src ./src
COPY public ./public
RUN npm run build -- --configuration production

FROM docker.io/library/nginx:1.29.0-alpine
COPY deploy/nginx-main.conf /etc/nginx/nginx.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/portfolioWebsite/browser /usr/share/nginx/html
USER 101
