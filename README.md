## 简介

[ImgTP](https://imgtp.com/) 是国内一家免费公共图床，基本特性如下

- 图片最大尺寸 `15MB`，每个用户拥有 `30GB` 存储空间
- 图片不压缩画质
- 每日上传不限量

## 插件安装

1. 前往 [ImgTP](https://imgtp.com/) 注册账号

   ![image-20230609234501123](https://blog-1301879085.cos.ap-chengdu.myqcloud.com/image-20230609234501123.png)

2. `GUI` 用户可直接在 `插件设置` 中搜索 `imgtp` 下载安装

   ![image-20230609234536189](https://blog-1301879085.cos.ap-chengdu.myqcloud.com/image-20230609234536189.png)

3. 该插件支持前端接口（Front-End）和后端接口（Back-End）两种上传模式

   - `前端接口`：模拟网页端上传，由于需要获取 Cookie 和登录 Token，上传速度较慢
   - `后端接口`：通过系统后台 API 接口上传，速度较快

   ![image-20230610001114470](https://blog-1301879085.cos.ap-chengdu.myqcloud.com/image-20230610001114470.png)

   由于近期 [ImgTP](https://www.imgtp.com/) 关闭了后端接口（见 [Issue2](https://github.com/Redns/picgo-plugin-imgtp/issues/2)），因此只能使用前端接口上传，平时使用插件时大家可以两个接口都试试，哪个能用用哪个

4. 填写用户名和登录密码，选择上传模式

   ![image-20230610001207033](https://blog-1301879085.cos.ap-chengdu.myqcloud.com/image-20230610001207033.png)

   下方的 Token 用于后端接口模式（Back-End）上传，Cookie 用于前端接口模式（Front-End）上传。Token 和 Cookie 都可以由插件自动获取，无需用户填写。当然，Token 也可以在官网 [设置页面](https://www.imgtp.com/user/settings.html) 找到然后手动填写

   ![image-20230610001534546](https://blog-1301879085.cos.ap-chengdu.myqcloud.com/image-20230610001534546.png)

5. 点击确定，设置完成！

