import { ImageKit, toFile } from "@imagekit/nodejs";

// Used for one thing only: uploading a user's profile picture.
async function uploadFile(file, fileName, folder) {
    const imagekitClient = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    });

    // The SDK's `file` param only accepts File/Blob/Stream-like values, not a
    // raw Buffer (which is what multer's memoryStorage gives us) — wrap it.
    const uploadableFile = await toFile(file, fileName);

    const result = await imagekitClient.files.upload({
        file: uploadableFile,
        fileName: fileName + '-' + Date.now(),
        folder: folder,
    });
    return result.url;
};


export { uploadFile };
