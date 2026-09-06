import { useEffect } from 'react';
import { canonicalFor, type RouteMeta } from './routeMeta';

/**
 * Keeps the document head in step with the current route.
 *
 * Every tag is looked up and mutated in place, never appended, so navigating
 * around the app cannot accumulate duplicate description or canonical tags.
 * index.html ships a static copy of the same tags so a crawler that does not
 * execute JavaScript still gets sensible metadata for the front door.
 */
function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function useDocumentMeta(route: RouteMeta, pathname: string) {
  useEffect(() => {
    document.title = route.title;

    // A route that renders nothing meaningful without the visitor's own
    // IndexedDB is told not to index, so search engines do not publish blank
    // pages under this domain.
    const robots = route.indexable ? 'index, follow' : 'noindex, follow';

    setMeta('meta[name="description"]', 'name', 'description', route.description);
    setMeta('meta[name="robots"]', 'name', 'robots', robots);

    // Unknown URLs have no canonical document. Match the static 404 head,
    // including after navigating from a known route within the app.
    if (route.path === '*') {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    } else {
      const canonical = canonicalFor(route.path);
      setCanonical(canonical);
      setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    }

    setMeta('meta[property="og:title"]', 'property', 'og:title', route.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', route.description);
  }, [route, pathname]);
}
