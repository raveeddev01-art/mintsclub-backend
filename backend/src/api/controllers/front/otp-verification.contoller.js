// const nodemailer = require('nodemailer')
const fs = require('fs');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const { mailChimp, sendGrid } = require('../../../config/vars');
const path = require('path');
const OtpModal=require('../../models/otpEmail.model')
mailchimp.setConfig({
    apiKey: mailChimp.apiKey,
    server: mailChimp.server,
  });
var email;




///transporter
// let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     service: 'Gmail',

//     auth: {
//         user: 'oosammach@gmail.com',
//         pass: 'roman124',
//     }

// });



exports.sendEmail=async(req,res,next)=>{
    // console.log("sending email")
    var otp = Math.random();
    otp = otp * 1000000;
    otp = parseInt(otp);
    console.log(otp);
    email = req.body.email;
    console.log(req.body.email,"req.body.email")

    // send mail with defined transport object
    // var mailOptions = {
    //     to: req.body.email,
    //     subject: "Otp for registration is: ",
    //     html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //     console.log(info,"info")
    //     if (error) {
    //         return console.log(error);
    //     }
    //     console.log('Message sent: %s', info.messageId);
    //     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    //     res.send("otp")
    // });
    let filePath = path.join(__dirname, `../../templates/email.html`);
    let userEmail=req.body.email;
let payload={
    email:req.body.email,
    otpCode:otp,
}
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (!err) {
        let helper = require('sendgrid').mail;
        const from_email = new helper.Email('mintsclub@em6739.invo.zone');
        const to_email = new helper.Email(req.body.email);
        const subject = 'You are all set!';
        let content = new helper.Content('text/html', " <h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" );
        console.log(content,"content")
        const mail = new helper.Mail(from_email, subject, to_email, content);

        let sg = require('sendgrid')(sendGrid.apiKey);
        let requestBody = mail.toJSON();
        let request = sg.emptyRequest();
        request.method = 'POST';
        request.path = '/v3/mail/send';
        request.body = requestBody;
        sg.API(request, async (error, response) => {
          if (!error) {
           let result= OtpModal.find({userEmail})
        //    if(result){
               let email =userEmail
               let deletedCode= await OtpModal.deleteMany({email})
               console.log(deletedCode,"deletedCode")
        //    }
          let userVerification=  await OtpModal.create(payload)

            res.send({userVerification})
          } else {
            console.log(error);
            res.send(error)
          }
        });
      } else {
        console.log(err);
      }
    });
  
}



exports.verify=async(req,res,next)=>{
    let email=req.body.email
    
  let foundCode= await OtpModal.find({email})
  console.log(foundCode,"otp")
  if(foundCode){
    console.log(foundCode,"---",req.body.otp)
    if(foundCode[0].otpCode==req.body.otp){
      res.status(200).send({status:true,message:"Email Verified"})
    }
    else {

      res.status(200).send({status:false,message:"Invalid OTP"})
    }
  }
  else {

      res.status(200).send({status:false,message:"Invalid OTP"})
  }
  // res.send({foundCode})

}

exports.resend=async(req,res,next)=>{
    var mailOptions = {
        to: email,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('otp', { msg: "otp has been sent" });
    });

}