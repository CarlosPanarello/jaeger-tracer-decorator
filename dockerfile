FROM node:10-slim

WORKDIR /app
COPY . /app
RUN npm run build
#ENTRYPOINT [ "/bin/sh", "-c", "while true; do sleep 1; done"]
CMD [ "npm", "start" ]