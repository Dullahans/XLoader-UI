# Assets 资源目录

此目录用于存放静态资源文件。

## 设备图片

请将设备图片放置于此目录，并在 `index.html` 中更新图片路径。

建议图片规格：
- 尺寸：280 x 200 像素
- 格式：PNG 或 JPG
- 文件名：device_el5000.png

更新方法：
将 `index.html` 中的：
```html
<img src="https://via.placeholder.com/280x200/e2e8f0/64748b?text=EL-5000" alt="设备图片" />
```
替换为：
```html
<img src="assets/device_el5000.png" alt="设备图片" />
```


