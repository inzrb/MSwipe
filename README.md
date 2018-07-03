MSwipe
======

>MSwipe是一款移动端滑屏插件，基于Zepto开发，目前支持移动端平台。

* [下载最新版本的MSwipe](https://github.com/inzrb/MSwipe)


### Demos及范例：
* [水平翻屏](https://github.com/inzrb/MSwipe/blob/master/example/swipe_horizontal.html)
* [垂直翻屏](https://github.com/inzrb/MSwipe/blob/master/example/swipe_vertical.html)
* [bounce效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_bounce.html)
* [castor效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_castor.html)
* [cube效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_cube.html)
* [cubein效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_cubein.html)
* [cubesp效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_cubesp.html)
* [ease效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_ease.html)
* [fade效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_fade.html)
* [gule效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_gule.html)
* [normal效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_normal.html)
* [rotate效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_rotate.html)
* [stack效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_stack.html)
* [zoomin效果](https://github.com/inzrb/MSwipe/blob/master/example/effect_zoomin.html)
* [单个轮播图](https://github.com/inzrb/MSwipe/blob/master/example/swipe_slider.html)
* [多个轮播图](https://github.com/inzrb/MSwipe/blob/master/example/swipe_slider_multi.html)
* [节点控制](https://github.com/inzrb/MSwipe/blob/master/example/swipe_control.html)
* [回调函数](https://github.com/inzrb/MSwipe/blob/master/example/swipe_callback.html)
* [节点循环](https://github.com/inzrb/MSwipe/blob/master/example/swipe_loop.html)
* [分页导航](https://github.com/inzrb/MSwipe/blob/master/example/swipe_page.html)
* [进度条1](https://github.com/inzrb/MSwipe/blob/master/example/swipe_process1.html)
* [进度条2](https://github.com/inzrb/MSwipe/blob/master/example/swipe_process2.html)


使用教程
-----------

1. 首先，需要在你的项目中引入 Zepto 库.
   
   你可以通过以下地址
    ```html
    http://zeptojs.com/
    ```
   下载最新版的 `Zepto` .
   `Zepto` 的用法跟 `jQuery` 非常类似。具体可以参考以上官网的API
   然后在页面底部用script标签引入 `Zepto` 
    ```html
    ...
    <script type="text/javascript" src="zepto.min.js"></script>
    </body>
    </html>
    ```

2. 在页面中引入 `MSwipe`  插件.
   ```html
    <script type="text/javascript" src="MSwipe.min.js"></script>
    ```

3.在页面中写入对应的dom结构，以下是范例
    ```html
    <div class="wrap">
        <div class="item item-0">
            <div class="box">
                <h2>页面一</h2>
            </div>
            <!--可自定义背景图-->
            <div class="bg"></div>
        </div>

        <div class="item item-1">
            <div class="box" >
                <h2>页面二</h2>
            </div>
            <div class="bg"></div>
        </div>

        <div class="item item-2">
            <div class="box" >
                <h2>页面三</h2>
            </div>
            <div class="bg"></div>
        </div>

        <div class="item item-3">
            <div class="box" >
                <h2 class="tit_3">页面四</h2>
            </div>
            <div class="bg"></div>
        </div>
    </div>
    ```  
4.在页面上引入对应的样式代码。
    ```css
    html,
    body{height:100%;overflow:hidden;}
    .wrap,
    .item,
    .item .box,
    .item .bg{position:absolute;display:block;top:0;left:0;width:100%;height:100%;}
    ``` 

5. 现在，你可以通过选择器（selector)在页面中调用QSwipe了。
    ```html
    <script type="text/javascript">
    var ms=new MSwipe('.wrap',{
        item:".item",
        mode:"horizontal",
        effect:"bounce"
    });
    </script>
    ```

以上，你可以通过代码包`/example/base.html`查看。

## 常用设置参数 API

初始化MSwipe
```html
new MSwiper(swiperContainer, parameters)- 初始化MSwipe并设置基本参数

```
* swiperContainer - HTML节点或者节点选择器.
* parameters - 传递设置参数的对象

MSwipe参数列表

| 参数 | 类型 | 默认值 | 说明
| --- | --- | --- | ---
| item | string | `'.item'` | 滑屏子节点，可设置HTML节点或者节点选择器
| mode | string | `'vertical'` | 设置滑屏方向,可设置为 `'vertical'`(垂直方向),`'horizontal'`(水平方向)
| loop | boolean | `false` | 设置是否可以循环
| movePercent | number | `0.2` | 移动屏幕百分比,当用户滑动距离到达对应整屏的百分比后，将触发滑动到上一屏或下一屏
| sidePenc | number | `0.4` | 首个或者末尾最大可偏移的范围百分比
| preventMove | boolean | `true` | 阻止事件冒泡，阻止页面默认touchmove行为
| speed | number | `300` | 单位：毫秒，设置滑屏动画的过度时间
| activeClass | string | `'play'` | 激活动画样式名,当前的子节点下会自动添加的class名称
| effect | string | `'normal'` | 默认过渡动画，具体可以参照过渡动画效果列表。
| tranRange | number | `15` | 动画过渡数值，用于设置过渡动画的幅度
| isSpecFx | boolean | `false` | 是否运用特殊动画，仅针对部分过渡动画效果有效，具体可以参照过渡动画效果列表。
| isOpacityChange | boolean | `true` | 设置过渡动画切换过程中是否伴随着透明度变化
| startIndex | number | `0` | 设置默认第几屏开始，默认从第0屏开始
| inter | boolean | `true` | 用户控制并发，避免用户频繁操作，强烈建议开启
| consoleColor | color value | `#2f53d2` | 控制台错误信息输出颜色值
| duration | number | `3000` | 自动循环播放间隔时间，播放下一屏所需的时间
| fullScreen | boolean | `false` | 是否全屏
| noTouch | boolean | `false` | 是否禁止触摸事件

MSwipe方法和属性
方法

| 方法 | 传递参数  | 说明
| --- |  --- | ---
| ms.skipTo | number | 滑屏略过跳转至指定的那一屏，例如从第一屏直接跳到第四屏
| ms.next | null | 跳转至下一屏
| ms.prev | null | 跳转至上一屏
| ms.jumpTo | null | 滑屏按顺序跳转至指定的那一屏，例如从第一屏跳到第四屏，需要先跳到第二屏和第三屏
| ms.play | null | 在轮播图中运用，继续自动循环播放
| ms.pause | null | 在轮播图中运用，暂停循环播放

属性

| 属性 | 类型  | 说明
| --- |  --- | ---
| noTouch | boolean | 是否禁止手势事件
| specFx | boolean | 是否开启特殊效果，根据不同的_transition会有不同的组合效果
| _consoleColor | string | 格式为"color:(颜色值)"
| _container | zepto对象 | 外层包裹容器，可以直接使用zepto方法
| _curElement | zepto对象 | 当前滑屏节点
| _sibElement | zepto对象 | 下一个滑屏节点
| _dirAxes | string | 方向命名空间，取值为"X"或"Y"
| _id | number | id值，每个滑屏都会有一个独立的id
| _index | number | 当前屏的索引，从0开始计数
| _startIndex | number | 开始时候的索引值
| _preIndex | number | 上一屏的索引
| _isTouched | boolean | 是否有按下
| _isV | boolean | 是否是垂直方向
| _width | number | 滑屏模块的宽度
| _height | number | 滑屏模块的宽度
| _items | zepto数组对象 | 所有的滑屏子节点数组
| _lock | boolean | 是否已锁定
| _lock_sp | boolean | 并发处理的锁定属性
| _maxRange | number | 切换上下屏的临界点数值
| _movePenc | number | 切换上下屏的临界点数值占整屏的百分比
| _selector | string | 滑屏子节点的选择器，默认为".item"
| _setting | object | 所有设置项集合，具体可以参照[MSwipe参数列表](https://github.com/inzrb/MSwipe)
| _sideMaxPenc | number | 第一个和最后一个最大可移动的距离占总屏幕百分比
| _size | number | 滑屏子节点个数
| _speed | number | 单位：毫秒，设置touchend事件后过渡动画的速度
| _timer | object | 定时器，可以通过clearTimeout关闭定时器
| _timerStop | boolean | 定时器是否已关闭
| _totalAxes | number | 滑屏模块的宽度或者高度(由方向命名空间`_dirAxes`决定)
| _transition | string | 过渡动画的名称，由setting.effect定义
| _way | string | 滑屏方向，取值可能是`'up'`,`'down'`,`'left'`,`'right'`


回调函数与事件

| 名称 | 传递参数  | 说明
| --- |  --- | ---
| onInitFunc | `index`当前屏幕索引 | 滑屏初始化后执行的回调函数
| onTouchStartFunc | `index`当前屏幕索引，`distX`点击事件的X坐标，`distY`点击事件的Y坐标 | 滑屏点击开始执行的回调函数
| onTouchMoveFunc | `index`当前屏幕索引，`movingPenc`屏幕移动百分比，`distX`点击事件的X坐标，`distY`点击事件的Y坐标 | 滑屏触屏手势移动中执行的回调函数
| onTouchReleaseFunc | `index`当前屏幕索引，`movingPenc`屏幕移动百分比，`distX`点击事件的X坐标，`distY`点击事件的Y坐标 | 滑屏触屏手势离开执行的回调函数
| onTouchEndFunc | `index`当前屏幕索引，`movingPenc`屏幕移动百分比，`distX`点击事件的X坐标，`distY`点击事件的Y坐标 | 滑屏当前节点过渡动画完成后执行的回调函数
| onSliderFunc | `index`当前屏幕索引,`sliderItem`当前滑动的节点,`time`滑屏开始移动的时间 | 轮播模式下滑动过程中执行的回调函数
| onSliderEndFunc | `index`当前屏幕索引 | 轮播模式下滑动结束执行的回调函数



## 默认参数

```js
$.fn.QSwipe.defaults = {
    //滑屏节点
    item: ".item",
    //滑屏方向
    mode: 'vertical',
    //是否可以循环
    loop:false,
    //移动屏幕百分比
    movePercent:"0.2",
    //推动效果程度，仅当effect效果为“ease”时有效,取值在0~1之间，数值越大效果越明显
    pushPercent:0.8,
    //首个或者末尾最大可偏移的范围百分比
    sidePenc:0.4,
    //阻止事件冒泡，阻止页面默认touchmove行为
    preventMove:true,
    //过渡时间
    speed: '300',
    //激活动画样式名
    activeClass:"play",
    //默认为简单过度动画
    effect:"normal",
    //默认动画过渡数值，在xxxEffect函数中判断
    tranRange:"15",
    //结束过渡动画是否复原
    isSpecFx:false,
    //过渡是否产生透明度变化
    isOpacityChange:true,
    //默认第一屏开始,从1开始计算
    startIndex:0,
    //用户控制并发，避免用户频繁操作
    inter:true,
    //错误信息输出颜色值
    consoleColor:"#2f53d2",
    //自动播放循环时间
    duration:3000,
    //是否全屏
    fullScreen:false,
    //是否禁止触摸事件
    noTouch:false
};
```

## 版本更新
0.1  首次发布
* 实现基本功能，搭建插件框架

0.2  更新功能
* 增加"scale"过渡效果
* 优化性能，对手势响应动作进行优化 
* 脱离样式依赖，不需要引入任何CSS文件和样式辅助
* 增加回调函数
* 加入移动屏幕百分比判断机制
* 增加过渡动画时间的设置

0.3  增加转场特效
* 增加"gule"、"fade"、"bounce"、"cubeout"四种过渡效果
* 优化性能，处理手势频繁操作问题
* 增加手势回弹过程中的逻辑处理问题
* 加入移动屏幕百分比判断机制
* 结束过渡动画是否复原
* 保留动画设置延迟时间接口

1.0  正式版本
* 由"QSwipe"正式更名为"MSwipe"
* 增加"cube"、"cubein"、"cubesp"、"scale"、"stack"、"rotate"、"castor"、"zoomin"八种过渡效果，去掉了"cubeout"过渡效果
* 优化性能，增加手机并发操作的处理
* 增加了容错功能，尝试修复提供参数不符合要求的问题，后台智能输出错误提示
* 增加了三个回调函数：onInitFunc、onTouchReleaseFunc、onSliderFunc、onSliderEndFunc，提供更多的回调参数
* 增加了循环功能
* 增加了轮播图功能，包括轮播图自动播放、暂停、跳转等
* 增加了透明度控制

## 联系我

Weibo:[inzrb's Weibo](http://weibo.com/inzrb)
QQ:601346641  Leon.


## 许可 License

Licensed under GPL & MIT  

Copyright (C) 2010-2014 [inzrb's Website] 
