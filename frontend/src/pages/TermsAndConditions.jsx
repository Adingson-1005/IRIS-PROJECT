import '../css/LegalPages.css'

function TermsAndConditions({ onClose }) {
  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-header">
          <div>
            <h2 className="legal-title">Terms and Conditions</h2>
            <p className="legal-sub">Effective Date: June 2026 · IRIS System</p>
          </div>
          <button className="legal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="legal-body">

          <div className="legal-intro">
            Welcome to <strong>IRIS — Institutional Research Repository System</strong> of
            St. Joseph College Olongapo. By accessing and using this system, you agree to
            be bound by these Terms and Conditions. Please read them carefully.
          </div>

          <div className="legal-section">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By logging into and using IRIS, you acknowledge that you have read, understood,
              and agree to comply with these Terms and Conditions. If you do not agree, you
              must discontinue use of the system immediately.
            </p>
          </div>

          <div className="legal-section">
            <h3>2. User Accounts</h3>
            <p>
              Access to IRIS is granted exclusively by authorized administrators of
              St. Joseph College Olongapo. You are responsible for maintaining the
              confidentiality of your login credentials. You must not share your
              account with any other person.
            </p>
            <ul>
              <li>Accounts are non-transferable and for individual use only</li>
              <li>You must notify the administrator immediately of any unauthorized use</li>
              <li>The institution reserves the right to suspend or terminate accounts at any time</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>3. Acceptable Use</h3>
            <p>You agree to use IRIS only for legitimate academic and research purposes. You must not:</p>
            <ul>
              <li>Upload content that is plagiarized, falsified, or does not belong to you</li>
              <li>Attempt to access accounts or data that are not yours</li>
              <li>Use the AI features to generate fraudulent academic work</li>
              <li>Upload files containing malware, viruses, or harmful content</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the system</li>
              <li>Use the system for any commercial purpose outside the institution</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>4. Intellectual Property</h3>
            <p>
              Research papers uploaded to IRIS remain the intellectual property of their
              respective authors and St. Joseph College Olongapo. By uploading content,
              you grant the institution a non-exclusive license to store, display, and
              make accessible your work within the repository for academic purposes.
            </p>
            <p>
              You must not reproduce, distribute, or publish papers from the repository
              outside of the institution without proper attribution and authorization.
            </p>
          </div>

          <div className="legal-section">
            <h3>5. AI-Assisted Features</h3>
            <p>
              IRIS includes AI-powered features including the Research Checker and
              AI Guidance chatbot. These features are provided as academic support tools only.
              The AI outputs are not a substitute for instructor evaluation or professional
              academic judgment. The institution makes no guarantees regarding the accuracy
              of AI-generated feedback.
            </p>
          </div>

          <div className="legal-section">
            <h3>6. Research Draft Submissions</h3>
            <p>
              Files submitted through the My Drafts feature are stored securely and are
              accessible only to your assigned research instructor and system administrators.
              By submitting a draft, you consent to your instructor reviewing and commenting
              on your work within the IRIS platform.
            </p>
          </div>

          <div className="legal-section">
            <h3>7. Limitation of Liability</h3>
            <p>
              St. Joseph College Olongapo and the IRIS development team shall not be liable
              for any loss of data, unauthorized access resulting from user negligence,
              or inaccuracies in AI-generated content. The system is provided on an
              "as is" basis for academic use.
            </p>
          </div>

          <div className="legal-section">
            <h3>8. Modifications to Terms</h3>
            <p>
              The institution reserves the right to update these Terms and Conditions at
              any time. Continued use of IRIS after changes constitutes acceptance of
              the revised terms. Users will be notified of significant changes through
              the system.
            </p>
          </div>

          <div className="legal-section">
            <h3>9. Governing Law</h3>
            <p>
              These Terms and Conditions are governed by the laws of the Republic of
              the Philippines, including but not limited to the Data Privacy Act of 2012
              (Republic Act No. 10173) and applicable regulations of the National
              Privacy Commission (NPC).
            </p>
          </div>

          <div className="legal-footer-note">
            For questions regarding these Terms and Conditions, please contact the
            IRIS system administrator at St. Joseph College Olongapo.
          </div>

        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions