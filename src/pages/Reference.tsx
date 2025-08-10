import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Reference() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  useEffect(() => {
    const title = 'Job Reference | Provide Reference';
    const desc = 'Secure reference submission for job applicants.';
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    const canonicalHref = `${window.location.origin}/reference`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);
  }, [location.search]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Provide a Job Reference</h1>
      </header>
      <main>
        <section className="space-y-4">
          {token ? (
            <>
              <p>
                Thank you for agreeing to provide a reference. This secure link is associated with your request.
              </p>
              <p>
                The reference form will appear here. If you believe you reached this page in error, please contact the requester.
              </p>
              <aside className="text-sm opacity-70">
                Reference token: <code>{token}</code>
              </aside>
            </>
          ) : (
            <p>
              Your secure reference link is missing or invalid. Please use the link provided in your email.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
