const Stream = require('stream')
const FormData = require('form-data')

const config = (ctx) => {
    let userConfig = ctx.getConfig('picBed.imgtp')
    if (!userConfig) {
        userConfig = {}
    }
    const config = [
        {
            name: 'account',
            type: 'input',
            alias: '用户名',
            default: userConfig.account || '',
            message: '请填写登录用户名',
            required: true
        },
        {
            name: 'password',
            type: 'password',
            alias: '登录密码',
            default: userConfig.password || '',
            message: '请填写登录密码',
            required: true
        },
        {
            name: 'token',
            type: 'password',
            alias: 'Token',
            default: userConfig.token || '',
            message: '后端上传接口令牌，插件支持自动获取',
            required: false
        },
        {
            name: 'cookie',
            type: 'password',
            alias: 'Cookie',
            default: userConfig.cookie || '',
            message: '插件自动获取，请勿填写',
            required: false
        },
        {
            name: 'mode',
            type: 'list',
            alias: '上传模式',
            choices: ["Front-End", "Back-End"],
            default: userConfig.mode || '',
            message: '请选择上传模式',
            required: true
        }
    ]
    return config
}

/**
 * 登陆令牌获取请求构造
 * @returns 
 */
const loginTokenRequestConstruct = () => {
    return {
        'method': 'GET',
        'url': 'https://www.imgtp.com/auth/login.html',
        'resolveWithFullResponse': true
    }
}   


/**
 * 获取token
 * @param {帐号} email 
 * @param {密码} password 
 */
const backendTokenRequestConstruct = (email, password) => {
    let data = new FormData();
    data.append('email', email);
    data.append('password', password);
    data.append('refresh', '0');

    return {
        method: 'POST',
        maxBodyLength: Infinity,
        url: 'https://www.imgtp.com/api/token',
        headers: { 
            ...data.getHeaders()
        },
        data : data,
        resolveWithFullResponse: true
    };
}


/**
 * 登录请求构造
 * @param {cookie} cookie 
 * @param {登录令牌（附带在登录 html 页面中，动态变化）} loginToken 
 * @param {登录用户名} account 
 * @param {登录密码} password 
 * @returns 
 */
const loginRequestConstruct = (cookie, loginToken, account, password) => {
    return {
        'method': 'POST',
        'url': 'https://www.imgtp.com/auth/login.html',
        'headers': {
            'Cookie': cookie,
            'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
        },
        'resolveWithFullResponse': true,
        'formData': {
          'account': account,
          'password': password,
          '__token__': loginToken
        }
      }
} 

/**
 * 登录令牌解析
 * @param {包含登录请求令牌的字符串} loginTokenString 
 * @returns 
 */
const loginTokenParse = (loginTokenString) => {
    var loginTokenRegex = new RegExp('<input type="hidden" name="__token__" value="\\\w+" />')
    var loginToken = loginTokenString.match(loginTokenRegex)[0].slice(-36, -4)
    if(loginToken) {
        return loginToken;
    }
    else {
        throw new Error('[IMGTP] 获取 loginToken 失败')
    }
}

/**
 * 上传图片请求构造
 * @param {上传模式} uploadMode
 * @param {图片名称} imageName
 * @param {图片数据} imgRawData 
 * @param {令牌} token 
 * @param {PHPSESSID} phpsessid
 * @returns 
 */
const uploadRequestConstruct = (uploadMode, imgName, imgRawData, token, cookie) => {
    switch(uploadMode) {
        case "Front-End":
            let image = new FormData()
            image.append('image', (new Stream.PassThrough().end(imgRawData)), imgName)
            image.append('fileId', imgName)
            image.append('initialPreview', '[]')
            image.append('initialPreviewConfig', '[]')
            image.append('initialPreviewThumbTags', '[]')
            return {
                method: 'POST',
                maxBodyLength: Infinity,
                url: 'https://www.imgtp.com/upload/upload.html',
                headers: { 
                    'X-Requested-With': 'XMLHttpRequest', 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57sec-ch-ua-platform: "Windows"', 
                    'Origin': 'https://www.imgtp.com', 
                    'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"', 
                    'sec-ch-ua-mobile': '?0', 
                    'sec-ch-ua-platform': '"Windows"', 
                    'Sec-Fetch-Site': 'same-origin', 
                    'Sec-Fetch-Mode': 'cors', 
                    'Sec-Fetch-Dest': 'empty', 
                    'Referer': 'https://www.imgtp.com/', 
                    'Accept': 'application/json, text/javascript, */*; q=0.01', 
                    'Cookie': cookie, 
                    ...image.getHeaders()
                },
                data : image,
                resolveWithFullResponse: true
            }
        default:
            return {
                'method': 'POST',
                'url': 'https://www.imgtp.com/api/upload',
                'headers': {
                    'token': token
                },
                'resolveWithFullResponse': true,
                'formData': {
                    'image': {
                        'value': imgRawData,
                        'options': {
                            'filename': imgName,
                            'contentType': null
                        }
                    }
                }
            }
    }
}


