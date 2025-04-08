import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  base64ToArrayBuffer(base64: any) {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  downloadFile(props: any) {
    const { base64, typeFile, fileName = 'File Not Found', blob } = props;
    let fileDownload = new Blob();
    if (blob) {
      fileDownload = blob;
    }
    if (base64) {
      let arrayBuffer = this.base64ToArrayBuffer(base64);
      fileDownload = new Blob([arrayBuffer], {
        type: typeFile,
      });
    }
    const csvUrl = URL.createObjectURL(fileDownload);
    let anchor = document.createElement('a');
    anchor.href = csvUrl;
    anchor.download = fileName;
    anchor.click();
  }
}
