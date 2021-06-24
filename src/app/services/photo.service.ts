import { Injectable } from '@angular/core';
import { Camera, CameraPhoto, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { UserPhoto } from './../models/UserPhoto';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  // properties
  public photos: UserPhoto[] = [];

  private PHOTO_STORAGE: string = "photos";

  constructor(private platform: Platform) {
   }

  public async addNewToGallery() {
    // take a photo
    const capturePhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality ( 0 - 100 )
    });

    // // adds new captured photos to the beginning of the Photos array
    // this.photos.unshift({
    //   filepath: "soon...",
    //   webviewPath: capturePhoto.webPath
    // });

    // Saves the picture and add it to photo collection
    const savedImageFile = await this.savePicture(capturePhoto);
    // adds photo to beginning of the array
    this.photos.unshift(savedImageFile);



    // saves the photos array... stored each time a new photo is taken
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  // Save picture to file on device
  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // write the file to the data directory
    const fileName = new Date().getTime() + ".jpeg";
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      // display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }

      else { 
        // use webPath to display the new image instead of base64 since it's 
        // already loaded into memory
        return {
          filepath: fileName,
          webviewPath: cameraPhoto.webPath
        };
    }

  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // read the file into base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });

      return file.data;
    }

    else { 
      // fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });




  public async loadSaved() {
    // retrieve cached photo array data
    const photoList = await Storage.get({
      key: this.PHOTO_STORAGE
    });
    this.photos = JSON.parse(photoList.value) || [];


    // Easiest way to detect when running on the web;
    // "when the platform is NOT hybrid, do this"
    if (!this.platform.is('hybrid')) {
      
      // display the photo by reading into base64 format
      for (let photo of this.photos) {
        // read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }


  // delete a picture
  public async deletePicture(photo: UserPhoto, position: number) {
    // remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // delete photo file from filesystem
    const filename = photo.filepath
    .substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }


}