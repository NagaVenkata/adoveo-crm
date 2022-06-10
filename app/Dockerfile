FROM node:14
RUN mkdir /app
WORKDIR /app
ADD package.json /app/
RUN npm install -g nodemon & npm install
ADD . /app/
COPY . /app/
CMD ["npm","run", "dev"]