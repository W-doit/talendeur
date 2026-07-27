import React from 'react';

const Imprint: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800 relative">
    <button
      onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}
      className="absolute top-6 right-6 text-talendeur-primary hover:text-talendeur-orange text-4xl font-bold focus:outline-none"
      aria-label="Close Imprint"
    >
      &times;
    </button>
    <h1 className="text-3xl font-bold mb-6">Imprint / Impressum</h1>
    <div className="space-y-6">
      <p>
        Information according to applicable disclosure requirements for website operators
        (including Impressum obligations in relevant European jurisdictions).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Legal Entity</h2>
      <p>
        <strong>Talendeur Ltd</strong>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Registered Address</h2>
      <p>
        8 Saffron House<br />
        43 Camborne Road<br />
        Sutton, SM2 6RF<br />
        United Kingdom
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>
        Email:{' '}
        <a href="mailto:info@talendeur.com" className="text-talendeur-primary underline">
          info@talendeur.com
        </a>
        <br />
        Website:{' '}
        <a href="https://talendeur.com/" className="text-talendeur-primary underline">
          https://talendeur.com/
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Responsible for Content</h2>
      <p>
        Talendeur Ltd is responsible for the content of this website within the meaning of
        applicable media and telemedia laws.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer</h2>
      <p>
        Despite careful review, we assume no liability for the content of external links.
        The operators of linked pages are solely responsible for their content.
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Company registration number and VAT ID can be added here once confirmed by the legal entity.
      </p>
    </div>
  </div>
);

export default Imprint;
