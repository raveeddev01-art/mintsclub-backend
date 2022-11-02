/* eslint-disable no-async-promise-executor */
const AWS = require('aws-sdk')
const fs = require('fs')
const jszip = require('jszip')
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
})

exports.uploadFileToS3 = async (path, filename) => {
    try {
        const fileContent = fs.readFileSync(`${path}`)

        return new Promise((resolve, reject) => {
            let params = {
                Bucket: AWS_S3_BUCKET,
                Key: `${filename}`,
                Body: fileContent,
            }
          
            s3.upload(params, (err, data) => {
                if (err) {
                    reject({success:false,err})
                }
                fs.unlink(`${path}`, async (err) => {
                    if (err) {
                        reject({success:false,err})
                    }
                    resolve({success:true,file:data.Location}, 'data.location')
                })
              
            })
        })
    } catch (err) {
        console.log(err, 'error=>')
    }
}
exports.getS3Object = async (Key, fileName) => {
    return new Promise((resolve) => {
        let params = {
            Bucket: AWS_S3_BUCKET,
            Key,
        }
        s3.getObject(params, async (err, data) => {
            if (err) return err
            // an error occurred
            else {
                fs.writeFile(
                    `./src/uploads/files/${fileName}.zip`,
                    data.Body,
                    async (err) => {
                        if (err) return err
                        let res = await unzipFile(Key, fileName)
                        resolve(res)
                    }
                )
            } // successful response
        })
    })
}

const unzipFile = async (fileKey, fileName) => {
    return new Promise(async (resolve) => {
        const fileContent = fs.readFileSync(
            `./src/uploads/files/${fileName}.zip`
        )
        const jsZipInstance = new jszip()
        const result = await jsZipInstance.loadAsync(fileContent)
        console.log('checking result', result)

        if (!result?.files) {
            console.log('reject while unzipping====>', result?.files)
            return resolve(false)
        }
        const Keys = Object.keys(result?.files).filter((value) => {
            return !value.match(/^__MACOSX\//) && !value.match(/.DS_Store/)
        })

        fs.unlink(`./src/uploads/files/${fileName}.zip`, async (err) => {
            if (err) {
                return err
            }

            for (let key of Keys) {
                const item = result.files[key]
                if (item.dir) {
                    fs.mkdirSync(`./src/uploads/files/${item.name}`)
                } else {
                    fs.writeFileSync(
                        './src/uploads/files/' + item.name,
                        Buffer.from(await item.async('arraybuffer'))
                    )
                }
            }
            resolve(true)
        })
    })

    //    if(item.dir){
    //        fs.mkdirSync(item.name)
    //    }else{

    //    }
}
// unzipFile()

exports.deleteFromS3 = async (key) => {
    const deleteFiles = await s3
        .deleteObject({
            Bucket: AWS_S3_BUCKET,
            Key: key,
        })
        .promise()
    return deleteFiles
}
