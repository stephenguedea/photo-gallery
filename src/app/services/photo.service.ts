import { Injectable } from '@angular/core';
import { Camera, CameraPhoto, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { UserPhoto } from './../models/UserPhoto';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  // properties
  public photos: UserPhoto[] = [];

  private PHOTO_STORAGE: string = "photos";

  constructor() { }

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

    // use webPath to display the new image instead of base64 since it's 
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };

  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
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

    // display the photo by reading into base64 format
    for (let photo of this.photos) {
      // read each saved photo's data from the Filesystem
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data
      });

      // web platform only: Load the phto as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }




}