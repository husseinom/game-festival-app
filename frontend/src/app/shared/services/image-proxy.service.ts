import { Injectable, inject } from '@angular/core'
import { environment } from '@env/environment'

@Injectable({
  providedIn: 'root'
})
export class ImageProxyService {
  
  /**
   * Proxy une URL d'image externe via le backend
   * @param imageUrl - L'URL complète de l'image externe
   * @returns L'URL du proxy pour afficher l'image
   */
  getProxyUrl(imageUrl: string): string {
    if (!imageUrl) {
      return ''
    }
    
    const encodedUrl = encodeURIComponent(imageUrl)
    return `${environment.apiUrl}/images/proxy?url=${encodedUrl}`
  }
}
