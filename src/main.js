import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import escape from 'escape-html'
import nodemailer from 'nodemailer'
import bodyParser from 'body-parser'
import trustIPs from './utils/trustIPs'
import RateLimit from 'express-rate-limit'
import defaultConfig from './config/config.default'
import productionConfig from './config/config.production'

const app = express()
const isDev = process.env.NODE_ENV !== 'production'
const config = Object.assign({}, defaultConfig, !isDev && productionConfig)

async function main() {
  trustIPs(app, config.trustCloudflare)

  app.use(
    helmet({
      hidePoweredBy: {
        setTo: 'hamsters',
      },
    })
  )
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  const msgLimit = new RateLimit({
    windowMs: 10 * 60 * 1000, // 2 minutes
    max: 2, // limit each IP to 10 requests per windowMs
  })

  app.post('/', msgLimit)

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let account = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  // let transporter = nodemailer.createTransport({
  //   host: "smtp.ethereal.email",
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: account.user, // generated ethereal user
  //     pass: account.pass // generated ethereal password
  //   }
  // });
  const transporter = nodemailer.createTransport(config.smtpSettings)

  // setup email data with unicode symbols
  const defMailOptions = {
    to: config.to, // list of receivers
    from: config.from, // sender address
    subject: config.subject, // Subject line
  }

  const fieldKeys = Object.keys(config.fields)

  app.post('/', async (req, res) => {
    let html = ''
    let message

    const invalid = fieldKeys.some(key => {
      const val = req.body[key]
      const fieldConf = config.fields[key]

      if (typeof val !== 'string' || (val.length === 0 && fieldConf.required)) {
        message = `missing field ${key}`
        return true
      } else if (val.length > fieldConf.maxLength) {
        message = `${key} exceeded max-length`
        return true
      }
      html += `<p><b>${key}:</b> ${escape(val)}</p>`
      return false
    })

    if (invalid) {
      return res.status(400).json({ status: 'failed', message })
    }

    const mailOptions = Object.assign({}, defMailOptions, {
      html,
    })

    try {
      await transporter.sendMail(mailOptions)
      res.status(200).json({ status: 'ok' })
    } catch (err) {
      res.status(500).json({
        status: 'failed',
        message: 'an error occurred receiving message',
      })
    }
  })

  app.listen(config.port, () => {
    console.log(`Listening at http://127.0.0.1:${config.port}`)
  })
}
main()
