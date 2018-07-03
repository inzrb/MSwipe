;(function($){
    'use strict';

    function MSwipe(el, options) {
        //将插件的默认参数及用户定义的参数合并到一个新的obj里
        this._settings =$.extend({}, $.fn.MSwipe.defaults, options);
        //初始化 MSwipe ID
        this._id = (new Date()).getTime();
        //设置容器
        this._container = $(el);
        //选择器
        this._selector=this._settings.item;
        this._items=$(el).find(this._selector);
        //当前索引
        this._index=this._startIndex=parseInt(this._settings.startIndex);
        this._preIndex=null;
        //初始化宽高
        this._width=this._items.width();
        this._height=this._items.height();
        //滑屏模式
        //滑屏的方向 
        this._isV=this._settings.mode==="vertical";
        //获取模块内可切换的滑屏个数
        this._size=this._items.size();
        

        
        //是否正在触屏中
        this._isTouched = false;
        //过渡的时间间隔
        this._speed= this._settings.speed;
        this._dirAxes =null;
        
        //设置是否禁止手势事件
        this.noTouch=this._settings.noTouch;

        //移动方向
        this._way="";
        //当前节点和兄弟节点
        this._curElement=null;
        this._siblingElement=null;

        //用于控制循环轮播
        this._timer=null;
        this._timerStop=false;

        this._mLocker=false;
        this._mLockerTimer=null;
        this._preCubeTran="";
        this._jumping=false;
        this._sliderMode=false;

        //获取过渡的效果
        this._transition=this._settings.effect;
        //获取滑屏触发移动到下一屏的偏移差值百分比
        //当屏幕偏移量达到这个数值后，手松开屏幕将移动到下一屏，否则，回弹到当前屏幕
        this._movePenc=parseFloat(this._settings.movePercent);
        //设置第一个和最后一个最大可移动的距离
        this._sideMaxPenc=Math.min(0.95,parseFloat(this._settings.sidePenc));
        //每屏过渡总长度
        this._totalAxes=0;
        //是否开启特殊效果，根据不同的_transition会有不同的组合效果
        this.specFx=false;
        //用户处理并发，防止用户操作过于频繁
        this._lock=false;
        //强制触发并发处理
        this._lock_sp=false;
        //控制台输出错误信息的颜色值
        this._consoleColor="color:"+this._settings.consoleColor;
        //最大可偏移范围
        this._maxRange=0;
        //初始化触摸变量
        this._touches = {
            //start只记录变化迁移量，由滑屏的移动方向决定
            start: 0,
            startX: 0,
            startY: 0,
            //current只记录变化迁移量，由滑屏的移动方向决定
            current: 0,
            currentX: 0,
            currentY: 0
        };
        //记录当前的位移变化
        this._positions = {
            current: 0,
            currentX: 0,
            currentY: 0
        };

        //过渡和结束函数名称
        this._moveWithTran=null;
        this._endWithTran=null;



        //执行初始化
        this._init();
        //添加事件
        this._addEvtHandler();
    }

    MSwipe.prototype = {
        _init:function(){
            var self =this;
            var transformInitStyle="";

            //如果_startIndex超出范围后
            if(self._startIndex>=self._size||self._startIndex<0){
                self._startIndex=self._index=0;
                console.info("%c startIndex参数超出范围",self._consoleColor);
            }else if(isNaN(self._startIndex)){
                self._startIndex=self._index=0;
                console.info("%c startIndex参数为非数字",self._consoleColor);
            }
            

            //重置节点
            self._initHtml();

            //初始化样式，将所有内容移动到模块范围外
            if(self._isV){
                //获取方向命名空间以及每屏过渡总长度
                self._totalAxes=self._height;
                self._dirAxes="Y";
            }else{
                self._totalAxes=self._width;
                self._dirAxes="X";
            }

            //计算切换上下屏的临界点
            self._maxRange=self._totalAxes*self._movePenc;

            //父节点添加初始化样式
            self._container.css({
                "position":"relative",
                "overflow":"hidden",
                "width":self._width,
                "height":self._height
            });


            //定义动画效果
            switch (self._transition){

                case "scale":
                    transformInitStyle="scale(1) ";
                    break;
                case "rotate":
                case "zoomin":
                (function(){
                    //外层设置 perspective 以便实现3D旋转
                    self._container.css({
                        "position": "relative",
                        "-webkit-perspective": "1200px"
                    });
                    transformInitStyle="rotate(0) ";
                })();
                    break;
                case "gule":
                case "cube":
                (function(){
                    //外层设置 perspective 以便实现3D旋转
                    self._container.css({
                        "position": "relative",
                        "-webkit-perspective": "1200px"
                    });
                    transformInitStyle="scale(1) rotate(0) ";
                })();
                    break;
                case "bounce":(function(){
                    //外层设置 perspective 以便实现3D旋转
                    self._container.css({
                        "position": "relative",
                        "-webkit-perspective": "1200px"
                    });
                    transformInitStyle="scale(1) ";
                })();
                    break;
            }


            for(var i=0,len=self._size;i<len;i++){
                if(i<self._startIndex){
                    //设置所有节点在下一屏做准备
                    self._items.eq(i).css({
                        "overflow":"hidden",
                        "-webkit-backface-visibility":"hidden",
                        "position":"absolute",
                        "top":"0",
                        "left":"0",
                        "width":"100%",
                        "height":"100%",
                        "-webkit-transform":"translate"+self._dirAxes+"(-100%) "+transformInitStyle
                    });
                }else if(i>self._startIndex){
                    //设置所有节点在下一屏做准备
                    self._items.eq(i).css({
                        "overflow":"hidden",
                        "-webkit-backface-visibility":"hidden",
                        "position":"absolute",
                        "top":"0",
                        "left":"0",
                        "width":"100%",
                        "height":"100%",
                        "-webkit-transform":"translate"+self._dirAxes+"(100%) "+transformInitStyle
                    });
                }
            }
           

            //当前节点初始化
            self._items.eq(self._startIndex).css({
                "-webkit-transform":"translate(0,0) "+transformInitStyle
            });


            //初始化节点内容 
             self._initDom(self._startIndex);

             setTimeout(function(){
                self._items.eq(self._startIndex).addClass(self._settings.activeClass)
             },50);

            //绑定回调事件
            if(self._settings.onInitFunc){
                var bindMoveObj={
                    index:self._index,
                    size:self._size
                };
                self._settings.onInitFunc(bindMoveObj);
            }
           
             if(self._settings.autoPlay){
                 if(!self._settings.loop){
                    console.info("%c loop参数‘"+self._settings.loop+"’没有设置为true，建议设置为true才能实现循环轮播。",self._consoleColor);
                 }else{
                     self.play();
                 }
             }
           
        },

        //html内容初始化
        _initHtml: function(){
            var self=this;
            //复制根节点
            var nodeList=$(self._container).clone();
            
            //清空页面内容
            $(self._container).html("");

            //先获取子元素再执行clone
            self._items=nodeList.children(self._selector);

            //绑定节点序号
            for(var i=0,len=self._items.size();i<len;i++){
                $(self._items[i]).data("index",i);
            }
            
        },

        //初始化节点内容 
        _initDom: function(index){
            var currIndex,
                prevIndex,
                nextIndex;
            //设置第一屏在容器内
            if(this._settings.loop){
                currIndex=index;
                prevIndex=(currIndex+this._size-1)%this._size;
                nextIndex=(currIndex+1)%this._size;
            }else{
               currIndex=index;
               prevIndex=currIndex-1;
               nextIndex=currIndex+1; 
            }

            //将节点放到模块中
            $(this._container).append(this._items[prevIndex]);
            $(this._container).append(this._items[currIndex]);
            $(this._container).append(this._items[nextIndex]);
            
        },

        //绑定事件
        _addEvtHandler: function(){
            var self=this;
            var evtElem=self._settings.fullScreen?$(document):self._container;

            //绑定回调的 Touch Event
            self._container.on('touchstart', function(e){
                self._onTouchStart(e);
            });
            // self._container.on('mousedown', function(e){
            //     self._onTouchStart(e);
            // });
            evtElem.on('touchmove',function(e){
                self._onTouchMove(e);
            });
            evtElem.on('touchend', function(e){
                self._onTouchEnd(e);
            });
            evtElem.on('touchcancel', function(e){
                self._onTouchEnd(e);
            });

            //判断是否阻止浏览器默认行为
            if(self._settings.preventMove){
                evtElem.on('touchmove', function (evt) {
                    // evt.preventDefault();

                    // 判断默认行为是否可以被禁用
                    if (evt.cancelable) {
                        // 判断默认行为是否已经被禁用
                        if (!evt.defaultPrevented) {
                            evt.preventDefault();
                        }
                    }
                });
                var touchElem=self._settings.fullScreen?$("body"):self._container;
                touchElem.css("touch-action","none"); 
            }

            //初始化页面过渡效果
            if(typeof(self._moveWithNormalTran)==="function"){
                self._moveWithTran=self._moveWithNormalTran;
            }
            if(typeof(self._endWithNormalTran)==="function"){
                self._endWithTran=self._endWithNormalTran;
            }

            //定义动画效果
            switch (self._transition){
                case "normal":
                    break;
                case "scale":(function(){
                    if(typeof(self._moveWithScaleTran)==="function"){
                        // 定义触屏过程中时 某个转场效果对应的功能入口
                        self._moveWithTran=self._moveWithScaleTran;
                        // 定义触屏结束时 某个转场效果对应的功能入口
                        self._endWithTran=self._endWithScaleTran;
                    }else{
                        console.info("%c scale效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "fade":(function(){
                    if(typeof(self._moveWithFadeTran)==="function"){
                        self._moveWithTran=self._moveWithFadeTran;
                        self._endWithTran=self._endWithFadeTran;
                    }else{
                        console.info("%c fade效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "ease":(function(){
                    if(typeof(self._moveWithEaseTran)==="function"){
                        self._moveWithTran=self._moveWithEaseTran;
                        self._endWithTran=self._endWithEaseTran;
                    }else{
                        console.info("%c ease效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "bounce":(function(){
                    if(typeof(self._moveWithBounceTran)==="function"){
                        self._moveWithTran=self._moveWithBounceTran;
                        self._endWithTran=self._endWithBounceTran;
                    }else{
                        console.info("%c bounce效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "rotate":(function(){
                    if(typeof(self._moveWithRotateTran)==="function"){
                        self._moveWithTran=self._moveWithRotateTran;
                        self._endWithTran=self._endWithRotateTran;
                    }else{
                        console.info("%c rotate效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "stack":(function(){
                        if(typeof(self._moveWithRotateTran)==="function"){
                            self._isCastorFx=true;
                            self._moveWithTran=self._moveWithRotateTran;
                            self._endWithTran=self._endWithRotateTran;
                        }else{
                            console.info("%c stack效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                        }
                    })();
                        break;
                case "castor":(function(){
                    if(typeof(self._moveWithBounceTran)==="function"){
                        self._isCastorFx=true;
                        self._moveWithTran=self._moveWithBounceTran;
                        self._endWithTran=self._endWithBounceTran;
                    }else{
                        console.info("%c castor效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "gule":(function(){
                    if(typeof(self._moveWithGuleTran)==="function"){
                        self._moveWithTran=self._moveWithGuleTran;
                        self._endWithTran=self._endWithGuleTran;
                    }else{
                        console.info("%c gule效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;   
                case "zoomin":(function(){
                    if(typeof(self._moveWithZoomInTran)==="function"){
                        self._moveWithTran=self._moveWithZoomInTran;
                        self._endWithTran=self._endWithZoomInTran;
                    }else{
                        console.info("%c zoom效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;   
                case "cubein":(function(){
                    if(typeof(self._moveWithCubeInTran)==="function"){
                        self._moveWithTran=self._moveWithCubeInTran;
                        self._endWithTran=self._endWithCubeInTran;
                    }else{
                        console.info("%c cubein效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break; 
                case "cube":
                (function(){
                    if(typeof(self._moveWithCubeTran)==="function"){
                        self._moveWithTran=self._moveWithCubeTran;
                        self._endWithTran=self._endWithCubeTran;
                    }else{
                        console.info("%c cubeout效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                case "cubesp":
                (function(){
                    if(typeof(self._moveWithCubeTran)==="function"){
                        //设置效果开关
                        self._settings.isSpecFx=true;
                        self._moveWithTran=self._moveWithCubeTran;
                        self._endWithTran=self._endWithCubeTran;
                    }else{
                        console.info("%c cubesp效果相关代码没有引入，已默认转换成normal效果，请通过打包工具重新生成js文件。",self._consoleColor);
                    }
                })();
                    break;
                default:
                    console.info("%c '"+self._transition+"'效果输入错误，请检查效果名称是否正确。已默认转换成normal效果。",self._consoleColor);
                    break;       
            }

        },

        //开始触摸时执行函数
        _onTouchStart:function(event) {
            var self=this;


            //判断是否设置并发处理
            if(self._settings.inter){
               self._checkLock();
            }else if(self._lock_sp){
                self._checkLock();
                if(!self._lock){
                    self._lock_sp=false;
                }
            }

            // console.dir(self._settings);
            if(self._settings.autoPlay){
                self._timerStop=true;
                clearTimeout(self._timer);
           }


            //判断状态是否已重置
            if (event.touches.length > 1 ||  self._isTouched || self._lock || self.noTouch ) {
                return;
            }


            
            //获取节点坐标
            var bindStartObj={};
            var page_x = event.targetTouches[0].pageX;
            var page_y = event.targetTouches[0].pageY;

            //记录下开始位置和当前位置的坐标
            self._touches.startX = self._touches.currentX = page_x;
            self._touches.startY = self._touches.currentY = page_y;

            /*记录偏移量的指标*/ 
            //如果为垂直方向只记录纵坐标，如果为水平方向只记录横坐标
            self._touches.start = self._touches.current = event.targetTouches[0]["page"+self._dirAxes];
            //console.dir("start" + _touches.start);

            //绑定当前屏的活动节点
            self._curElement=$(self._items[self._index]);

            //执行回调函数
            if(self._settings.onTouchStartFunc){
                //封装变量
                bindStartObj={
                    index:self._index,
                    size:self._size,
                    distX:page_x,
                    distY:page_y
                };
                self._settings.onTouchStartFunc(bindStartObj);
            }

            //设置触屏状态
            self._isTouched = true;
            

        },


        //触摸进行时执行函数
        _onTouchMove:function(event){
            var self=this;
            var touches=self._touches;
            var positions=self._positions;

             //判断是否为点击或者双手势动作
             if (event.touches.length > 1 || ! self._isTouched || self.noTouch) {
                 return;
             }
             
             if(self._lock){
                return;
            }
            

            //初始化坐标位置
            var deltaVal= 0;
            var bindMoveObj={};
            //_touch用于记录手势的位置，_positions用于记录手势移动过程中的差值
            touches.currentX =  event.targetTouches[0].pageX;
            touches.currentY =  event.targetTouches[0].pageY;
            positions.currentX=touches.currentX-touches.startX;
            positions.currentY=touches.currentY-touches.startY;
            var dx=Math.abs(positions.currentX);
            var dy=Math.abs(positions.currentY);

            //如果手指初始滑动的方向跟页面设置的方向不一致  就不会触发滑动  这个主要是避免误操作, 比如页面是垂直滑动, 在某一页加了横向滑动的局部动画, 那么左右滑动的时候要保证页面不能上下移动
            if(self._dirAxes == 'X'  && dx<dy ) {
                self._lock=true;
                return;
            }else if(dx>dy &&  self._dirAxes == 'Y' ) {
                console.dir("rt");
                self._lock=true;
                return;
            }

            //设置偏移量
            touches.current = touches["current"+self._dirAxes];
            deltaVal =  positions.current= positions["current"+self._dirAxes];
            
            var tempObj=self._refreshElement(deltaVal);
            //当前节点为第一个或者最后一个时，不超出偏移范围
            if(tempObj.limit===0){   
                if(tempObj.dir==1){
                    self._sibTempDist=deltaVal=Math.min(self._maxRange*self._sideMaxPenc,deltaVal);
                }else if(tempObj.dir==-1){
                    self._sibTempDist=deltaVal=Math.max(-self._maxRange*self._sideMaxPenc,deltaVal);
                }
            }

             //绑定回调事件
             if(self._settings.onTouchMoveFunc){
                bindMoveObj={
                    index:self._index,
                    size:self._size,
                    sliderItem:self._siblingElement,
                    movingPenc:Math.abs(deltaVal)/self._totalAxes,
                    way:self._way,
                    distX:positions.currentX,
                    distY:positions.currentY
                };
                self._settings.onTouchMoveFunc(bindMoveObj);
            }

            //设置状态
            self._isMoving = true;
            
            
            //执行过渡动画特效
            self._moveWithTran(deltaVal);

            
         },

         //重置 获取 当前节点和切换的节点内容
         _refreshElement:function(deltaVal,toIndex){
             var self=this;
            //偏移量
            var tempObj = {
                dist: deltaVal,
                dir:0,
                limit: 1
            };
            var myNum=self._index;
            var myInitStyle=null;
            var myTransform="rotate";
            

            //如果自定义toIndex，说明是跳转，调用jumpTo方法
            if((typeof toIndex) !== 'undefined'){
                myNum=toIndex;

                function prevSwipe(){
                    if(self._isV){
                        self._way="down";
                        myInitStyle={
                            "-webkit-transform":"translate3d(0,-100%,0)"
                        };
                        if(self._transition==="cube"){
                            myInitStyle={
                                "-webkit-transform":"translate3d(0,-100%,0) rotateX(-90deg)"
                            };
                        }
                    }else{
                        self._way="right";
                        myInitStyle={
                            "-webkit-transform":"translate3d(-100%,0,0)"
                        };
                        if(self._transition==="cube"){
                            myInitStyle={
                                "-webkit-transform":"translate3d(-100%,0,0) rotateY(-90deg)"
                            };
                        }
                    }
                    $(self._items[myNum]).css(myInitStyle);
                    $(self._container).prepend(self._items[myNum]);
                }
                

                function nextSwipe(){
                    if(self._isV){
                        self._way="up";
                        myInitStyle={
                            "-webkit-transform":"translate3d(0,100%,0)"
                        };
                        if(self._transition==="cube"){
                            myInitStyle={
                                "-webkit-transform":"translate3d(0,100%,0) rotateX(90deg)"
                            };
                        }
                    }else{
                        self._way="left";
                        myInitStyle={
                            "-webkit-transform":"translate3d(100%,0,0)"
                        };
                        if(self._transition==="cube"){
                            myInitStyle={
                                "-webkit-transform":"translate3d(100%,0,0) rotateY(90deg)"
                            };
                        }
                    }
                    $(self._items[myNum]).css(myInitStyle);
                    $(self._container).append(self._items[myNum]);
                }

                if( self._index===0 && toIndex===(self._size-1)  )  {
                    prevSwipe();
                }else if( self._index===(self._size-1) && toIndex===0  ){
                    nextSwipe();
                }else if(toIndex<self._index){
                    prevSwipe();
                }else if(toIndex>self._index){
                    nextSwipe();
                }else{
                    return;
                }
                self._siblingElement = $(self._items[myNum]);
                self._items.css({
                    "z-index":"0"
                });
            }else{
                //定义滑块的移动方向以及给 _siblingElement赋值
                if(tempObj.dist>0){
                    self._way=self._isV?"down":"right";
                    if(self._settings.loop ){
                        self._siblingElement = $(self._items[(myNum+self._size-1)%self._size]);
                    }else{
                        self._siblingElement = $(self._items[myNum-1]);
                    }
                    tempObj.dir=1;
                }else if(tempObj.dist<0){
                    self._way=self._isV?"up":"left";
                    if(self._settings.loop ){
                        self._siblingElement = $(self._items[(myNum+1)%self._size]);
                    }else{
                        self._siblingElement = $(self._items[myNum +1]);
                    }
                    tempObj.dir=-1;
                }
            }



            
            if ( !self._siblingElement || self._siblingElement.size() === 0  ) {
                //如果获取不到 _siblingElement，说明是最后一个并且非循环
                tempObj.limit=0;
            }

            return tempObj;

        },

        // "normal" 转场效果主功能入口
        _moveWithNormalTran: function(deltaVal){
            var curTransformVal,
                sibTransformVal,
                self=this;

            //根据方向实现节点偏移
            switch (self._way){
                case "up":
                case "left":
                (function(){
                    curTransformVal="translate"+self._dirAxes+"("+deltaVal+"px)";
                    sibTransformVal="translate"+self._dirAxes+"("+(deltaVal+self._totalAxes)+"px)";
                })();
                    break;
                case "down":
                case "right":
                (function(){
                    curTransformVal="translate"+self._dirAxes+"("+deltaVal+"px)";
                    sibTransformVal="translate"+self._dirAxes+"("+(deltaVal-self._totalAxes)+"px)";
                })();
                    break;
            }

          
            //设置节点偏移运动
            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform' : curTransformVal
            });

            //如果_siblingElement不为空，则执行动画
            if ( self._siblingElement || self._siblingElement.size()!==0 ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal
                });
            }
            
        },


        //触屏结束时出发转场效果
        _onTouchEnd:function(event){
            //设置点击状态
            this._isTouched = false;
            var self=this;
            var bindMoveObj;

            if(self._settings.autoPlay){
                self._timerStop=false;
                self._timer=setTimeout(function(){
                    self.play();
                },1000);
            }

            //绑定回调事件
            if(self._settings.onTouchReleaseFunc){
                bindMoveObj={
                    index:self._index,
                    size:self._size,
                    sliderItem:self._siblingElement,
                    way:self._way,
                    distX:self._positions.currentX,
                    distY:self._positions.currentY
                };
                self._settings.onTouchReleaseFunc(bindMoveObj);
            }

            //如果仅仅是tap点击则不做处理，除此外就实现平滑过渡
            if ( !this._isMoving ) {
                return;
            }else{
               //调用滑屏结束的函数
                this._endWithTran();
            }
            
        },

        // "normal" 触屏结束时转场效果功能入口
        _endWithNormalTran:function(jumpNum){
            var self=this,
                curElemStyle,
                sibElemStyle,
                canElemMove=false,
                moveDist=0,
                tranStr,
                reg,
                arr,
                actionElemObj={},
                changNum=0,
                match_flag=self._checkSide();
            var tSpeed=parseFloat(self._speed/1000); 
            var elemTransition='-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear';

            if( (typeof jumpNum) !== 'undefined'){
                canElemMove =true;
            }else if(!match_flag || self._settings.loop){
                //判断是否为首末节点
                tranStr=self._siblingElement.css("-webkit-transform");
                reg = /-?(\d|\.|\%)+/gi;
                arr=tranStr.match(reg);
                //获取当前节点偏移的具体位移值
                arr.forEach(function(val) {
                    if(parseFloat(val)!==0  && tranStr.indexOf("100%") == -1 ){
                        moveDist=self._totalAxes-Math.abs(val);
                    }
                });
                canElemMove=moveDist/self._totalAxes>self._movePenc?true:false;
            }else{
                jumpNum=-1;
            }

            
            //判断是翻下一屏还是回退到上一屏
            if(canElemMove){
                switch (self._way){
                    case "up":
                    case "left":
                    (function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate"+self._dirAxes+"(-100%)"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate(0,0)"
                        }
                        changNum=1;
                        self._preIndex=self._index;
                        self._index=(self._index+1)%self._size;
                    })();
                        break;
                    case "down":
                    case "right":
                    (function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate"+self._dirAxes+"(100%)"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate(0,0)"
                        }
                        
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                }
                if((typeof jumpNum) !== 'undefined'){
                    self._index=jumpNum;
                }
               
            
            
            }else{
              
                switch (self._way){
                    case "up":
                    case "left":
                    (function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate(0,0)"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate"+self._dirAxes+"(100%)"
                        }
                    })();
                        break;
                    case "down":
                    case "right":
                    (function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate(0,0)"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate"+self._dirAxes+"(-100%)"
                        }
                    })();
                        break;

                }

            }


            actionElemObj={
                num:changNum,
                dist:moveDist,
                curStyle:curElemStyle,
                sibStyle:sibElemStyle,
                canElemMove:canElemMove,
                jumpNum:jumpNum
            }


            self._endAction(actionElemObj);

            //返回状态以便于对效果进行拓展
            return canElemMove;

        },


        //检查节点是否复原，回到初始位置
        _checkLock: function(){
            var self=this;
            var tempElemDist=-1;

            // console.dir("arr="+self._lock);
            
            // 获取当前节点的位移
            if(self._isV){
                tempElemDist=$(self._items[self._index]).position().top;
            }else{
                tempElemDist=$(self._items[self._index]).position().left;
                
            }

            // console.dir("t="+tempElemDist+",i="+self._index);

            if(tempElemDist===0 || tempElemDist === -self._totalAxes || tempElemDist===self._totalAxes ){
                self._lock=false;
           }else{
                self._lock=true;
           }
           return self._lock;
        },

        //获取是否处于两侧边
        _checkSide: function(){
            var self=this;
            var my_map=[{"way":"down","index":0},{"way":"up","index":self._size-1},{"way":"right","index":0},{"way":"left","index":self._size-1}];
            var match_way=false;
            //遍历内容
            for(var i=0,len=my_map.length;i<len;i++){
                var obj=my_map[i];
                if(obj["way"]==self._way && obj["index"]==self._index){
                    match_way=true;
                    break;
                }
            }
            return match_way;
        },

        _endAction: function(obj){
            var self=this,
            bindEndObj={},
            changNum=obj.num,
            moveDist=obj.dist,
            canElemMove=obj.canElemMove,
            curElemStyle=obj.curStyle,
            sibElemStyle=obj.sibStyle,
            jumpNum=obj.jumpNum;
            

        
            



            //对当前节点设置touch结束后的动作
            self._curElement.css(curElemStyle);

            //设置节点移动后的添加和删除响应的触发类activeClass
            if( self._siblingElement && self._siblingElement.size() !== 0 ){
                //对下一个节点设置动画结束后的动作
                self._siblingElement.css(sibElemStyle);
               
            }

            
               
            //设置延迟执行动作
            if(canElemMove){
                setTimeout(function(){
                    $(self._selector).removeClass(self._settings.activeClass);
                    $(self._siblingElement).addClass(self._settings.activeClass);
                    //执行回调函数
                    //如果不是滑屏轮播模式
                    if(!self._sliderMode){
                        //调用回调函数
                        if(self._settings.onTouchEndFunc){
                            bindEndObj={
                                index:self._index,
                                size:self._size,
                                sliderItem:self._siblingElement,
                                movingPenc:moveDist/self._totalAxes,
                                distX:self._positions.currentX,
                                distY:self._positions.currentY
                            };
                            self._settings.onTouchEndFunc(bindEndObj);
                        }
                    }else{
                        //绑定回调事件
                        if(self._settings.onSliderEndFunc){
                            var bindMoveObj={
                                index:self._index,
                                size:self._size,
                                sliderItem:self._siblingElement
                            };
                            self._settings.onSliderEndFunc(bindMoveObj);
                        }
                    }

                },self._settings.speed);
            }
            
            
            //重置状态以防止并发
            self._isMoving = false;
            

            //只有触发了滑动到上一屏或者下一屏才更新节点
            if(canElemMove){
                self._refreshDom(changNum,jumpNum);
            }
            

        },

        //刷新DOM结构文档
        _refreshDom:function(num,jumpNum){
            var self=this,
            transformInitStyle="",
            removeNum=self._preIndex,
            appendNum=self._index;

            //定义动画效果
            switch (self._transition){

                case "scale":
                    transformInitStyle=" scale(1) ";
                    break;
                case "rotate":
                case "zoomin":
                case "cube":
                (function(){
                    transformInitStyle=" rotate(0) ";
                })();
                    break;
                case "gule":
                (function(){
                    transformInitStyle=" scale(1) rotate(0) ";
                })();
                    break;
                case "bounce":(function(){
                    transformInitStyle=" scale(1) ";
                })();
                    break;
            }



            //判断是否设置了循环
            if(self._settings.loop){
                function initAppendDom(){
                    // $(self._items[(appendNum+self._size+1)%self._size]).css({"-webkit-transform":" translateX(100%) "+transformInitStyle,"-webkit-transition":"none",'-webkit-transform-origin': '0% 50%'});
                    $(self._items[(appendNum+self._size-1)%self._size]).css({"-webkit-transform":" translate"+self._dirAxes+"(100%)"+transformInitStyle,"-webkit-transition":"none"});
                    $(self._items[(appendNum+1)%self._size]).css({"-webkit-transform":" translate"+self._dirAxes+"(100%)"+transformInitStyle,"-webkit-transition":"none"});
                    
                }

                //根据不同方向设置节点
                if(num>0){

                    if(self._preIndex===(appendNum+self._size-1)%self._size){
                        $(self._container).append(self._items[(appendNum+1)%self._size]);
                        setTimeout(function(){
                            $(self._items[(removeNum+self._size-1)%self._size]).remove();
                            initAppendDom();
                        },self._speed);
                    }else if(self._preIndex===(appendNum+self._size-2)%self._size){
                        $(self._container).append(self._items[(appendNum+1)%self._size]);
                        setTimeout(function(){
                            $(self._items[(removeNum+self._size-1)%self._size]).remove();
                            $(self._items[removeNum]).remove();
                            initAppendDom();
                        },self._speed);
                    }else{
                        $(self._container).prepend(self._items[appendNum-1]);
                        $(self._container).append(self._items[(appendNum+1)%self._size]);
                        // $(self._container).prepend(self._items[appendNum]);
                        setTimeout(function(){
                            $(self._items[(removeNum-1+self._size)%self._size]).remove();
                            $(self._items[removeNum]).remove();
                            $(self._items[removeNum+1]).remove();
                            initAppendDom();
                        },self._speed);
                    }

                    // else if(self._preIndex===0){
                        
                    //     $(self._container).append(self._items[(appendNum+self._size-1)%self._size]);
                    //     setTimeout(function(){
                    //         $(self._items[(removeNum+1)%self._size]).remove();
                    //     },self._speed);
                    // }

                    if((typeof jumpNum) !== 'undefined'){
                        self._lock_sp=true;    
                    }
                
                }else if(num<0){

                    if((typeof jumpNum) !== 'undefined'){
                        self._lock_sp=true;    
                    }
                    if(self._preIndex===(appendNum+1)%self._size){
                        
                        $(self._container).prepend(self._items[(appendNum+self._size-1)%self._size]);
                        setTimeout(function(){
                            $(self._items[(removeNum+1)%self._size]).remove();
                            initAppendDom();
                        },self._speed);
                    }else if(self._preIndex===(appendNum+2)%self._size){
                        // $(self._container).prepend(self._items[appendNum]);
                        $(self._container).prepend(self._items[(appendNum+self._size-1)%self._size]);
                        setTimeout(function(){
                            $(self._items[removeNum]).remove();
                            $(self._items[(removeNum+1)%self._size]).remove();
                            initAppendDom();
                        },self._speed);
                    }else{
                        $(self._container).append(self._items[(appendNum+1)%self._size]);
                        // $(self._container).prepend(self._items[appendNum]);
                        $(self._container).prepend(self._items[(appendNum+self._size-1)%self._size]);
                        setTimeout(function(){
                            $(self._items[(removeNum+self._size-1)%self._size]).remove();
                            $(self._items[removeNum]).remove();
                            $(self._items[(removeNum+1)%self._size]).remove();
                            initAppendDom();
                        },self._speed);
                    }

                }
            }else{
                function initAppendDomNoLoop(){
                    $(self._items[appendNum-1]).css({"-webkit-transform":" translate"+self._dirAxes+"(100%)"+transformInitStyle,"-webkit-transition":"none"});
                    $(self._items[appendNum+1]).css({"-webkit-transform":" translate"+self._dirAxes+"(100%)"+transformInitStyle,"-webkit-transition":"none"});
                }
                //如果不循环
                if(num>0){
                    if(self._preIndex===appendNum-1){
                        if(self._size===2){
                            setTimeout(function(){
                                $(self._items[removeNum]).remove();
                            },self._speed);
                        }else{
                            $(self._container).append(self._items[appendNum+1]);
                            setTimeout(function(){
                                $(self._items[removeNum-1]).remove();
                                initAppendDomNoLoop();
                            },self._speed);
                        }


                    }else if(self._preIndex===appendNum-2){
                        
                        $(self._container).append(self._items[appendNum+1]);
                        setTimeout(function(){
                            $(self._items[removeNum-1]).remove();
                            $(self._items[removeNum]).remove();
                            initAppendDomNoLoop();
                        },self._speed);
                    }else{
                        $(self._container).prepend(self._items[appendNum-1]);
                        $(self._container).append(self._items[appendNum+1]);
                        // $(self._container).prepend(self._items[appendNum]);
                        setTimeout(function(){
                            $(self._items[removeNum-1]).remove();
                            $(self._items[removeNum]).remove();
                            $(self._items[removeNum+1]).remove();
                            initAppendDomNoLoop();
                        },self._speed);
                        
                    }

                    if((typeof jumpNum) !== 'undefined'){
                        self._lock_sp=true;    
                    }
                    
                }else if(num<0){

                    if((typeof jumpNum) !== 'undefined'){
                        self._lock_sp=true;    
                    }
                    if(self._preIndex===appendNum+1){
                        $(self._container).prepend(self._items[appendNum-1]);
                        setTimeout(function(){
                            $(self._items[removeNum+1]).remove();
                            initAppendDomNoLoop();
                        },self._speed);
                    }else if(self._preIndex===appendNum+2){
                        $(self._container).prepend(self._items[appendNum-1]);
                        setTimeout(function(){
                            $(self._items[removeNum]).remove();
                            $(self._items[removeNum+1]).remove();
                            initAppendDomNoLoop();
                        },self._speed);
                    }else{
                        if(self._size===2){
                            setTimeout(function(){
                                $(self._items[removeNum]).remove();
                            },self._speed);
                        }else{
                            $(self._container).append(self._items[appendNum+1]);
                            // $(self._container).prepend(self._items[appendNum]);
                            $(self._container).prepend(self._items[appendNum-1]);
                            setTimeout(function(){
                                $(self._items[removeNum-1]).remove();
                                $(self._items[removeNum]).remove();
                                $(self._items[removeNum+1]).remove();
                                initAppendDomNoLoop();
                            },self._speed);
                        }
                        
                    }
                }
            }
        },


        skipTo:function(jNum){
            var self=this;
            var num=parseInt(jNum);
            self._sliderMode=true;
            if(isNaN(num)){
                console.info("%c 跳转页码的参数‘"+jNum+"’为非数字。",self._consoleColor);
                return;
            }else if(num>=self._size){
                console.info("%c 跳转的参数‘"+jNum+"’超出范围，已设置成跳到最后一屏。",self._consoleColor);
                num=self._size-1;
                self._refreshElement(1,num);
            }else if(num<0){
                console.info("%c 跳转的参数‘"+jNum+"’小于0，已设置成跳到第一屏。",self._consoleColor);
                num=0;
            }
            if(num===self._index){
                return;
            }
            self._curElement=$(self._items[self._index]);
            var tempObj=self._refreshElement(self._index-num,num); 
            
            self._isMoving=true;
            //绑定回调事件
            if(self._settings.onSliderFunc){
                var bindMoveObj={
                    index:self._index,
                    size:self._size,
                    sliderItem:self._siblingElement
                };
                self._settings.onSliderFunc(bindMoveObj);
            }
            setTimeout(function(){
                self._endWithTran(num);
            },100);
        },

        next:function(){
            var self=this;
            var nNum=null;
           
            if(self._settings.loop){
                nNum=(self._index+1)%self._size;
            }else{
                nNum=self._index+1===self._size?self._index:self._index+1;
            }

            if(self._jumping){
                self._mLocker=false;
                self.skipTo(nNum);
            }else{
                if(!self._mLocker){
                    self._checkLock();
                }
                if(!self._lock){
                    self.skipTo(nNum);
                    self._lock=true;
                    self._mLocker=true;
                    self._mLockerTimer=setTimeout(function(){
                        self._lock=false;
                        self._mLocker=false;
                    },self._settings.speed*0.8);
                    return;
                }
            }

            
        },

        prev:function(){
            var self=this;
            var nNum=null;
            
            if(self._settings.loop){
                nNum=(self._index+self._size-1)%self._size;
            }else{
                nNum=self._index-1>0?self._index-1:0;
            }

            if(self._jumping){
                self._mLocker=false;
                self.skipTo(nNum);
            }else{
                if(!self._mLocker){
                    self._checkLock();
                }
                if(!self._lock){
                    self.skipTo(nNum);
                    self._lock=true;
                    self._mLocker=true;
                    self._mLockerTimer=setTimeout(function(){
                        self._lock=false;
                        self._mLocker=false;
                    },self._settings.speed*0.8);
                    return;
                }
            }
            
        },

        jumpTo:function(jNum){
            var self=this;
            var distan=0;
            var num=parseInt(jNum);

            if(isNaN(num)){
                console.info("%c 跳转页码的参数‘"+jNum+"’为非数字。",self._consoleColor);
                return;
            }else if(num>=self._size){
                console.info("%c 跳转的参数‘"+jNum+"’超出范围，已设置成跳到最后一屏。",self._consoleColor);
                num=self._size-1;
                self._refreshElement(1,num);
            }else if(num<0){
                console.info("%c 跳转的参数‘"+jNum+"’小于0，已设置成跳到第一屏。",self._consoleColor);
                num=0;
            }
            // console.dir("n="+(num-self._index));
            distan=num-self._index;
            if(distan===0){
                return;
            }
            if(distan>0){
                var timer=0;
                self._jumping=true;
                function nextAct(){
                    self.next();
                    timer++;
                    if(timer===distan){
                        self._jumping=false;
                        return;
                    }
                    setTimeout(function(){
                        nextAct();
                    },self._speed);
                }
                nextAct();
            }else{
                var timer=0;
                self._jumping=true;
                function prevAct(){
                    self.prev();
                    timer++;
                    console.dir("distan="+distan+",timer="+timer);
                    if(timer===Math.abs(distan)){
                        self._jumping=false;
                        return;
                    }
                    setTimeout(function(){
                        prevAct();
                    },self._speed);
                }
                prevAct();
            }
            
        },

        play:function(){
            var self=this;
            function nextAct(){
                if(self._timerStop){
                    clearTimeout(self._timer);
                    return;
                }
                self.next();
                self._timer=setTimeout(nextAct, self._settings.duration);
            }
            if(self._settings.loop){
                if(!self._isTouched){
                    setTimeout(function(){
                        nextAct();
                    }, self._settings.duration);
                }else{
                    clearTimeout(self._timer);
                }
            }else{
                if(self._index+1!==self._size){
                    self._timer=setTimeout(function(){
                        nextAct();
                    }, self._settings.duration);
                }
            }
        },


        pause:function(){
            if(self._timer){
                clearTimeout(self._timer);
            }
        },

        // "ease" 转场效果主功能入口
        _moveWithEaseTran:function (deltaVal){
            var self=this;
            //在 "normal"转场效果基础上增加透明度变化
            self._moveWithNormalTran(deltaVal);
            if(self._settings.isOpacityChange){
                var totalRange=parseFloat(Math.abs(deltaVal)/self._totalAxes);
                self._curElement.css({
                    'opacity' : Math.max(1-totalRange*5/4,0.3),
                    'z-index':"999"
                });
            }else{
                self._curElement.css({
                    'z-index':"999"
                });
            }
            
            if (self._siblingElement &&self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    'opacity' : 1,
                    'z-index':"9"
                });
            }
        },

        // "ease" 触屏结束时转场效果功能入口
        _endWithEaseTran:function (jumpNum){
            var self=this;
            //在 "normal"转场效果基础上变更了过渡时长和时间曲线
            var canElemMove =self._endWithNormalTran(jumpNum),opaVal=1;
            var tSpeed=parseFloat(self._speed/1000); 
            if(self._settings.isOpacityChange){
                opaVal=0;
            }
            if(canElemMove){
                self._curElement.css({
                    '-webkit-transition' : '-webkit-transform '+ tSpeed+'s linear, opacity '+ tSpeed+'s linear',
                    "opacity":opaVal,
                    'z-index':"9"
                });
                if ( self._siblingElement && self._siblingElement.size() !== 0  ) {
                    self._siblingElement.css({
                        '-webkit-transition' : '-webkit-transform '+ tSpeed+'s ease',
                        'opacity':"1",
                        'z-index':"999"
                    });
                }
            }else{
                if ( self._siblingElement && self._siblingElement.size() !== 0  ) {
                    self._siblingElement.css({
                        '-webkit-transition' : '-webkit-transform '+ tSpeed+'s linear, opacity '+ tSpeed+'s linear',
                        'opacity':"1",
                        'z-index':"999"
                    });
                }

            }
            

        },

         // "fade" 转场效果主功能入口
         _moveWithFadeTran:function(deltaVal){
             var self=this;
            //在 "normal"转场效果基础上增加透明度变化
            self._moveWithNormalTran(deltaVal);
            var totalRange=parseFloat(Math.abs(deltaVal)/self._totalAxes);
            self._curElement.css({
                'opacity' : Math.max(1-totalRange*5/4,0.3)
            });
            if (self._siblingElement &&self._siblingElement.size() !== 0  ) {
                if(self._settings.isOpacityChange){
                    self._siblingElement.css({
                        'opacity' : Math.min(1,totalRange*2)
                    });
                }else{
                    self._siblingElement.css({
                        'opacity' : 1
                    });
                }
                
            }

        },

        // "fade" 触屏结束时转场效果功能入口
        _endWithFadeTran:function (jumpNum){
            //调用普通过渡效果
            var canElemMove=this._endWithNormalTran(jumpNum);
            //设置透明度
            if(canElemMove){
                this._curElement.css({
                    "opacity":"0"
                });
                this._siblingElement.css({
                    "opacity":"1"
                });
            }else{
                this._curElement.css({
                    "opacity":"1"
                });
                this._siblingElement.css({
                    "opacity":"0"
                });
            }
            
        },

        // "cube" | "cubesp" 转场效果辅助功能入口
        _moveWithCubeTran:function (deltaVal){
            var self=this,
                curTransformVal,sibTransformVal,curTransOrigin,sibTransOrigin,
                rotatePen,opaVal,totalPenc,
                rotateElem="";
            //计算偏移百分比    
            totalPenc=Math.abs(deltaVal)/self._totalAxes;
            //转化成旋转角度deg
            rotatePen=totalPenc*90;
            //设置透明度
            opaVal=Math.min(totalPenc,0.8);
    

            //设置为正在移动
            self._isMoving = true;

            //根据方向设置偏移量
           
            if(self._way==="up"){
                if(self._settings.isSpecFx){
                    rotateElem=" rotateX(" + (rotatePen-90) + "deg)";
                }
                sibTransOrigin="50% 0%";
                curTransOrigin="50% 100%";
                sibTransformVal= "translate(0,"+(self._totalAxes+deltaVal)+"px) " + rotateElem;
                curTransformVal="translate(0,"+(deltaVal)+"px)  rotateX(" + rotatePen + "deg)";
            }else if(self._way==="down"){
                if(self._settings.isSpecFx){
                    rotateElem=" rotateX(" + (90-rotatePen) + "deg)";
                }
                sibTransOrigin="50% 100%";
                curTransOrigin="50% 0%";
                sibTransformVal= "translate(0,"+(deltaVal-self._totalAxes)+"px) " + rotateElem;
                curTransformVal="translate(0,"+(deltaVal)+"px)  rotateX(" + (-rotatePen) + "deg)";
            }else if(self._way=="left"){
                if(self._settings.isSpecFx){
                    rotateElem=" rotateY(" + (90-rotatePen) + "deg)";
                }
                sibTransOrigin="0% 50%";
                curTransOrigin="100% 50%";
                sibTransformVal= "translate("+(self._totalAxes+deltaVal)+"px,0)"  + rotateElem;
                curTransformVal="translate("+(deltaVal)+"px,0)  rotateY(" + (-rotatePen) + "deg)"; 
            }else if(self._way=="right"){
                if(self._settings.isSpecFx){
                    rotateElem=" rotateY(" + (rotatePen-90) + "deg)";
                }
                sibTransOrigin="100% 50%";
                curTransOrigin="0% 50%";
                sibTransformVal= "translate("+(deltaVal-self._totalAxes)+"px,0)"  + rotateElem;
                curTransformVal="translate("+(deltaVal)+"px,0)  rotateY(" + (rotatePen) + "deg)"; 
            }

            //外层设置 perspective 以便实现3D旋转
            self._container.css({
                "position": "relative",
                "-webkit-perspective": "1200px"
            });

            //设置透明度变化
            if(!self._settings.isOpacityChange){
                opaVal=1;
            }else{
                opaVal=Math.max(1-opaVal,0.6);
            }

            self._preCubeTran=self._curElement.css("-webkit-transform-origin");

            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform' : curTransformVal,
                '-webkit-transform-origin' : curTransOrigin,
                'transform-style': "preserve-3d",
                "z-index":"999",
                'opacity' : "1"
                
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    '-webkit-transform-origin' : sibTransOrigin,
                    "z-index":"9",
                    'opacity' : opaVal
                });
            }
           
        },

        // "cube" | "cubesp" 触屏结束时转场效果功能入口
        _endWithCubeTran:function(jumpNum){
            var curElemStyle,
            self=this,
            sibElemStyle,
            tranStr,
            arr,
            reg,
            moveDist,
            actionElemObj,
            changNum=0,
            canElemMove=false,
            match_flag=self._checkSide();
            var tSpeed=parseFloat(self._speed/1000); 
            var elemTransition='-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear';
            
            //判断是否为首末节点
            if( (typeof jumpNum) !== 'undefined'){
                canElemMove =true;
            }else if(!match_flag || self._settings.loop){
                tranStr=self._siblingElement.css("-webkit-transform");
                reg = /translate\((-?\d+.+?)\)/gi;
                //实现转换 translate(301px, 0px)--> [301,0]
                tranStr.replace(reg,function(a,b){
                    arr=b.replace(/px/gi,"").split(",");
                });
                //获取当前节点偏移的具体位移值 [301,0]--> 301
                arr.forEach(function(val) {
                    if(parseFloat(val)!==0  && tranStr.indexOf("100%") == -1 ){
                        moveDist=self._totalAxes-Math.abs(val);
                    }
                });
                // console.dir("moveDist="+moveDist/_totalAxes+",movePenc="+_movePenc);
                canElemMove=moveDist/self._totalAxes>self._movePenc?true:false;
            }else{
                jumpNum=-1;
            }

            

            if(canElemMove){


                
                if(self._way==="up"){
                    curElemStyle={
                        "-webkit-transform": "translateY(-100%) rotateX(90deg) ",
                        '-webkit-transition' : elemTransition,
                        "z-index":"9",
                        "opacity":"0" 
                    }
                    sibElemStyle={
                        "-webkit-transform":  "translateY(0)  rotateX(0)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '0% 50%',
                        "opacity":1,
                        "z-index":"888",
                    }
                    changNum=1;
                    self._preIndex=self._index;
                    self._index=(self._index+1)%self._size;

                }else if(self._way==="down"){
                    curElemStyle={
                        "-webkit-transform": "translateY(100%) rotateX(-90deg) ",
                        '-webkit-transition' : elemTransition,
                        "z-index":"9",
                        "opacity":"0" 
                    };
                    sibElemStyle={
                        "-webkit-transform":  "translateY(0)  rotateX(0)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '0% 50%',
                        "opacity":1,
                        "z-index":"888",
                    }
                    changNum=-1;
                    self._preIndex=self._index;
                    self._index=(self._index+self._size-1)%self._size;
                }else if(self._way==="left"){
                    curElemStyle={
                        "-webkit-transform": "translateX(-100%) rotateY(-90deg)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '100% 50%',
                        "z-index":"9",
                        "opacity":"1" 
                    };
                    sibElemStyle={
                        "-webkit-transform":  "translateX(0)  rotateY(0)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '0% 50%',
                        "opacity":1,
                        "z-index":"888",
                    }
    
                    changNum=1;
                    self._preIndex=self._index;
                    self._index=(self._index+1)%self._size;
                }else if(self._way==="right"){
                    curElemStyle={
                        "-webkit-transform": "translateX(100%)  rotateY(90deg)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '0% 50%',
                        "z-index":"9",
                        "opacity":"1" 
                    };
                    sibElemStyle={
                        "-webkit-transform":  "translateX(0) rotateY(0)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin' : '100% 50%',
                        "opacity":1,
                        "z-index":"888",
                    }
                    changNum=-1;
                    self._preIndex=self._index;
                    self._index=(self._index+self._size-1)%self._size;
                }
                
                if((typeof jumpNum) !== 'undefined'){
                    self._index=jumpNum;
                }
                
            }else{


                if(self._way==="up"){
                    sibElemStyle={
                        "-webkit-transform":  "translate3d(0,100%,0) rotateX(-90deg)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin':self._preCubeTran,
                        "z-index":"1"
                    }
                    curElemStyle={
                        "-webkit-transform":  "translateY(0) rotateX(0deg) ",
                        '-webkit-transition' : elemTransition,
                        "opacity":1
                    }
                }else if(self._way==="down"){
                    sibElemStyle={
                        "-webkit-transform":  "translate3d(0,-100%,0) rotateX(90deg)",
                        '-webkit-transition' : elemTransition,
                        '-webkit-transform-origin':self._preCubeTran,
                        "z-index":"1"
                    }
                    curElemStyle={
                        "-webkit-transform":  "translateY(0) rotateX(0deg) ",
                        '-webkit-transition' : elemTransition,
                        "opacity":1
                    }
                }else if(self._way==="left"){
                    sibElemStyle={
                        "-webkit-transform":  "translate3d(100%,0,0) rotateY(90deg)",
                        '-webkit-transition' : '-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear',
                        '-webkit-transform-origin':self._preCubeTran
                    }
                    curElemStyle={
                        "-webkit-transform":  "translateX(0) rotateY(0deg) ",
                        '-webkit-transition' : elemTransition,
                        "opacity":1
                    }
                }else if(self._way==="right"){
                    sibElemStyle={
                        "-webkit-transform":  "translate3d(-100%,0,0) rotateY(-90deg)",
                        '-webkit-transition' : '-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear',
                        '-webkit-transform-origin':self._preCubeTran
                    }
                    curElemStyle={
                        "-webkit-transform":  "translateX(0) rotateY(0deg) ",
                        '-webkit-transition' : elemTransition,
                        "opacity":1
                    }
                }
                
                
            }

            actionElemObj={
                num:changNum,
                dist:moveDist,
                curStyle:curElemStyle,
                sibStyle:sibElemStyle,
                canElemMove:canElemMove,
                jumpNum:jumpNum
            }


            self._endAction(actionElemObj);

            //返回状态以便于对效果进行拓展
            return canElemMove;


        },

         // "scale" 转场效果主功能入口
         _moveWithScaleTran:function(deltaVal){
            var self=this,
                curTransformVal,
                sibTransformVal,
                transOrigin,
                opaVal,
                perData=1-Math.abs(deltaVal / self._totalAxes);

            if(self._way==="up"){
                curTransformVal="translate(0, 0) scale(" + perData + ") ";
                sibTransformVal="translate(0,"+(deltaVal+self._totalAxes)+"px)";
                transOrigin="50% 0%";
            }else if(self._way==="down"){
                curTransformVal="translate(0, 0) scale(" +  perData + ") ";
                sibTransformVal="translate(0,"+(deltaVal-self._totalAxes)+"px)";
                transOrigin="50% 100%";
            }else if(self._way==="left"){
                curTransformVal="translate(0, 0) scale(" + perData + ") ";
                sibTransformVal="translate("+(deltaVal+self._totalAxes)+"px,0)";
                transOrigin="0% 50%";
            }else{
                curTransformVal="translate(0, 0) scale(" + perData + ") ";
                sibTransformVal="translate("+(deltaVal-self._totalAxes)+"px,0)";
                transOrigin="100% 50%";
            }

            //根据参数设置透明度是否变化
            if(!self._settings.isOpacityChange){
                opaVal=1;
            }else{
                opaVal= perData;
            }

            //设置当前节点样式
            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform' : curTransformVal,
                '-webkit-transform-origin' : transOrigin,
                'opacity' : opaVal
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    'opacity' : 1
                });
            }

        },

         // "scale" 触屏结束时转场效果功能入口
         _endWithScaleTran:function(jumpNum){
            var self=this,
                curElemStyle,
                sibElemStyle,
                canElemMove,
                moveDist=0,
                transOrigin,
                actionElemObj={},
                tranStr,
                reg,
                val,
                changNum=0,
                match_flag=self._checkSide();
            var tSpeed=parseFloat(self._speed/1000); 
            var elemTransition='-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear';

            //判断是否为首末节点
            if( (typeof jumpNum) !== 'undefined'){
                canElemMove =true;
            }else if(!match_flag || self._settings.loop){
                tranStr=self._curElement.css("-webkit-transform");
                reg = /[^\d|\.]+/gi;
                //scale(0.85)=>0.85
                val=tranStr.replace(reg,"");
                if(1-parseFloat(val)>self._movePenc){
                    canElemMove=true;
                };
            }else{
                jumpNum=-1;
            }

            
            if(canElemMove){
                //判断方向
                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0) translate(0, 0)",
                            "-webkit-transform-origin":"50% 0%",
                            "opacity":"0"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "-webkit-transform-origin":"50% 0%",
                            "opacity":"1"
                        }

                        changNum=1;
                        self._preIndex=self._index;
                        _index=(_index+1)%_size;
                    })();
                        break;
                    case "down":(function(){

                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0) translate(0, 0)",
                            "-webkit-transform-origin":"50% 100%",
                            "opacity":"0"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            "-webkit-transform-origin":"0% 50%",
                            '-webkit-transform': "scale(0) translate(0, 0)",
                            "opacity":"0"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        }
                        self._preIndex=self._index;
                        changNum=1;
                        self._index=(self._index+1)%self._size;
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            "-webkit-transform-origin":"100% 50%",
                            '-webkit-transform': "scale(0) translate(0, 0)",
                            "opacity":"0"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                }

            }else{

                //判断方向
                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 100%)",
                            "-webkit-transform-origin":"50% 0%",
                            "opacity":"0"
                        }
                    })();
                        break;
                    case "down":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, -100%)",
                            "-webkit-transform-origin":"50% 0%",
                            "opacity":"0"
                        }
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(100%,0)",
                            "-webkit-transform-origin":"0% 50%",
                            "opacity":"0"
                        }
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0, 0)",
                            "opacity":"1"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(-100%,0)",
                            "-webkit-transform-origin":"100% 50%",
                            "opacity":"0"
                        }
                    })();
                        break;
                }

            }

            actionElemObj={
                num:changNum,
                dist:moveDist,
                curStyle:curElemStyle,
                sibStyle:sibElemStyle,
                canElemMove:canElemMove,
                jumpNum:jumpNum
            }

            self._endAction(actionElemObj);

            //返回状态以便于对效果进行拓展
            return canElemMove;


        },

        // "rotate" 转场效果主功能入口
        _moveWithRotateTran:function (deltaVal){
            //偏移量
            var self=this,
                curTransformVal,
                sibTransformVal,
                rotVal,opaVal,tmpVal,
                totalAngle=self._totalAxes,
                totalDist=0,
                tempDist=deltaVal*0.5,
                tempObj=self._refreshElement(deltaVal);

            // self._items.css({
            //     "z-index":"0"
            // });

            //缩放量
            tmpVal=parseFloat(Math.abs(deltaVal / self._totalAxes)/4);
            rotVal=Math.max(1 -tmpVal,0.75) ;
            opaVal=Math.max(1 -tmpVal*4,0.3);

            //设置是否为stack效果
            if(!self._settings.isSpecFx){
                // totalAngle=(1-rotVal)*180;
                totalAngle=0;
                totalDist=-deltaVal;
            }else{
                totalAngle=(rotVal-1)*180;
                tempDist=deltaVal*0.2;
                totalDist=deltaVal*0.8;
            }

            if(self._way==="up"){
                curTransformVal="translate3d(0," + tempDist + "px,"+(-totalDist)+"px)"+" rotateX("+(-totalAngle)+"deg)";
                sibTransformVal="translate(0,"+(deltaVal+self._totalAxes)+"px)";
            }else if(self._way==="down"){
                curTransformVal="translate3d(0," + tempDist + "px,"+totalDist+"px)"+" rotateX("+totalAngle+"deg)";
                sibTransformVal="translate(0,"+(deltaVal-self._totalAxes)+"px)";
            }else if(self._way==="left"){
                curTransformVal="translate3d(" + tempDist + "px,0,"+(-totalDist)+"px) rotateY("+totalAngle+"deg)"+" ";
                sibTransformVal="translate("+(deltaVal+self._totalAxes)+"px,0)";
            }else if(self._way==="right"){
                curTransformVal="translate3d(" + tempDist + "px,0,"+totalDist+"px)"+" rotateY("+totalAngle+"deg)"+"  rotateY("+(-totalAngle)+"deg)";
                 sibTransformVal="translate("+(deltaVal-self._totalAxes)+"px,0)";
            }

            //设置是否允许透明度变化
            if(!self._settings.isOpacityChange){
                opaVal=1;
            }

            //设置当前节点样式
            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform':curTransformVal,
                'transform-style': "preserve-3d",
                'opacity' : opaVal,
                'z-index':"9"
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    'transform-style': "preserve-3d",
                    'z-index':"999",
                    "opacity":"1"

                });
            }

        },

        // "rotate" 触屏结束时转场效果功能入口
        _endWithRotateTran:function (jumpNum){
            var self=this,
                curElemStyle,
                sibElemStyle,
                canElemMove=false,
                moveDist=0,
                tranStr,
                reg,
                changNum=0,
                actionElemObj={},
                arr,
                match_flag=self._checkSide(),
                totalDist=self._totalAxes;
                var tSpeed=parseFloat(self._speed/1000); 
                var elemTransition='-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear';
            
            //判断是否为首末节点
            if( (typeof jumpNum) !== 'undefined'){
                canElemMove =true;
            }else if(!match_flag || self._settings.loop){
                tranStr=self._siblingElement.css("-webkit-transform");
                reg = /-?(\d|\.)+/gi;
                //实现转换 translate(301px, 0px)--> [301,0]
                arr=tranStr.match(reg);
                //获取当前节点偏移的具体位移值 [301,0]-->301
                arr.forEach(function(val) {
                    if(parseFloat(val)!==0 && tranStr.indexOf("100%") == -1 ){
                        moveDist=self._totalAxes- Math.abs(val);
                    }
                });
                // console.dir("moveDist="+moveDist/_totalAxes+",movePenc="+_movePenc);
                canElemMove=moveDist/self._totalAxes>self._movePenc?true:false;
            }else{
                jumpNum=-1;
            }

            

            if(!self._settings.isSpecFx){
                totalDist=self._totalAxes;
            }else{
                totalDist=-self._totalAxes;
            }


            if(canElemMove){
                
                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform':"translate3d(0,-100%,"+(-totalDist)+"px) rotateX(-45deg)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate3d(0,0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+1)%self._size;
                        changNum=1;
                    })();
                        break;
                    case "down":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate3d(0,100%,"+(-totalDist)+"px) rotateX(-45deg)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate3d(0,0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "rotateY(-45deg) translate3d(-100%,0,"+(-totalDist)+"px)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "translate3d(0,0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+1)%self._size;
                        changNum=1;
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "rotateY(-45deg) translate3d(100%,0,"+(-totalDist)+"px)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                }


            }else{

                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,100%)",
                            "opacity":"0",
                            'z-index':"0"
                        }
                    })();
                        break;
                    case "down":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,-100%)",
                            "opacity":"0",
                            'z-index':"0"
                        }
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate3d(0,0,0)",
                            "opacity":"1",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate3d(100%,0,0)",
                            "opacity":"0",
                            'z-index':"999"
                        }
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate3d(0,0,0)",
                            "-webkit-pointer-events":"auto",
                            "opacity":"1",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate3d(-100%,0,0)",
                            "-webkit-pointer-events":"none",
                            "opacity":"0",
                            'z-index':"999"
                        }
                    })();
                        break;
                }

                
            }
                
            actionElemObj={
                num:changNum,
                dist:moveDist,
                curStyle:curElemStyle,
                sibStyle:sibElemStyle,
                canElemMove:canElemMove,
                jumpNum:jumpNum
            }

            self._endAction(actionElemObj);

            //返回状态以便于对效果进行拓展
            return canElemMove;
        },

        // "bounce" 转场效果主功能入口
        _moveWithBounceTran:function (deltaVal){
            //偏移量
            var self=this,
                curTransformVal,
                curRotateVal="",
                sibTransformVal,
                sceVal,opaVal,tmpVal;
            var tempObj=self._refreshElement(deltaVal);

            // self._items.css({
            //     // "pointer-events":"none",
            //     "z-index":"0"
            // });

            
                
            //缩放量
            tmpVal=parseFloat(Math.abs(deltaVal / self._totalAxes)/4);
            sceVal=Math.max(1 -tmpVal,0.75) ;
            opaVal=Math.max(1 -tmpVal*4,0.3);

            //设置是否为castor效果
            if(self._isCastorFx){
                if(self._way==="up"){
                    curRotateVal=" rotateX(-"+(1-sceVal)*90+"deg)";
                }else if(self._way==="down"){
                    curRotateVal=" rotateX(-"+(1-sceVal)*90+"deg)";
                }else if(self._way==="left"){
                    curRotateVal=" rotateY("+(1-sceVal)*90+"deg)";
                }else if(self._way==="right"){
                    curRotateVal=" rotateY(-"+(1-sceVal)*90+"deg)";
                }
            }

            if(self._way==="up"){
                curTransformVal="scale(" + sceVal + ") "+curRotateVal;
                sibTransformVal="translate(0,"+(deltaVal+self._totalAxes)+"px)";
            }else if(self._way==="down"){
                curTransformVal="scale(" + sceVal + ")"+curRotateVal;
                sibTransformVal="translate(0,"+(deltaVal-self._totalAxes)+"px)";
            }else if(self._way==="left"){
                curTransformVal="scale(" + sceVal + ")"+curRotateVal;
                    sibTransformVal="translate("+(deltaVal+self._totalAxes)+"px,0)";
            }else if(self._way==="right"){
                curTransformVal="scale(" + sceVal + ")"+curRotateVal;
                    sibTransformVal="translate("+(deltaVal-self._totalAxes)+"px,0)";
            }

            if(!self._settings.isOpacityChange){
                opaVal=1;
            }

            //设置当前节点样式
            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform':curTransformVal,
                'transform-style': "preserve-3d",
                'opacity' : opaVal,
                'z-index':"9"
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    'transform-style': "preserve-3d",
                    'z-index':"999",
                    "opacity":"1"

                });
            }

        },


        // "bounce" 触屏结束时转场效果功能入口
        _endWithBounceTran:function(jumpNum){
            var self=this,
                curElemStyle,
                sibElemStyle,
                canElemMove=false,
                moveDist=0,
                tranStr,
                reg,
                changNum=0,
                actionElemObj={},
                arr,
                match_flag=self._checkSide();
            var tSpeed=parseFloat(self._speed/1000); 
            var elemTransition='-webkit-transform '+ tSpeed+'s linear,opacity  '+ tSpeed+'s linear';
           
            
            //判断是否为首末节点
            if( (typeof jumpNum) !== 'undefined'){
                canElemMove =true;
            }else if(!match_flag || self._settings.loop){
                tranStr=self._siblingElement.css("-webkit-transform");
                reg = /-?(\d|\.)+/gi;
                //实现转换 translate(301px, 0px)--> [301,0]
                arr=tranStr.match(reg);
                //获取当前节点偏移的具体位移值 [301,0]-->301
                arr.forEach(function(val) {
                    if(parseFloat(val)!==0 && tranStr.indexOf("100%") == -1 ){
                        moveDist=self._totalAxes- Math.abs(val);
                    }
                });
                canElemMove=moveDist/self._totalAxes>self._movePenc?true:false;
            }else{
                jumpNum=-1;
            }

            
           
            if(canElemMove){
                
                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0.7) translate(0,0)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+1)%self._size;
                        changNum=1;
                    })();
                        break;
                    case "down":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0.7) translate(0,0)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0.7) translate(0,0)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+1)%self._size;
                        changNum=1;
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(0.7) translate(0,0)",
                            "opacity":"0",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        }
                        self._preIndex=self._index;
                        self._index=(self._index+self._size-1)%self._size;
                        changNum=-1;
                    })();
                        break;
                }


            }else{

                switch (self._way){
                    case "up":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,100%)",
                            "-webkit-pointer-events":"auto",
                            "opacity":"0",
                            'z-index':"0"
                        }
                    })();
                        break;
                    case "down":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"999"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,-100%)",
                            "opacity":"0",
                            'z-index':"0"
                        }
                    })();
                        break;
                    case "left":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "-webkit-pointer-events":"auto",
                            "opacity":"1",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(100%,0)",
                            "opacity":"0",
                            'z-index':"999"
                        }
                    })();
                        break;
                    case "right":(function(){
                        curElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(0,0)",
                            "opacity":"1",
                            'z-index':"9"
                        };
                        sibElemStyle={
                            '-webkit-transition' : elemTransition,
                            '-webkit-transform': "scale(1) translate(-100%,0)",
                            "opacity":"0",
                            'z-index':"999"
                        }
                    })();
                        break;
                }

               
            }
               
            actionElemObj={
                num:changNum,
                dist:moveDist,
                curStyle:curElemStyle,
                sibStyle:sibElemStyle,
                canElemMove:canElemMove,
                jumpNum:jumpNum
            }

            self._endAction(actionElemObj);

            //返回状态以便于对效果进行拓展
            return canElemMove;
        },

        // "zoomin" 转场效果主功能入口
        _moveWithZoomInTran:function(deltaVal){

            //偏移量
            var self=this,
                curTransformVal,
                sibTransformVal,opaVal,guleVal,degVal,rotatingVal,transOrigin;
            var tempObj=self._refreshElement(deltaVal);


            // self._items.css({
            //     "z-index":"0"
            // });
                
            //缩放量
            guleVal=parseFloat(Math.abs(deltaVal / self._totalAxes)/6);
            opaVal=Math.max(1-guleVal*8,0.5);
            degVal=parseInt(self._settings.tranRange)||20;
            rotatingVal=Math.min((1-opaVal)*degVal,80);

            //设置透明度变化
            if(!self._settings.isOpacityChange){
                opaVal=1;
            }

            if(self._way==="up"){
                transOrigin="50% 0%";
                sibTransformVal="translate(0,"+(self._totalAxes+deltaVal)+"px)";
                curTransformVal="translate3d(0," + (-deltaVal*0.4) + "px,"+deltaVal*0.6+"px)";
            }else if(self._way==="down"){
                transOrigin="50% 100%";
                sibTransformVal="translate(0,"+(deltaVal-self._totalAxes)+"px)";
                curTransformVal="translate3d(0," + deltaVal*0.4 + "px,"+-deltaVal*0.6+"px)";
            }else if(self._way=="left"){
                transOrigin="0% 50%";
                sibTransformVal="translate("+(self._totalAxes+deltaVal)+"px,0)";
                curTransformVal="rotate(" + guleVal*6*30 + "deg) scale("+ (1-Math.abs(deltaVal / self._totalAxes))+")"; 
            }else if(self._way=="right"){
                transOrigin="100% 50%";
                sibTransformVal="translate("+(deltaVal-self._totalAxes)+"px,0)";
                curTransformVal="rotate(" + guleVal*6*30 + "deg) scale("+ (1-Math.abs(deltaVal / self._totalAxes))+")"; 
            }

            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform' : curTransformVal,
                '-webkit-transform-origin' : transOrigin,
                'transform-style': "preserve-3d",
                "z-index":"9",
                'opacity' : opaVal
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    "z-index":"999",
                    'opacity' : "1"
                });
            }


        },

        // "zoom" 触屏结束时转场效果功能入口
        _endWithZoomInTran:function(jumpNum){

                var self=this,
                curElemStyle,
                sibElemStyle,
                sibTransOrigin,
                curTransOrigin,
                sibTransformVal,
                rotateElem,
                rotatePen,
                curTransformVal,
                sibTransformVal,
                canElemMove=self._endWithNormalTran(jumpNum);
                var deltaVal=0;

                if(canElemMove){

                    if(self._way==="up"){
                        curElemStyle={
                            "-webkit-transform": "translate3d(0,-"+self._totalAxes*0.2+"px,-"+self._totalAxes*0.8+"px)",
                            "opacity":"0",
                            "transition-timing-function":"ease" 
                        };
                        sibElemStyle={
                            "-webkit-transform": "translate3d(0,0,0)",
                            "opacity":1,
                            "transition-timing-function":"ease" 
                        }
                    }else if(self._way==="down"){
                        curElemStyle={
                            "-webkit-transform": "translate3d(0,"+self._totalAxes*0.2+"px,-"+self._totalAxes*0.8+"px)",
                            "opacity":"0",
                            "transition-timing-function":"ease-out" 
                        };
                        sibElemStyle={
                            "-webkit-transform": "translate3d(0,0,0)",
                            "opacity":1,
                            "transition-timing-function":"ease-out" 
                        }
                    }else if(self._way=="left"){
                        if(self._settings.isSpecFx){
                            rotateElem=" rotateY(" + (90-rotatePen) + "deg)";
                        }
                        sibTransOrigin="0% 50%";
                        curTransOrigin="100% 50%";
                        sibTransformVal= "translate("+(self._totalAxes+deltaVal)+"px,0)"  + rotateElem;
                        curTransformVal="translate("+(deltaVal)+"px,0)  rotateY(" + (-rotatePen) + "deg)"; 
                    }else if(self._way=="right"){
                        if(self._settings.isSpecFx){
                            rotateElem=" rotateY(" + (rotatePen-90) + "deg)";
                        }
                        sibTransOrigin="100% 50%";
                        curTransOrigin="0% 50%";
                        sibTransformVal= "translate("+(deltaVal-self._totalAxes)+"px,0)"  + rotateElem;
                        curTransformVal="translate("+(deltaVal)+"px,0)  rotateY(" + (rotatePen) + "deg)"; 
                    }


                    
            }
            
            self._curElement.css(curElemStyle);
            self._siblingElement.css(sibElemStyle);
        },

        // "gule" 转场效果主功能入口
        _moveWithGuleTran:function(deltaVal){

            //偏移量
            var self=this,
                curTransformVal,
                sibTransformVal,
                opaVal,
                guleVal,
                degVal,
                rotatingVal,
                transOrigin;
            var tempObj=self._refreshElement(deltaVal);
                
            //缩放量
            guleVal=parseFloat(Math.abs(deltaVal / self._totalAxes)/6);
            opaVal=Math.max(1-guleVal*8,0.5);
            degVal=parseInt(self._settings.tranRange)||20;
            rotatingVal=Math.min((1-opaVal)*degVal*4,80);


            self._items.css({
                "z-index":"0"
            });

            //设置透明度变化
            if(!self._settings.isOpacityChange){
                opaVal=1;
            }
            //实现旋转效果
           
            if(self._way==="up"){
                transOrigin="50% 0%";
                sibTransformVal="translate(0,"+(self._totalAxes+deltaVal)+"px)";
                curTransformVal="rotateX(" + (-rotatingVal) + "deg)";
            }else if(self._way==="down"){
                transOrigin="50% 100%";
                sibTransformVal="translate(0,"+(deltaVal-self._totalAxes)+"px)";
                curTransformVal="rotateX(" + rotatingVal + "deg)"; 
            }else if(self._way=="left"){
                transOrigin="0% 50%";
                sibTransformVal="translate("+(self._totalAxes+deltaVal)+"px,0)";
                curTransformVal="rotateY(" + rotatingVal + "deg)"; 
            }else if(self._way=="right"){
                transOrigin="100% 50%";
                sibTransformVal="translate("+(deltaVal-self._totalAxes)+"px,0)";
                curTransformVal="rotateY(" + (-rotatingVal) + "deg)"; 
            }

            self._curElement.css({
                '-webkit-transition' : 'none',
                '-webkit-transform' : curTransformVal,
                '-webkit-transform-origin' : transOrigin,
                'transform-style': "preserve-3d",
                "z-index":"9",
                'opacity' : opaVal
            });

            //设置切换节点样式
            if (self._siblingElement && self._siblingElement.size() !== 0  ) {
                self._siblingElement.css({
                    '-webkit-transition' : 'none',
                    '-webkit-transform' : sibTransformVal,
                    "z-index":"999",
                    'opacity' : "1"
                });
            }

        },


        // "gule" 触屏结束时转场效果功能入口
        _endWithGuleTran:function(jumpNum){

            var self=this,
            curElemStyle,
            sibElemStyle,
            transOrigin,
            canElemMove=self._endWithNormalTran(jumpNum),
            opaVal=1;

            var elemTransition="";
            if(self._isV){
                elemTransition="scale(0.8) rotateX(30deg)";
            }else{
                elemTransition="scale(0.8) rotateY(30deg)";
            } 

            //设置透明度变化
            if(self._settings.isOpacityChange){
                opaVal=0;
            }

            if(self._way==="up"){
                transOrigin="50% 0%";
                // sibTransformVal="translate(0,"+(self._totalAxes+deltaVal)+"px)";
                // curTransformVal="rotateX(" + (-rotatingVal) + "deg)";
            }else if(self._way==="down"){
                transOrigin="50% 100%";
            }else if(self._way=="left"){
                transOrigin="0% 50%";
            }else if(self._way=="right"){
                transOrigin="100% 50%";
            }

            if(canElemMove){
                if(self._settings.isSpecFx){
                    curElemStyle={
                        "-webkit-transform": elemTransition+" translate3d(0,0,-200px)",
                        "opacity":opaVal,
                        '-webkit-transform-origin' : transOrigin,
                        "transition-timing-function":"ease",
                        "z-index":"9"
                    };
                    sibElemStyle={
                        "-webkit-transform": "scale(1) rotate(0) translate3d(0,0,0)",
                        "opacity":1,
                        "z-index":"999",
                        "transition-timing-function":"ease" 
                    }
                }else{
                    curElemStyle={
                        "-webkit-transform": elemTransition,
                        "opacity":opaVal,
                        '-webkit-transform-origin' : transOrigin,
                        "transition-timing-function":"ease",
                        "z-index":"9" 
                    };
                    sibElemStyle={
                        "-webkit-transform": "scale(1)  rotate(0) translate3d(0,0,0)",
                        "opacity":1,
                        "z-index":"999",
                        "transition-timing-function":"ease" 
                    }
                }
                
            }

            
            
            self._curElement.css(curElemStyle);
            self._siblingElement.css(sibElemStyle);
        }



    }


    $.fn.MSwipe = function (options) {
        var options = $.extend({}, $.fn.MSwipe.defaults, options);
        var MSwipe = new MSwipe(this, $.extend(true, {}, options));
        return MSwipe;
    };



    /**
     * 插件的默认值
     * 仅支持节点绑定
     */
    $.fn.MSwipe.defaults = {
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
        //默认没有过度动画
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

    if (typeof module == 'object') {
        module.exports=MSwipe;
    }else {
        window.MSwipe=MSwipe;
    }

})(window.Zepto || window.jQuery);