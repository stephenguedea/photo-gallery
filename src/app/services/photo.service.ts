import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { UserPhoto } from './../models/UserPhoto';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  // properties
  public photos: UserPhoto[] = [];

  constructor() { }

  public async addNewToGallery() {
    // take a photo
    const capturePhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    // adds new captured photos to the beginning of the Photos array
    this.photos.unshift({
      filepath: "soon...",
      webviewPath: capturePhoto.webPath
    })
  }
}