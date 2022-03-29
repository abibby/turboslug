module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:preact/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
    ],
    settings: {
        react: {
            version: '17.0',
        },
    },
    ignorePatterns: ['*.css.d.ts', 'dist/*'],
    rules: {
        '@typescript-eslint/no-unused-vars': [
            1,
            { varsIgnorePattern: '^(h|_.*)$' },
        ],
        'object-shorthand': [2, 'methods'],
        camelcase: 0,
        'react-hooks/rules-of-hooks': 'error',
        'no-undef': 0,
        'no-unused-vars': 0,
    },
}
