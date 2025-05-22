module.exports = {
  apps: [
    {
      name: 'ops-service',
      script: './src/main.js',
      env: {
        NODE_ENV: 'production',
        GIT_USERNAME: 'name',
        GIT_PASSWORD: 'password',
        GIT_EMAIL: 'email',
      },
    },
  ],
};
