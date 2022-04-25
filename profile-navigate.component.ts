import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute, Event } from '@angular/router';
import { Location } from "@angular/common";
import { HttpResponse } from '@angular/common/http';
import { HttpParams } from "@angular/common/http";

import { AddyaDbService } from '../../addya-db.service';
import { AwsAuthService } from '../../aws-auth.service';
import { UpdateRequest } from '../../model/db_update_request';

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

  profilePictureUrl: string;

  // Boolean for if the profile data is parsed and ready to display
  profileLoaded: boolean;

  // String to hold if account button or qr code button are pressed
  selection: string;

  fileErrorMsg;

  showUploadPicture: boolean;
  showSpinner: boolean;

  directToAppSelectedApp: string;

  screenHeight: number;

  constructor(private addyaDbService: AddyaDbService, private authService: AwsAuthService, private router: Router) {
    this.showUploadPicture = false;
    this.profileLoaded = false;

    // 200 is the height of the top section
    this.screenHeight = window.screen.height - 200;
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
    this.selection = "none";
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
          this.parseData();
          if (this.userData.picture.value.includes("addya-co")) {
            this.profilePictureUrl = this.userData.picture.value + "?" + Math.floor(1000 + Math.random() * 9000);
          }
        }
      });
    });
  }

  //more needs to be done here to toggle and then save modes
  toggleMode() {
    if (this.userData.direct.enabled) {
      this.userData.direct.enabled = false;
    } else {
      this.userData.direct.enabled = true;
    }

    // Save changes, pass in false so that it doesn't show the spinner
    this.saveUserData(false);
  }

  accountButtonClicked() {
    this.selection = "account";
  }

  cancelAccountEdit() {
    // Set selection to none to show main profile page
    this.selection = "none";

    // Fixed the page from being scrolled down when you cancel
    var element = document.querySelector('#circle');
    element.scrollIntoView();
  }

  saveUserData(showSpinnerAndReturnToHome) {
    console.log("running save");
    if (showSpinnerAndReturnToHome) {
      this.profileLoaded = false;
      this.showSpinner = true;
    }
    //if (this.hasErrors) {
    //  alert("Fields Missing or Invalid");
    //} else {
    this.authService.authCurrentUser().then(creds => {
      let authToken = creds.signInUserSession.idToken.jwtToken;
      if (authToken) {
        let sub = this.addyaDbService.updateUserInfo(this.userData, authToken).subscribe(res => {
          if (showSpinnerAndReturnToHome) {
            this.showSpinner = false;
            this.profileLoaded = true;
            this.selection = "none";
          }
        });
      }
    });
    //}
  }

  qrButtonClicked() {
    this.selection = "qr";
  }

  cancelQRCode() {
    this.selection = "none";
  }

  dragDropButtonClicked(event) {
    if (event === "add-app") {
      this.selection = "add-app"
    } else if (event === "edit-app") {
      this.selection = "edit-app";
    }
  }

  saveAddApp() {

  }

  cancelAddApp() {
    this.selection = "none";
  }

  parseData() {
    console.log(this.userData);

    if (this.userData.direct.enabled) {
      this.directToAppSelectedApp = this.userData.direct.app;
    }

    if (this.userData.appList.length === 0) {
      console.log("test");
    }

    //if (this.userData.contact && this.userData.contact.value) {
    //  this.appList[this.userData.contact.order] = this.userData.phone;
    //}
    //if (this.userData.email && this.userData.email.value) {
    //  this.appList[this.userData.email.order] = this.userData.email;
    //}

    this.profileLoaded = true;
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
