FROM node:22-alpine AS frontend-build

WORKDIR /frontend
COPY Beer_Spreadsheet_Frontend/package.json Beer_Spreadsheet_Frontend/package-lock.json* ./
RUN npm install
COPY Beer_Spreadsheet_Frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html
EXPOSE 80
