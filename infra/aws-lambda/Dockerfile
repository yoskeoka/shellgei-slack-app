# syntax = docker/dockerfile:1.3-labs

ARG FUNCTION_DIR="/function"

FROM node:16.13-buster AS builder

ARG FUNCTION_DIR

RUN <<EOF
    apt update
    apt install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev
EOF

RUN <<EOF
    mkdir -p /.aws-lambda-rie
    curl -Lo /.aws-lambda-rie/aws-lambda-rie \
    https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie
    chmod +x /.aws-lambda-rie/aws-lambda-rie
EOF

WORKDIR ${FUNCTION_DIR}

COPY . ${FUNCTION_DIR}
RUN npm install aws-lambda-ric
RUN npm install
RUN npm run build


FROM theoldmoon0602/shellgeibot:latest
# Include global arg in this stage of the build
ARG FUNCTION_DIR
WORKDIR ${FUNCTION_DIR}

ENV IMG_OUTPUT_DIR=/tmp/images
ENV TEXTIMG_OUTPUT_DIR=${IMG_OUTPUT_DIR}

COPY --from=builder ${FUNCTION_DIR} ${FUNCTION_DIR}
COPY --from=builder ${FUNCTION_DIR}/dist/* ${FUNCTION_DIR}
COPY --from=builder /.aws-lambda-rie/aws-lambda-rie /aws-lambda/aws-lambda-rie

ENV ENVCODE=aws-lambda

# add exec permission to all user
RUN <<EOF
find /usr/local/bin ! -perm -o=x -exec chmod go+x {} \;
chmod -R a+rx /root
EOF

COPY ./infra/aws-lambda/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["app.handler"]
