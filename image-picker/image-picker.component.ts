import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import Storage from '@aws-amplify/storage'
import { ImageCroppedEvent } from 'ngx-image-cropper';

import { AwsAuthService } from '../../../aws-auth.service';
import { AddyaDbService } from '../../../addya-db.service';
import { UpdateRequest, BasicField } from '../../../model/db_update_request'

const imageUrl = "https://addya-co085a350fdf65441a85fac320650de9e9prodfinal-prodfinal.s3.amazonaws.com/public/";

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.css']
})
export class ImagePickerComponent implements OnInit {
  _selectedFile: ImageSnippet;
  showImageCropper: boolean;

  userId: string;
  changedData: any;

  imageChangedEvent: any = '';
  croppedImage: any = '';

  hideResizeSquares: boolean;

  @Input() set selectedFile(value) {
    this._selectedFile = value;
    this.showImageCropper = true;
    console.log(this.selectedFile);
  }

  get selectedFile() {
    return this._selectedFile;
  }

  @Output() showSpinner = new EventEmitter();

  constructor(private router: Router, private authService: AwsAuthService, private addyaDbService: AddyaDbService) {
    this.showImageCropper = false;
    this.hideResizeSquares = false;
    this.changedData = <UpdateRequest>{};

    var userAgent = navigator.userAgent || navigator.vendor;

    if (/android|iPad|iPhone|iPod/i.test(userAgent)) {
      console.log("we here?");
      this.hideResizeSquares = true;
    }
  }

  ngOnInit(): void {
    this.getUserData();
  }

  private getUserData() {
    this.authService.authCurrentUser().then(creds => {
      this.userId = creds.attributes.sub;
    }).catch(() => {
      console.log("Not Authed boyo, routing to sign in");
      this.router.navigateByUrl('account');
    });
  }

  doImageUpload() {
    this.showSpinner.emit(true);
    this.authService.authCurrentUser().then(creds => {
      var Buffer = require('buffer/').Buffer;
      let base64Data = new Buffer.from(this.croppedImage.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      let imageType = this.croppedImage.split(';')[0].split('/')[1];
      let type = "image/" + imageType;

      Storage.put("images/" + creds.attributes.sub + "." + imageType, base64Data, {
          contentType: type
      }).then ((result: any) => {
        let newImageUrl = imageUrl + result.key;
        console.log(newImageUrl);
        this.changedData.picture = <BasicField>{};
        this.changedData.picture.enabled = true;
        this.changedData.picture.value = newImageUrl;
        this.changedData.usernames = [];
        this.authService.authCurrentUser().then(creds => {
          let authToken = creds.signInUserSession.idToken.jwtToken;
          if (this.changedData.picture && authToken) {
            let sub = this.addyaDbService.updateUserInfo(this.changedData, authToken).subscribe(res => {
              window.location.reload();
            });
          }
        });
      }).catch(err => {
        window.location.reload();
      })
    });
  }

  cancelImageUpload() {
    window.location.reload();
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;

  }
  imageLoaded() {
      // show cropper
  }
  cropperReady() {
      // cropper ready
  }
  loadImageFailed() {
      // show message
  }
}

export class ImageSnippet {
  constructor(public src: string, public file: File) {}
}
