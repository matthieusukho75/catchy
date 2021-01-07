FROM node:14 as builder

LABEL SIA="chy"
LABEL IRN="72089"
LABEL PROJECT_NAME="CATCHY"
LABEL MAINTAINER="aitslab@renault-digital.com"

ENV TERM=xterm
ENV SIA="chy"
ENV IRN="72089"
ENV APP_NAME="chy-api"

# Create app directory
WORKDIR /usr/src/api

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .
RUN apt-get update && apt-get install -y nano curl postgresql-client wget 

COPY entrypoint.sh /usr/src/api/entrypoint.sh

RUN chmod 777 /usr/src/api/entrypoint.sh

RUN chmod 777 /usr/src/api/sql/scriptSql.sql

RUN ln -s /usr/src/api/entrypoint.sh /

RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["sh","/entrypoint.sh"]

#HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080//api/management/health || exit 1
