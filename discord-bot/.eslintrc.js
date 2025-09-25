module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  plugins: ['prettier'],
  rules: {
    // コーディング規約に基づくルール
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // 配列操作の推奨
    'prefer-arrow-callback': 'error',
    'no-loop-func': 'error',
    
    // 条件分岐の推奨
    'eqeqeq': ['error', 'always'],
    'no-negated-condition': 'error',
    
    // Prettierとの競合を避ける
    'prettier/prettier': 'error',
  },

};
