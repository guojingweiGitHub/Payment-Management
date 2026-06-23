const isDev = process.env.NODE_ENV !== 'production';

const plugins = [];

// 仅在开发环境加载 react-dev-inspector
if (isDev) {
  plugins.push('@react-dev-inspector/babel-plugin');
}

module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-react': {
          development: isDev,
        },
      },
    ],
  ],
  plugins,
};
