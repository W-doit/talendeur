import React from 'react';

const CookiePolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800 relative">
    <button
      onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}
      className="absolute top-6 right-6 text-talendeur-primary hover:text-talendeur-orange text-4xl font-bold focus:outline-none"
      aria-label="Close Cookie Policy"
    >
      &times;
    </button>
    <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
    <div className="space-y-6">
      <p>
        This Cookie Policy explains how Talendeur Ltd (“we”, “us”) uses cookies and similar
        technologies on <a href="https://talendeur.com/" className="text-talendeur-primary underline">talendeur.com</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the
        site function, remember preferences, and (with your consent) measure usage.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">How we use cookies</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Essential cookies</strong> — required for security, authentication, and core
          site features. These do not require consent.
        </li>
        <li>
          <strong>Analytics cookies</strong> — optional. Used only if you click Accept on our
          consent banner. They help us understand how the product is used so we can improve it.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Your choices</h2>
      <p>
        On your first visit you can Accept or Reject non-essential cookies. You can change your
        mind anytime via the “Cookie preferences” link in the website footer.
      </p>
      <p>
        If you reject analytics, we will not load Google Analytics or similar non-essential
        tracking scripts.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">More information</h2>
      <p>
        For broader data practices, see our{' '}
        <a href="/privacy-policy" className="text-talendeur-primary underline">Privacy Policy</a>.
        Questions: <a href="mailto:info@talendeur.com" className="text-talendeur-primary underline">info@talendeur.com</a>.
      </p>
    </div>
  </div>
);

export default CookiePolicy;
