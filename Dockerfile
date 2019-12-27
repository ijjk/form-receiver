FROM node:10-alpine

# install build stuff ( make python2 g++ ) for bcrypt since
# alpine linux doesn't have pre-built bcrypt
RUN apk add git bash make python2 g++
RUN mkdir -p /opt/form-receiver

# install node_modules to tmp so it can be cached
RUN mkdir -p /tmp/form-receiver
COPY package.json /tmp/form-receiver
RUN cd /tmp/form-receiver && yarn install
RUN mv /tmp/form-receiver/node_modules /opt/form-receiver/

COPY . /opt/form-receiver
RUN cd /opt/form-receiver && yarn build
RUN cd /opt/form-receiver && yarn install --prod
RUN rm -rf $(yarn cache dir)

# remove packages from building bcrypt
RUN apk del make python2 g++

COPY docker_startup.sh /form-receiver
RUN chmod +x /form-receiver

VOLUME /config

EXPOSE 3000

CMD [ "/form-receiver" ]