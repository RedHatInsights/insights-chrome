module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);
  const devServer = process.env.DEV_SERVER;
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: '> 0.25%, not dead',
        },
      ],
      [
        '@babel/preset-react',
        ...(devServer
          ? [
              {
                development: !api.env('production'),
                runtime: 'automatic',
              },
            ]
          : []),
      ],
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-syntax-dynamic-import',
      'babel-plugin-lodash',
      ...(devServer ? ['react-refresh/babel'] : []),
    ],
    env: {
      test: {
        plugins: ['babel-plugin-rewire'],
      },
    },
  };
};
