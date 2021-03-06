const passport = require('passport')
const express = require('express')
const serverless = require('serverless-http')
const cookieParser = require('cookie-parser')
var multer = require('multer')
var upload = multer({ storage: storage })
var storage = multer.memoryStorage()
var cloudinary = require('cloudinary').v2
require('./utils/auth')

const app = express()
app.use(passport.initialize())
app.use(cookieParser())
const { ENDPOINT, CLOUDINARY_TESTDATAPATH } = require('./utils/config')

const { db } = require('./utils/firebaseConfig')

app.post(
  `${ENDPOINT}/api/file`,
  passport.authenticate('jwt', { session: false }),
  upload.none(),
  async (req, res) => {
    /*TODO: -HANDLE ERROR INCASE CLOUDINARY UPLOAD DOESN'T WORK
          -INPUT VALIDATION
  */
    if (req.user.verified === false) res.send(401)
    //Upload the resume to the cloudinary CDN
    let url = await cloudinary.uploader.upload(
      req.body.pdf,
      {
        public_id: `${CLOUDINARY_TESTDATAPATH}${req.body.name} - Resume`,
        resource_type: 'raw',
        format: 'pdf',
      },
      (err, result) => {
        if (err) {
          console.error(
            `Cloudinary was unable to upload the resume for ${req.body.name} successfully`
          )
          console.log(err)
          res
            .status(500)
            .send('Unable to upload your resume to our CDN. Please try again')
        }
        console.log(`Cloudinary Successfully uploaded a resume for ${req.body.name}`)
        return result.secure_url
      }
    )

    //Add an entry to the resumes collection
    let resumesRef = db.collection('resumes')
    console.log(
      `Performing a query to figure out if a resume exists for ${req.body.name}`
    )
    await resumesRef
      .where('name', '==', `${req.body.name}`)
      .get()
      .then(async (snapshot) => {
        if (snapshot.size == 0) {
          console.log(`No resumes found for ${req.body.name}, creating a new document`)
          resumesRef
            .add({
              name: req.body.name,
              linkedin: req.body.linkedin,
              email: req.body.email,
              gpa: req.body.gpa,
              major: req.body.major,
              standing: req.body.standing,
              resume: url.secure_url,
            })
            .then((doc) => {
              doc.update({
                _id: doc.id,
              })
            })
            .catch((err) => {
              console.error(`Unable add a resume to the collection for ${req.body.name}`)
              console.log(err)
              res
                .status(500)
                .send('Unable to add your resume to our database. Please try again')
            })
        } else if (snapshot.size >= 1) {
          /*If there already exists an entry with that same name either:
        Update their entry if we can be somewhat confident it's the same person (We're going to assume the chance of two people having the same name, standing, and major is low)
        Create a new entry if we can be somewhat confident it's a different person
      */
          console.log(`One or more entries were found with the name ${req.body.name}`)

          let documentAdded = false
          for (let indx = 0; indx < snapshot.size; indx++) {
            let doc = snapshot.docs[indx]
            const { major, standing, email } = doc.data()

            //If the email they inputed is the same as another entry with the same name but a different major and/or standing we can reasonably assume it's the same person
            if (
              !documentAdded &&
              ((major === req.body.major && standing === req.body.standing) ||
                email === req.body.email)
            ) {
              //TODO: Delete old cloudinary resume if the user is updating their resume
              await doc.ref
                .update({
                  linkedin: req.body.linkedin,
                  email: req.body.email,
                  gpa: req.body.gpa,
                  major: req.body.major,
                  standing: req.body.standing,
                  resume: url.secure_url,
                })
                .then(() => {
                  console.log(
                    `Successfully updated resume entry for ${req.body.name} with collection ID: ${doc.id}`
                  )
                  documentAdded = true
                })
                .catch((err) => {
                  console.error(
                    `Unable to update resume entry for ${req.body.name} with collection ID: ${doc.id}`
                  )
                  console.log(err)
                  res
                    .status(500)
                    .send(
                      'Unable to update your resume in our database. Please try again'
                    )
                })
            }
          }
          //We are assuming that this person hasn't already been added to the resumes collection
          if (documentAdded === false) {
            await resumesRef
              .add({
                name: req.body.name,
                linkedin: req.body.linkedin,
                email: req.body.email,
                gpa: req.body.gpa,
                major: req.body.major,
                standing: req.body.standing,
                resume: url.secure_url,
              })
              .then((doc) => {
                console.log(
                  `Created a new entry for ${req.body.name} with collection ID: ${doc.id}`
                )
              })
              .catch((err) => {
                console.log(`Unable to add new resume entry for ${req.body.name}`)
                console.error(err)
                res
                  .status(500)
                  .send('Unable to add your resume to our database. Please try again')
              })
          }
        }
      })
    res.send('Successfully Added')
  }
)

app.get(
  `${ENDPOINT}/api/resumes`,
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    if (req.user.verified === false) res.send(401)
    let resumesRef = db.collection('resumes')
    let resumes = []
    await resumesRef
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          resumes.push(doc.data())
        })
      })
      .then(() => {
        console.log(`Successfully retrived resumes for user ${req.body.email}`)
      })
      .catch((err) => {
        console.error('Unable to retrieve resumes from the database')
        console.log(err)
        res
          .status(500)
          .send('Could not retrieve resumes from our database. Please try again')
      })
    res.json(resumes)
  }
)

module.exports.handler = serverless(app)
