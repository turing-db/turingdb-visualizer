export default {
  extends: ['stylelint-config-recommended', 'stylelint-config-tailwindcss'],
  rules: {
      'at-rule-no-deprecated': [
      true,
      {
        ignoreAtRules: [
          'apply',
        ],
      },
    ],}
}
