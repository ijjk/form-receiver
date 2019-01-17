module.exports = {
  apps: [
    {
      name: 'form-receiver',
      script: 'index.js',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      watch: true,
      instances: 2,
      autorestart: true,
      exec_mode: 'cluster',
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
