import { defaultErrorData } from './defaultData';
import { getDefaultError } from './util';
import { Fn } from './types';

interface tagNameMapsType {
  [key: string]: string
}

const tagNameMaps: tagNameMapsType = {
  SCRIPT: 'js',
  IMG: 'image',
  LINK: 'css'
}

export const collectionCdnError = (resolve:Fn) => {
  window.addEventListener('error', (event:Event) => {
    const node = event.srcElement as HTMLElement;
    if(node) {
      const tagName = node.tagName || '';
      const tagNameUpper: string = tagName.toUpperCase();
      let url:string | null = '';
      switch(tagNameUpper) {
        case 'IMG':
        case 'SCRIPT':
          url = node.getAttribute('src') || '';
          break;
        case 'LINK':
          url = node.getAttribute('href') || '';
          break;
      }
      
      const data: object = Object.assign(defaultErrorData, getDefaultError(), {
        url,
        tagName: tagNameMaps[tagNameUpper],
        type: 'CDN',
        from: 'cdn onError'
      });
  
      resolve(data);
    }    
  }, true);
}