/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const { onRequest } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const { bucket } = require("firebase-functions/v1/storage");

admin.initializeApp();
const db = admin.database();

// Listens for any stuff that gets added to storage and then runs the call back
exports.detectQR_code = onObjectFinalized(async (event) => {
  const bucket = admin.storage().bucket(event.data.bucket); 
  const file = bucket.file(event.data.name);
  let qrDetected = false;

  if (event.data.contentType.startsWith("image/")) { // Checking if whatevr was added was an image
    const tempFilePath = `/tmp/${event.data.name}`;

    await file.download({ destination: tempFilePath });

    const image = await Jimp.read(tempFilePath);

    const qrCodeValue = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height); // qr code obj

    if (qrCodeValue !== null) {

      const qrCodeDataRef = db.ref(`QR-Code/${qrCodeValue.data}`);  //.data is the actual value
    
      // This is updating the rtdb value
      qrCodeDataRef.get()
        .then(snapshot => {
          const qrCodeStatus = snapshot.val();
          qrDetected = true;

          if (qrCodeStatus === null) {
            throw new Error("Couldn't fetch the code");
          } else if (qrCodeStatus === false) {
            return qrCodeDataRef.set(true); // Setting the value directly
          }
        })
        .catch((err) => logger.error(err));
    } else {
      console.log('No QR code found in the image.');
    }

  } else {
    logger.log("Object is not an image.");
  }

  if (!qrDetected) {  // Trying to delete images that were not detected as qr codes
    try {
      await file.delete();  
    } catch (error) {
      logger.log(error);
    }
  } 
  
});


// Listener just returns the number of files in storage
exports.getStorageFileCount = onRequest(async (request, response) => {
  try {
    const [files] = await bucket.getFiles();
    const fileCount = files.length;

    files.map(element => logger.log(element.name));

    response.status(200).send(`Number of files in storage: ${fileCount}`);
  } catch (error) {
    logger.error(error);
    response.status(500).send("Error getting file count");
  }
});

