FROM node:22-bookworm-slim

WORKDIR /

WORKDIR /nb

COPY ./web /nb/web
COPY ./circuits /nb/circuits

RUN cd web && \
    npm install

RUN cd web && npm run build

EXPOSE 4173

#CMD ["sleep", "infinity"]
WORKDIR /nb/web
ENV NODE_ENV=production
CMD ["npx", "vite", "preview", "--host", "0.0.0.0"]
