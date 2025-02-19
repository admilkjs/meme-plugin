import globals from 'globals'
import neostandard from 'neostandard'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import stylisticJs from '@stylistic/eslint-plugin'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    files: ['**/*.js'],
    rules: {
      ...neostandard.rules,
      // 禁用单行注释规则，允许使用多行注释
      'line-comment-position': 'off',
      // 强制使用单引号，设置为警告等级
      'quotes': [1, 'single'],
      // 禁用驼峰命名规则，允许使用下划线命名法
      'camelcase': 'off',
      // 禁用等号严格比较规则，允许使用 == 和 != 进行比较
      'eqeqeq': 'off',
      // 禁用优先使用 const 声明变量的规则，允许使用 let 和 var
      'prefer-const': 'off',
      // 要求对象属性的末尾不能有逗号
      'comma-dangle': [1, 'never'],
      // 禁用箭头函数体风格规则，允许使用任意风格
      'arrow-body-style': 'off',
      // 启用缩进规则，要求使用两个空格，并且 switch 语句的 case 子句缩进增加一层
      'indent': [1, 2, { 'SwitchCase': 1 }],
      // 要求函数参数列表前的空格
      'space-before-function-paren': 1,
      // 要求语句末尾不使用分号
      'semi': [1, 'never'],
      // 要求代码中不能有尾随空格
      'no-trailing-spaces': 1,
      // 要求对象字面量大括号内两侧必须有空格
      'object-curly-spacing': [1, 'always'],
      // 使用 simple-import-sort 自动排序 import 语句
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // 要求数组字面量中的方括号内侧有一个空格
      'array-bracket-spacing': [1, 'always'],
      // 逗号前后间距规范
      'comma-spacing': [1, { before: false, after: true }]
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@stylistic/indent': stylisticJs
    }
  }
]
