// grunt中文社区 http://www.gruntjs.org/article/configuring_tasks.html
// Grunt.js 在前端项目中的实战 http://beiyuu.com/grunt-in-action/
// "wrapper"函数(包装函数)
module.exports = function(grunt) {


    //项目和任务配置
    grunt.initConfig({
        // 多个任务可以有多个配置，每个任务可以使用任意的命名'targets'来定义多个任务目标
        //这里的 grunt.file.readJSON就会将我们的配置文件读出，并且转换为json对象
        //然后我们在后面的地方就可以采用pkg.XXX的方式访问其中的数据了
        pkg: grunt.file.readJSON('package.json'),
        // 比如js任务目标用来构建JS代码,css任务目标用来构建CSS代码

//        concat: {
//            dist: {
//                src: ['src/lib/zepto.js', 'src/QSwipe.js'],
//                dest: 'dist/built.js'
//            }
//        },
//		'copy': {
//	      'tpl': {
//	        'files': [{
//	          'expand': true,
//	          'cwd': 'src/tpl/',
//	          'src': ['**'],
//	          'dest': 'dist/tpl/'
//	        }]
//	      }
//	    },
        // minify 代码压缩丑化,可以加md5版本号
        // 文档 https://github.com/gruntjs/grunt-contrib-uglify

        uglify: {
            options: {
                banner: '/*\n' +
                    ' * <%= pkg.name %> <%= pkg.version %>\n' +
                    ' * <%= pkg.description %>\n' +
                    ' *\n' +
                    ' * <%= pkg.homepage %>\n' +
                    ' *\n' +
                    ' * Copyright 2010-<%= grunt.template.today("yyyy") %>, <%= pkg.author %>\n' +
                    ' *\n' +
                    ' * Licensed under <%= pkg.license.join(" & ") %>\n' +
                    ' *\n' +
                    ' * Released on: <%= grunt.template.today("mmmm d, yyyy") %>\n' +
                    '*/\n',
                report: "min",//输出压缩率，可选的值有 false(不输出信息)，gzip
                preserveComments: false //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
            },
            build: {
                src: 'src/<%=pkg.file %>.js',
                dest: 'dist/<%= pkg.file %>.min.js'
            }
        }

//        uglify: {
//            js: {
//				options: {
//                    banner: '/*\n' +
//                        ' * <%= pkg.name %> <%= pkg.version %>\n' +
//                        ' * <%= pkg.description %>\n' +
//                        ' *\n' +
//                        ' * <%= pkg.homepage %>\n' +
//                        ' *\n' +
//                        ' * Copyright 2010-<%= grunt.template.today("yyyy") %>, <%= pkg.author %>\n' +
//                        ' *\n' +
//                        ' * Licensed under <%= pkg.license.join(" & ") %>\n' +
//                        ' *\n' +
//                        ' * Released on: <%= grunt.template.today("mmmm d, yyyy") %>\n' +
//                        '*/\n',
//                    report: "min",//输出压缩率，可选的值有 false(不输出信息)，gzip
//                    preserveComments: 'all' //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
//                },
//                files: [{
//                    expand: true,
//                    cwd: 'src',
//                    src: ['**/*.js', '!**/*-debug.js'],
//                    dest: 'dist',
//                    nonull: true,
//                    ext: '.js'
//                }]
//            }
//        }

        // 监控文件变化并动态执行任务
        // 文档 https://github.com/gruntjs/grunt-contrib-watch
        // 清除中间过渡构建代码

//		cssmin: {
////			combine: {
////		    	files: {
////		      		'path/to/output.css': ['path/to/input_one.css', 'path/to/input_two.css']
////		    	}
////		  	},
//		  	minify: {
//		    	expand: true,
//		    	cwd: '../style/',
//		    	src: ['*.css', '!*.min.css'],
//		    	dest: '../style/',
//		    	ext: '.min.css'
//		  	}
//		}
    });
    // HTML5 Cache Manifest task
    //grunt.loadNpmTasks('grunt-manifest');
    // 加载提供适配任务的插件,提取id和依赖,转化具备完整信息模块
    //grunt.loadNpmTasks('grunt-cmd-transport');
    // 加载提供合并任务的插件,合并模块
    //grunt.loadNpmTasks('grunt-cmd-concat');
    //grunt.loadNpmTasks('grunt-contrib-copy');
    // 加载提供清理任务的插件,将中途过渡阶段的构建代码清除
    //grunt.loadNpmTasks('grunt-contrib-clean');
    // 加载提供丑化任务的插件,将代码混淆,压缩,丑化
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // 加载提供监听任务的插件,一旦开发代码有变动,构建代码相应动态更新
    //grunt.loadNpmTasks('grunt-contrib-watch');
	//grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	//grunt.loadTasks('./tools/task');
	
    // 注册任务,包括默认任务
    grunt.registerTask('default', ['uglify']);

};
