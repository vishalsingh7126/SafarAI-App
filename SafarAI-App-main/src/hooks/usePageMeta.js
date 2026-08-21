import { useEffect } from 'react';

/**
 * usePageMeta — keeps document title + description in sync per route.
 * (Signature preserved from the original implementation.)
 */
function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;

    if (!description) return;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
  }, [title, description]);
}

export default usePageMeta;
