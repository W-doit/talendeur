import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800 relative">
    <button
      onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}
      className="absolute top-6 right-6 text-talendeur-primary hover:text-talendeur-orange text-4xl font-bold focus:outline-none"
      aria-label="Close Privacy Policy"
    >
      &times;
    </button>
    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
    <div className="space-y-6">
      <p>It is Talendeur Ltd’s policy to respect your privacy regarding any information we may collect while operating our website. This Privacy Policy applies to <a href="http://talendeur.com/" className="text-talendeur-primary underline">http://talendeur.com/</a> (hereinafter, “us”, “we”, or “http://talendeur.com/”). We respect your privacy and are committed to protecting personally identifiable information you may provide us through the Website. We have adopted this privacy policy (“Privacy Policy”) to explain what information may be collected on our Website, how we use this information, and under what circumstances we may disclose the information to third parties. This Privacy Policy applies only to information we collect through the Website and does not apply to our collection of information from other sources.</p>
      <p>This Privacy Policy, posted on our Website, set forth the general rules and policies governing your use of our Website. Depending on your activities when visiting our Website, you may be required to agree to additional terms and conditions.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Website Visitors</h2>
      <p>Like most website operators, Talendeur Ltd collects non-personally-identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. Talendeur Ltd’s purpose in collecting non-personally identifying information is to better understand how Talendeur Ltd’s visitors use its website. From time to time, Talendeur Ltd may release non-personally-identifying information in the aggregate, e.g., by publishing a report on trends in the usage of its website.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Gathering of Personally-Identifying Information</h2>
      <p>Certain visitors to Talendeur Ltd’s websites choose to interact with Talendeur Ltd in ways that require Talendeur Ltd to gather personally-identifying information. The amount and type of information that Talendeur Ltd gathers depends on the nature of the interaction. For example, we ask visitors who wants to get notified for updates at http://talendeur.com/ to provide a name and email address.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Security</h2>
      <p>The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Links to External Sites</h2>
      <p>Our Service may contain links to external sites that are not operated by us. If you click on a third party link, you will be directed to that third party’s site. We strongly advise you to review the Privacy Policy and terms and conditions of every site you visit. We have no control over, and assume no responsibility for the content, privacy policies or practices of any third party sites, products or services.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Aggregated Statistics</h2>
      <p>Talendeur Ltd may collect statistics about the behavior of visitors to its website. Talendeur Ltd may display this information publicly or provide it to others. However, Talendeur Ltd does not disclose your personally-identifying information.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Cookies</h2>
      <p>To enrich and perfect your online experience, Talendeur Ltd uses “Cookies”, similar technologies and services provided by others to display personalized content, appropriate advertising and store your preferences on your computer. A cookie is a string of information that a website stores on a visitor’s computer, and that the visitor’s browser provides to the website each time the visitor returns. Talendeur Ltd uses cookies to help Talendeur Ltd identify and track visitors, their usage of http://talendeur.com/, and their website access preferences. Talendeur Ltd visitors who do not wish to have cookies placed on their computers should set their browsers to refuse cookies before using Talendeur Ltd’s websites, with the drawback that certain features of Talendeur Ltd’s websites may not function properly without the aid of cookies. By continuing to navigate our website without changing your cookie settings, you hereby acknowledge and agree to Talendeur Ltd’s use of cookies.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Privacy Policy Changes</h2>
      <p>Although most changes are likely to be minor, Talendeur Ltd may change its Privacy Policy from time to time, and in Talendeur Ltd’s sole discretion. Talendeur Ltd encourages visitors to frequently check this page for any changes to its Privacy Policy. Your continued use of this site after any change in this Privacy Policy will constitute your acceptance of such change.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact Information</h2>
      <p>If you have any questions about this Privacy Policy, please contact us via email.</p>
    </div>
  </div>
);

export default PrivacyPolicy;
