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
                    reject({ success: false, err })
                }
                if (fs.existsSync(`${path}`)) {
                    fs.unlink(`${path}`, async (err) => {
                        if (err) {
                            reject({ success: false, err })
                        }
                        resolve(
                            { success: true, file: data.Location },
                            'data.location'
                        )
                    })
                }
            })
        })
    } catch (err) {
        console.log(err, 'error=>')
        return { success: false, err }
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
        if (!result?.files) {
            return resolve(false)
        }
        const Keys = Object.keys(result?.files).filter((value) => {
            return !value.match(/^__MACOSX\//) && !value.match(/.DS_Store/)
        })

        let fileKeys = []
        let attachKey = []
        Keys.forEach((key) => {
            if (key.includes('/')) {
                attachKey.push(key)
                const splitKeys = key.split('/')
                fileKeys.push(splitKeys[1])
            } else {
                attachKey.push(key)
                fileKeys.push(key)
            }
        })
        fs.mkdirSync(`./src/uploads/files/${fileName}/`)
        fs.unlink(`./src/uploads/files/${fileName}.zip`, async (err) => {
            if (err) {
                return err
            }
            if (Keys?.[0].includes('/')) {
                fileKeys.shift()
                attachKey.shift()
            }

            for (let key in fileKeys) {
                const item = result.files[attachKey[key]]
                let splitNameKeys
                if (item?.name.includes('/')) {
                    splitNameKeys = item?.name.split('/')
                    splitNameKeys = splitNameKeys[1]
                } else {
                    splitNameKeys = item?.name
                }
                fs.writeFileSync(
                    `./src/uploads/files/${fileName}/` + splitNameKeys,
                    Buffer.from(await item.async('arraybuffer'))
                )
            }
            resolve(true)
        })
    })
}
exports.deleteFromS3 = async (key) => {
    const deleteFiles = await s3
        .deleteObject({
            Bucket: AWS_S3_BUCKET,
            Key: key,
        })
        .promise()
    return deleteFiles
}
