import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '../../public/temp') // check file path in case it show error
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname)

    }
  })
  
export const upload = multer({ 
    storage,
})