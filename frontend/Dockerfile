# base image
FROM node:14

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# copy the rest of the frontend code
COPY . ./

# start the app
CMD ["npm", "start"]
