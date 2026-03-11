/**
 * Utility functions for managing dynamic meta tags for social media sharing
 */

export interface MetaTagConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
  keywords?: string[];
}

/**
 * Update Open Graph and Twitter Card meta tags dynamically
 */
export function updateMetaTags(config: MetaTagConfig) {
  const {
    title,
    description,
    image,
    url = window.location.href,
    type = 'profile',
    keywords = []
  } = config;

  // Update document title
  document.title = title;

  // Update or create meta tags
  updateOrCreateMetaTag('meta', 'name', 'description', description);
  
  // Keywords for SEO
  if (keywords.length > 0) {
    updateOrCreateMetaTag('meta', 'name', 'keywords', keywords.join(', '));
  }
  
  // Open Graph tags
  updateOrCreateMetaTag('meta', 'property', 'og:title', title);
  updateOrCreateMetaTag('meta', 'property', 'og:description', description);
  updateOrCreateMetaTag('meta', 'property', 'og:type', type);
  updateOrCreateMetaTag('meta', 'property', 'og:url', url);
  updateOrCreateMetaTag('meta', 'property', 'og:site_name', 'Talendeur');
  
  if (image) {
    // Ensure image URL is absolute
    const absoluteImageUrl = image.startsWith('http') 
      ? image 
      : `${window.location.origin}${image}`;
    updateOrCreateMetaTag('meta', 'property', 'og:image', absoluteImageUrl);
    updateOrCreateMetaTag('meta', 'property', 'og:image:secure_url', absoluteImageUrl);
    updateOrCreateMetaTag('meta', 'property', 'og:image:width', '1200');
    updateOrCreateMetaTag('meta', 'property', 'og:image:height', '630');
    updateOrCreateMetaTag('meta', 'property', 'og:image:alt', title);
  }
  
  // Twitter Card tags
  updateOrCreateMetaTag('meta', 'name', 'twitter:card', 'summary_large_image');
  updateOrCreateMetaTag('meta', 'name', 'twitter:title', title);
  updateOrCreateMetaTag('meta', 'name', 'twitter:description', description);
  
  if (image) {
    const absoluteImageUrl = image.startsWith('http') 
      ? image 
      : `${window.location.origin}${image}`;
    updateOrCreateMetaTag('meta', 'name', 'twitter:image', absoluteImageUrl);
  }
}

/**
 * Helper function to update or create a meta tag
 */
function updateOrCreateMetaTag(
  tagName: string,
  attributeName: string,
  attributeValue: string,
  content: string
) {
  let element = document.querySelector(
    `${tagName}[${attributeName}="${attributeValue}"]`
  ) as HTMLMetaElement;

  if (!element) {
    element = document.createElement(tagName) as HTMLMetaElement;
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Reset meta tags to default
 */
export function resetMetaTags() {
  updateMetaTags({
    title: 'Talendeur - Match Your Talent',
    description: 'Modern talent matching platform connecting job seekers with organizations',
    image: '/Talendeur_logo.png',
    type: 'website',
  });
}