const handle = async (ctx) => {
    // 获取用户配置信息
    const userConfig = ctx.getConfig('picBed.imgtp')
    if(!userConfig){
        throw new Error('[IMGTP] 请配置相关信息!')
    }      

    // 核验配置信息    
    if(userConfig.mode == "Front-End") {
        // 使用前端接口上传
        // 判断 Cookie 是否有效，若无效需要重新获取
        if(!userConfig.cookie){
            // 局域变量
            let cookie = ''
            let loginToken = ''
            // 获取登录所需的 __token__
            const loginTokenResponse = await ctx.request(loginTokenRequestConstruct());
            if(loginTokenResponse.status == 200) {
                // 保存 Cookie
                cookie = loginTokenResponse.headers['set-cookie']
                ctx.saveConfig({
                    'picBed.imgtp': {
                        account: userConfig.account,
                        password: userConfig.password,
                        token: userConfig.token,
                        cookie: cookie,
                        mode: userConfig.mode
                    }
                })
                // 解析 loginToken
                loginToken = loginTokenParse(loginTokenResponse.data)
                if(loginToken) {
                    ctx.log.info(`[IMGTP] 获取 login token 成功 (${loginToken})`)
                }
                else {
                    throw new Error('[IMGTP] 解析 login token 失败')
                }
            }
            else {
                throw new Error(`[IMGTP] 获取 login token 失败，服务器返回状态码 ${loginTokenResponse.status}`)
            }
            // 使用获取到的 __token__ 登录
            await ctx.request(loginRequestConstruct(cookie, loginToken, userConfig.account, userConfig.password)).then((loginResponse) => {
                if(loginResponse.status == 200) {
                    ctx.log.info('[IMGTP] 登陆成功')
                }
                else {
                    throw new Error(`服务器返回状态码 ${loginResponse.statusCode}`)
                }
            }).catch((error) => {
                throw new Error(`[IMGTP] 登录失败，${error.message}`)
            });
        }
    }
    else if(userConfig.mode == "Back-End") {
        if(userConfig.token == ''){
            // 获取token
            await ctx.request(backendTokenRequestConstruct(userConfig.account, userConfig.password)).then((backendTokenResponse) => {
                if(backendTokenResponse.status == 200) {
                    if(backendTokenResponse.data.code == 200) {
                        ctx.saveConfig({
                            'picBed.imgtp': {
                                account: userConfig.account,
                                password: userConfig.password,
                                token: backendTokenResponse.data.data.token,
                                cookie: userConfig.cookie,
                                mode: userConfig.mode
                            }
                        })
                        ctx.log.info('[IMGTP] 后端 token 获取成功')
                    }
                    else {
                        throw new Error(`${backendTokenResponse.data.msg}`)
                    }
                }
                else {
                    throw new Error(`服务器返回状态码 ${backendTokenResponse.statusCode}`)
                }
            }).catch((error) => {
                throw new Error(`[IMGTP] 后端 token 获取失败，${error}`)
            });
        } 
    }
    else {
        throw new Error(`[IMGTP] 图片上传失败，未知的上传模式 ${userConfig.mode}`)
    }

    // 上传图片
    const imgList = ctx.output
    for(var i in imgList){
        try{
            let img = imgList[i].buffer
            if(!img && imgList[i].base64Image){
                img = Buffer.from(imgList[i].base64Image, 'base64')
            }

            await ctx.request(uploadRequestConstruct(userConfig.mode, imgList[i].fileName, img, userConfig.token, userConfig.cookie)).then((uploadResponse) => {
                if(uploadResponse.data.code == 200){
                    imgList[i]['imgUrl'] = uploadResponse.data.data.url
                }
                else{
                    throw new Error(`${uploadResponse.data.msg}`)
                }
            }).catch((error) => {
                throw new Error(`[IMGTP] ${imgList[i].fileName} 上传失败，${error.message}`)
            })
        }
        catch(err){
            ctx.log.error(err)
        }    
    }
    return ctx
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('imgtp加载成功！')
        ctx.helper.uploader.register('imgtp', {
            handle: handle,
            config: config,
            name: 'imgtp'
        })
    }
    return {
        register,
        uploader: 'imgtp'
    }
}