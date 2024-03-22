FROM ghcr.io/puppeteer/puppeteer:22.4.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app
COPY --chown=pptruser:pptruser package*.json ./
RUN npm ci
COPY --chown=pptruser:pptruser . .
CMD ["npm", "run", "start"]