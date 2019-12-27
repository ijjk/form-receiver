#!/bin/bash

PKGDIR="/opt/form-receiver"
CONFDIR="$PKGDIR/config"

if [ -d "/config" ];then
  for i in $CONFDIR/*;do file=${i#/opt/form-receiver/config/}; if [ ! -f "/config/$file" ];then cp "$i" "/config/$file"; fi;done
  rm -rf $CONFDIR
  ln -s /config $CONFDIR
  CONFDIR="/config"
fi

cd /opt/form-receiver
node dist/server.js
