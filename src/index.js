const config = (ctx) => {
    let userConfig = ctx.getConfig('picBed.imgtp')
    if (!userConfig) {
        userConfig = {}
    }
    const config = [
        {
            name: 'email',
            type: 'input',
            alias: '比邻云帐号',
            default: userConfig.email || '',
            message: '帐号不能为空',
            required: true
        },
        {
            name: 'password',
            type: 'input',
            alias: '比邻云密码',
            default: userConfig.password || '',
            message: '密码不能为空',
            required: true
        },
        {
            name: 'token',
            type: 'input',
            alias: 'token',
            default: userConfig.token || '',
            message: '初次安装后自动获取, 请勿填写!',
            required: false
        }
    ]
    return config
}


/**
 * 获取token
 * @param {帐号} email 
 * @param {密码} password 
 */
const tokenRequestConstruct = (email, password) => {
    return {
        'method': 'POST',
        'url': 'https://imgtp.com/api/token',
        'headers': {
        },
        formData: {
            'email': email,
            'password': password,
            'refresh': '0'
        }
    }
}


/**
 * 上传图片 
 * @param {图片名称} filename
 * @param {令牌} token 
 * @param {文件内容(二进制形式)} img 
 * @returns 
 */
const uploadRequestConstruct = (filename, token, img) => {
    return {
        'method': 'POST',
        'url': 'https://imgtp.com/api/upload',
        'headers': {
            'token': token
        },
        formData: {
            'image': {
                'value': img,
                'options': {
                'filename': filename,
                'contentType': null
                }
            }
        }
    }
}


const handle = async (ctx) => {
    // 获取用户配置信息
    const userConfig = ctx.getConfig('picBed.imgtp')
    const email = userConfig.email
    const password = userConfig.password
    var token = userConfig.token

    if(!userConfig){
        throw new Error('请配置相关信息!')
    }      
    if(token == ''){
        // 获取token
        const tokenRequest = tokenRequestConstruct(email, password)
        const tokenResponse = await ctx.Request.request(tokenRequest)
        const tokenResponseObject = JSON.parse(tokenResponse)
        if(tokenResponseObject.data){
            token = tokenResponseObject.data.token
            ctx.saveConfig({
                'picBed.imgtp': {
                    email: email,
                    password: password,
                    token: token
                }
            })
        }
        else{
            ctx.log.error('获取token失败, 请检查账号密码是否正确')
            return ctx
        }
    } 

    const imgList = ctx.output
    for(var i in imgList){
        try{
            let img = imgList[i].buffer
            if(!img && imgList[i].base64Image){
                img = Buffer.from(imgList[i].base64Image, 'base64')
            }

            // 格式化图片名称
            var myDate = new Date()
            var fileName = `${myDate.getFullYear()}${myDate.getMonth() + 1}${myDate.getDate()}${myDate.getHours()}${myDate.getMinutes()}${myDate.getSeconds()}.${imgList[i].extname}`

            // 上传图片
            const uploadRequest = uploadRequestConstruct(fileName, token, img)
            const uploadResponse = await ctx.Request.request(uploadRequest)
            const uploadResponseObject = JSON.parse(uploadResponse)
            if(uploadResponseObject.code == 200){
                imgList[i].imgUrl = uploadResponseObject.data.url
            }
            else{
                ctx.log.error('上传文件失败')
            }
        }
        catch(err){
            if (err.error === 'Upload failed') {
                ctx.emit('notification', {
                    title: '上传失败!',
                    body: '请检查你的配置项是否正确'
                })
            } 
            else {
                ctx.emit('notification', {
                    title: '上传失败!',
                    body: '请检查你的配置项是否正确'
                })
            }
            throw err
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