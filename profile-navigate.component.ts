import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute, Event } from '@angular/router';
import { Location } from "@angular/common";
import { HttpResponse } from '@angular/common/http';
import { HttpParams } from "@angular/common/http";

import { AddyaDbService } from '../../addya-db.service';
import { AwsAuthService } from '../../aws-auth.service';

import Amplify from 'aws-amplify';

@Component({
  selector: 'app-profile-navigate',
  templateUrl: './profile-navigate.component.html',
  styleUrls: ['./profile-navigate.component.css']
})
export class ProfileNavigateComponent implements OnInit {
  isAuthenticated;
  _authSubscription;
  _firstSignOnSubscription;
  private subscription;
  userData;
  previousUrl;
  selectedFile: ImageSnippet;

  fileErrorMsg;
  showUploadPicture: boolean;
  showSpinner:boolean;

  constructor(private addyaDbService: AddyaDbService, private authService: AwsAuthService, private router: Router) {
    this.showUploadPicture = false;
    this.showSpinner = false;
  }

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated;
    this.authService.authSessionCheck();
    this._authSubscription = this.authService.authenticatedChange.subscribe((value) => {
      this.isAuthenticated = value;
      if (value) {
        this.getUserData();
      }
    });
    this._firstSignOnSubscription = this.authService.firstSignOnChange.subscribe((value) => {
      this.isAuthenticated = value;
      if (value) {
        this.getUserData();
      }
    });
    setTimeout(() => {
      if (!this.isAuthenticated) {
        this.router.navigateByUrl('account');
      }
    }, 5000);
  }

  ngOnDestroy() {
    this._authSubscription.unsubscribe();
  }

  private getUserData() {
    this.authService.authCurrentUser().then(creds => {
      let authToken = creds.signInUserSession.idToken.jwtToken;
      this.subscription = this.addyaDbService.getUserInfo(authToken).subscribe((response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.length == 0) {
          this.router.navigateByUrl('profile/new');
        } else {
          this.userData = response.body[0];
          if (this.userData.picture.value.includes("addya-co")) {
            this.userData.picture.value = this.userData.picture.value + "?" + Math.floor(1000 + Math.random() * 9000);
          }
        }
      });
    });
  }

  routeToQrCode() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        'scanId': this.userData.scanId,
        'scanKey': this.userData.scanKey,
        'fromProfile': true
      }
    };
    this.router.navigate(['profile/add'], navigationExtras);
  }

  routeToTestLink() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        'scanId': this.userData.scanId,
        'scanKey': this.userData.scanKey,
      }
    };
    this.router.navigate(['scan'], navigationExtras);
  }

  routeToPictureEdit() {
    this.router.navigate(['profile/picture']);
  }

  toggleShowSpinner(event) {
    this.showSpinner = event;
  }

  imagePicked(event) {
    if (event.target.files.length == 0) {
      return
    }
    let file: File = event.target.files[0];
    const reader = new FileReader();

    reader.addEventListener('load', (event: any) => {
      if (file.type === "image/png" || file.type === "image/jpeg") {
        this.fileErrorMsg = "";
        let image = new Image();
        image.src = event.target.result;
        image.onload = (img: any) => {
          //the img.path seems to be chromes way of handling the onload, and the img.target is safari? this is weird
          if ((img.path && (img.path[0].height < 200 || img.path[0].width < 200)) || (img.target.width < 200 || img.target.height < 200)) {
            this.fileErrorMsg = "Image Too Small (Min: 200px by 200px)";
            alert("Image Too Small (Min: 200px by 200px)");
          } else {
            this.selectedFile = new ImageSnippet(event.target.result, file);
            this.showUploadPicture = true;
          }
        }
      } else {
        this.fileErrorMsg = "Invalid File Type (Accepted: PNG and JPEG)";
        alert("Invalid File Type (Accepted: PNG and JPEG)");
      }
    });

    reader.readAsDataURL(file);
    // after here 'file' can be accessed and used for further process
  }

  signOut() {
    this.authService.signOut();
  }

}

export class ImageSnippet {
  constructor(public src: string, public file: File) {}
}
