const AWS = require('aws-sdk')
const fs = require('fs')
const jszip = require('jszip')
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
})
exports.getS3Object = async (Key, fileName) => {
    console.log(fileName,"fileName here===>")
    return new Promise((resolve, reject) => {
        let params = {
            Bucket: AWS_S3_BUCKET,
            Key,
        }
        s3.getObject(params, async (err, data) => {
            if (err) console.log(err, err.stack) // an error occurred
            else {
                console.log(
                    data.Body.toString('utf-8', 0, 12),
                    'khkjhjkhkjhkjh'
                )
                fs.writeFile(
                    `./src/uploads/files/${fileName}.zip`,
                    data.Body,
                    async (err) => {
                        if (err) return console.log(err)
                        console.log('Hello World > helloworld.txt')
                        let res = await unzipFile(Key, fileName)
                        console.log(res,"res of unzip file===>")
                        resolve(res)
                    }
                )
                console.log(data, 'reaading data from the s3 bucket')
            } // successful response
        })
    })
}

const unzipFile = async (fileKey, fileName) => {
    console.log("unzipping folder===>")
    return new Promise(async (resolve,reject)=>{
        console.log(fileKey, 'fileKey')
        const fileContent = fs.readFileSync(
            `./src/uploads/files/${fileName}.zip`
        )
        console.log(fileContent, 'fileconent')
        const jsZipInstance = new jszip()
        const result = await jsZipInstance.loadAsync(fileContent)
        const Keys = Object.keys(result.files)
        fs.unlink(`./src/uploads/files/${fileName}.zip`, async (err) => {
            if (err) {
                console.log(err,"err")
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
