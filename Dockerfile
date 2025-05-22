FROM ubuntu:22.04

ENV TimeZone=Asia/Shanghai
# 使用软连接，并且将时区配置覆盖/etc/timezone
RUN ln -snf /usr/share/zoneinfo/$TimeZone /etc/localtime && echo $TimeZone > /etc/timezone

# 添加 Node.js 20.x 的官方源并安装
RUN apt-get update && apt-get install -y tzdata && apt-get install -y ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y \
  nodejs \
  git \
  wget \
  unzip \
  && rm -rf /var/lib/apt/lists/*

# 创建必要的目录
RUN mkdir -p /home/namespace \
  && mkdir -p /home/resources/assets/files

WORKDIR /app

# 复制项目文件
COPY package.json /app/package.json
# 配置 git 用户名和密码
COPY .git-credentials /root/.git-credentials
COPY .gitconfig /root/.gitconfig
COPY ./dist /app
COPY ./public /app/public
COPY .env /app/.env
COPY ./yarn.lock /app/yarn.lock

RUN git config --global credential.helper store

RUN cd /app
# 设置 npm 和 yarn 的镜像，安装全局工具
RUN npm install -g yarn pm2
# 安装依赖
RUN NODE_ENV=development yarn

# 设置环境变量
ENV NODE_ENV=production
# 需要自定义的git账号密码
ENV GIT_USERNAME=name
ENV GIT_PASSWORD=password
ENV GIT_EMAIL=email

# 声明要暴露的端口
EXPOSE 3000

CMD ["node", "/app/src/main.js", "--name", "ops-CD"]


