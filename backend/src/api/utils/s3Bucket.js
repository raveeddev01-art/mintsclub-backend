const AWS = require('aws-sdk')
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
})
exports.uploadToS3Bucket = async (blob, filename) => {
    const uploadedImage = await s3
        .upload({
            Bucket: AWS_S3_BUCKET,
            Key: filename,
            Body: blob,
        })
        .promise()
    //    s3.getObject(params, function(err, data) {
    //      if (err) console.log(err, err.stack); // an error occurred
    //      else {
    //         console.log(data.Body.toString("utf-8", 0, 12),"khkjhjkhkjhkjh")
    //         fs.writeFile('./src/uploads/images/helloworld.jpeg', data.Body, function (err) {
    //             if (err) return console.log(err);
    //             console.log('Hello World > helloworld.txt');
    //           });
              
    //             console.log(data,"reaading data from the s3 bucket");
    //      }           // successful response
    //    });

    // res.attachment(fileKey);
    // const fileStream = s3.getObject(params).createReadStream()
    // fileStream.pipe(res)
    return uploadedImage
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
