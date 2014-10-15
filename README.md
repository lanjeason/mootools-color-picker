# Mootools Color Picker

Based on: http://colpick.com/plugin

## API

### 初始化

先实例化 ColorPicker 对象

```
var myPicker = new ColorPicker(element, [options]);
```

options 参数说明：

* color，类型 String，6 位 HEX 值，设定默认选中的颜色，默认 `3289c7`

* showSubmit，类型 Boolean，设定是否显示「筛选」按钮，默认 `不显示`

* submitText，类型 String，定义按钮的文字，默认 `OK`

* height，类型 Number，定义色板的宽高，默认 `156`

* flat，类型 Boolean，如果是 false，色板添加该组件到 body，默认 `true`

* onBeforeShow，回调函数，色板显示前调用

* onShow，回调函数，色板显示后调用

* onHide，回调函数，色板隐藏后调用

* onChange，回调函数，选择颜色后调用

  ```
  function(HEX, RGB, HSB) {}
  ```

* onSubmit，回调函数，确认选择的颜色后调用

  ```
  function(HEX, RGB, HSB) {}
  ```

### submit 确认选择颜色

```
myPicker.clickSubmit();
```
