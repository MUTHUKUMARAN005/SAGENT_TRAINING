// src/components/common/SEOHead.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ title, description, image }) => {
  const location = useLocation();

  const defaultTitle = 'KindWave - Make a Difference, Change Lives';
  const defaultDescription = 'Transparent donation platform connecting donors with verified NGOs across India. Track your donations, see real impact.';
  const defaultImage = 'https://images.unsplash.com/photo-1593113630400-ea4288922497?w=1200';

  const pageTitle = title ? `${title} | KindWave` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;
  const pageUrl = `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Update meta tags
    const metaTags = {
      'description': pageDescription,
      'og:title': pageTitle,
      'og:description': pageDescription,
      'og:image': pageImage,
      'og:url': pageUrl,
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': pageTitle,
      'twitter:description': pageDescription,
      'twitter:image': pageImage,
    };

    Object.entries(metaTags).forEach(([name, content]) => {
      const isOg = name.startsWith('og:') || name.startsWith('twitter:');
      const attr = isOg ? 'property' : 'name';

      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);
  }, [pageTitle, pageDescription, pageImage, pageUrl]);

  return null;
};

export default SEOHead;