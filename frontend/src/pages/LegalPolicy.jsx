import '../css/LegalPages.css'

function LegalPolicy({ onClose }) {
  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-header">
          <div>
            <h2 className="legal-title">Privacy Policy</h2>
            <p className="legal-sub">Effective Date: June 2026 · IRIS System · In accordance with R.A. 10173</p>
          </div>
          <button className="legal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="legal-body">

          <div className="legal-intro">
            St. Joseph College Olongapo is committed to protecting the privacy and
            personal data of all IRIS users in compliance with the
            <strong> Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and
            the regulations of the National Privacy Commission (NPC).
          </div>

          <div className="legal-section">
            <h3>1. Data Controller</h3>
            <p>
              The personal data collected through IRIS is controlled by:
            </p>
            <div className="legal-info-box">
              <p><strong>St. Joseph College Olongapo</strong></p>
              <p>Olongapo City, Zambales, Philippines</p>
            </div>
          </div>

          <div className="legal-section">
            <h3>2. Data Protection Officer (DPO)</h3>
            <p>
              In compliance with the Data Privacy Act of 2012, St. Joseph College Olongapo
              has designated a Data Protection Officer responsible for overseeing data
              privacy compliance:
            </p>
            <div className="legal-info-box">
              <p><strong>Data Protection Officer</strong></p>
              <p>Name: [DPO Name — To Be Designated]</p>
              <p>Email: dpo@sjcolongapo.edu.ph</p>
              <p>Office: St. Joseph College Olongapo, Administration Office</p>
            </div>
          </div>

          <div className="legal-section">
            <h3>3. Personal Data We Collect</h3>
            <p>IRIS collects the following personal data:</p>
            <ul>
              <li><strong>Account information:</strong> Full name, email address, role (student/instructor/admin)</li>
              <li><strong>Class information:</strong> Your assigned research class</li>
              <li><strong>Usage data:</strong> Search queries, paper downloads, login timestamps</li>
              <li><strong>Uploaded files:</strong> Research draft documents submitted through My Drafts</li>
              <li><strong>AI interaction data:</strong> Research questions asked to the AI guidance system</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>4. Purpose of Data Collection</h3>
            <p>Your personal data is collected and processed for the following purposes:</p>
            <ul>
              <li>To authenticate your identity and provide role-appropriate access</li>
              <li>To facilitate academic research paper discovery and retrieval</li>
              <li>To enable instructor feedback on student research drafts</li>
              <li>To provide AI-assisted research guidance and evaluation</li>
              <li>To generate anonymous usage analytics for system improvement</li>
              <li>To maintain the security and integrity of the system</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>5. Legal Basis for Processing</h3>
            <p>
              Personal data is processed on the following legal bases under the
              Data Privacy Act of 2012:
            </p>
            <ul>
              <li><strong>Consent:</strong> You provide consent by using the IRIS system</li>
              <li><strong>Legitimate interest:</strong> Academic administration and research repository management</li>
              <li><strong>Contractual necessity:</strong> To fulfill the institution's academic service obligations</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>6. Data Sharing and Third Parties</h3>
            <p>Your data may be shared with the following third-party services strictly for operational purposes:</p>
            <ul>
              <li><strong>Supabase</strong> — Cloud database and file storage (servers in Singapore region)</li>
              <li><strong>Render</strong> — Backend application hosting (United States)</li>
              <li><strong>Vercel</strong> — Frontend application hosting (Global CDN)</li>
              <li><strong>Groq Inc.</strong> — AI inference processing for Research Checker and Guidance features</li>
            </ul>
            <p>
              All third-party providers are bound by their own privacy policies and
              data processing agreements. Personal data is never sold to third parties.
            </p>
          </div>

          <div className="legal-section">
            <h3>7. Data Retention</h3>
            <p>
              Personal data is retained for the duration of your enrollment or employment
              at St. Joseph College Olongapo, plus a reasonable period thereafter for
              academic records purposes. Research papers and submissions may be retained
              indefinitely as part of the institutional academic record.
            </p>
            <p>
              You may request deletion of your personal data by contacting the DPO,
              subject to the institution's legal obligations to retain certain records.
            </p>
          </div>

          <div className="legal-section">
            <h3>8. Your Rights Under R.A. 10173</h3>
            <p>As a data subject, you have the following rights:</p>
            <ul>
              <li><strong>Right to be informed</strong> — Know what data is collected and why</li>
              <li><strong>Right to access</strong> — Request a copy of your personal data</li>
              <li><strong>Right to rectification</strong> — Request correction of inaccurate data</li>
              <li><strong>Right to erasure</strong> — Request deletion of your data (subject to legal obligations)</li>
              <li><strong>Right to data portability</strong> — Receive your data in a structured format</li>
              <li><strong>Right to object</strong> — Object to certain types of data processing</li>
              <li><strong>Right to lodge a complaint</strong> — File a complaint with the National Privacy Commission</li>
            </ul>
            <p>To exercise any of these rights, contact the DPO at the details provided above.</p>
          </div>

          <div className="legal-section">
            <h3>9. Data Security</h3>
            <p>
              IRIS implements the following security measures to protect your personal data:
            </p>
            <ul>
              <li>All passwords are hashed using bcrypt — never stored in plain text</li>
              <li>All data transmission is encrypted via HTTPS/TLS</li>
              <li>Authentication uses JWT tokens with 24-hour expiry</li>
              <li>Role-based access control prevents unauthorized data access</li>
              <li>File storage uses Supabase's secure cloud infrastructure</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>10. Cookies and Local Storage</h3>
            <p>
              IRIS uses browser localStorage to store your authentication token and
              session preferences. No tracking cookies are used. Your recent search
              history is stored locally on your device only and is not transmitted
              to any server.
            </p>
          </div>

          <div className="legal-section">
            <h3>11. Changes to This Policy</h3>
            <p>
              This Privacy Policy may be updated to reflect changes in the system or
              applicable law. The effective date at the top of this document will be
              updated accordingly. Significant changes will be communicated through
              the system.
            </p>
          </div>

          <div className="legal-section">
            <h3>12. Contact and Complaints</h3>
            <p>
              For privacy concerns, data requests, or complaints, contact the
              Data Protection Officer at the details in Section 2. You also have the
              right to lodge a complaint directly with the National Privacy Commission:
            </p>
            <div className="legal-info-box">
              <p><strong>National Privacy Commission</strong></p>
              <p>Website: www.privacy.gov.ph</p>
              <p>Email: info@privacy.gov.ph</p>
            </div>
          </div>

          <div className="legal-footer-note">
            This Privacy Policy is compliant with the Data Privacy Act of 2012
            (Republic Act No. 10173) and the implementing rules and regulations
            of the National Privacy Commission of the Philippines.
          </div>

        </div>
      </div>
    </div>
  )
}

export default LegalPolicy