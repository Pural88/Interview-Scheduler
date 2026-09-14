import { ImageKit } from "@imagekit/nodejs";

// Used for one thing only: uploading a user's profile picture.
async function uploadFile(file, fileName, folder) {
    const imagekitClient = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    });

    const result = await imagekitClient.files.upload({
        file: file,
        fileName: fileName + '-' + Date.now(),
        folder: folder,
    });
    return result.url;
};


export { uploadFile };
