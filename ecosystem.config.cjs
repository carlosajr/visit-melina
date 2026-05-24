module.exports = {
  apps: [
    {
      name: 'visite-melina-api',
      script: 'dist/main.js',
      cwd: '/home/deploy/visite-melina/apps/backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
