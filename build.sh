#!/bin/bash
rm -rf app

rm -rf dist

npm run build:all


mv dist app

cp -rf public app

cp .env app

cp ./yarn.lock app

cp package.json app

cp start.sh app

cp ecosystem.config.js app

zip -r app.zip app/

rm -rf app