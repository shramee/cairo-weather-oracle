FROM python:3.9.13-alpine3.16
WORKDIR /code
RUN apk add gmp-dev g++ gcc
RUN pip3 install ecdsa fastecdsa sympy
RUN pip3 install cairo-lang
EXPOSE 8100
ENV STARKNET_NETWORK=alpha-goerli
ENV STARKNET_WALLET=starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount
# Install node and npm
ENV NODE_VERSION=18.9.0
ENV NVM_DIR=/root/.nvm
RUN mkdir $NVM_DIR
RUN apk add --update nodejs npm
RUN node --version
RUN npm --version