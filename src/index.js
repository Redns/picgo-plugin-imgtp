const config = (ctx) => {
    let userConfig = ctx.getConfig('picBed.imgtp')
    if (!userConfig) {
        userConfig = {}
    }
    const config = [
        {
            name: 'token',
            type: 'input',
            default: userConfig.token || '',
            message: 'Token不能为空',
            required: true
        }
    ]
    return config
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
        'url': 'https://www.imgtp.com/api/upload',
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
    if(!userConfig){
        throw new Error('请配置相关信息!')
    }      

    const imgList = ctx.output
    for(var i in imgList){
        try{
            let img = imgList[i].buffer
            if(!img && imgList[i].base64Image){
                img = Buffer.from(imgList[i].base64Image, 'base64')
            }

            // 上传图片
            const uploadRequest = uploadRequestConstruct(imgList[i].fileName, userConfig.token, img)
            await ctx.Request.request(uploadRequest, function(uploadRequestError, uploadResponse){
                if(uploadRequestError){
                    throw new Error(err)
                }
                else{
                    var uploadResponseObject = JSON.parse(uploadResponse.body)
                    if(uploadResponseObject.code == 200){
                        imgList[i]['imgUrl'] = uploadResponseObject.data.url
                    }
                    else{
                        ctx.log.error(`图片上传失败，${uploadResponseObject.msg}`)
                    }
                }
            })
        }
        catch(err){
            throw new Error(err)
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