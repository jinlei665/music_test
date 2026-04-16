# Vue 3 CDN 库

此目录用于存放 Vue 3 及相关库的 CDN 版本。

## 获取 Vue 3

从 CDN 获取 Vue 3.4.21 生产版本：

**选项 1: 官方 CDN**
- 访问 https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.production.min.js
- 保存为 `vue.min.js`

**选项 2: 其他 CDN**
- unpkg: https://unpkg.com/vue@3.4.21/dist/vue.global.js
- cdnjs: https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.21/vue.global.prod.min.js

## 推荐引入方式

在 HTML 中直接引入:

```html
<script src="https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.prod.min.js"></script>
```

## Vue 3 Composition API 示例

```html
<div id="app">
  <h1>{{ message }}</h1>
  <button @click="count++">点击次数: {{ count }}</button>
</div>

<script>
const { createApp, ref, onMounted } = Vue

createApp({
  setup() {
    const message = ref('Hello Vue 3!')
    const count = ref(0)

    onMounted(() => {
      console.log('组件已挂载')
    })

    return { message, count }
  }
}).mount('#app')
</script>
```

## 相关库

- **Pinia** (状态管理): https://cdn.jsdelivr.net/npm/pinia@2.1.7/dist/pinia.iife.prod.js
- **Vue Router**: https://cdn.jsdelivr.net/npm/vue-router@4.2.5/dist/vue-router.global.prod.js
