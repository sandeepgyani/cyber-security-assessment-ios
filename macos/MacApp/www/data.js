// PCS Compliance Assessment - data catalog
// Compliance catalogs and per-compliance questionnaire bank.

var STATUS_OPTIONS = ["Not Implemented", "Partially Implemented", "Fully Implemented", "Not Applicable"];
var VAPT_FREQ_OPTIONS = ["Quarterly", "Half-yearly", "Annually", "Ad-hoc / None"];
var CERT_STATUS_OPTIONS = ["Not Started", "In Progress", "Certified / Obtained", "Expired / Needs Renewal"];
var MATURITY_OPTIONS = ["Initial (ad-hoc)", "Developing", "Defined", "Managed", "Optimized"];

var INDIA_COMPLIANCES = [
  {
    group: "Banking, Financial & Insurance Sector",
    items: [
      { id: "rbi_csf", name: "RBI Cyber Security Framework for Banks (2016)" },
      { id: "rbi_dpsc", name: "RBI Guidelines on Digital Payments Security Controls (2021)" },
      { id: "data_localization", name: "Data Localization Requirements (2018)" },
      { id: "irdai", name: "IRDAI Guidelines on Information and Cyber Security (2023)" }
    ]
  },
  {
    group: "Healthcare Sector",
    items: [
      { id: "disha", name: "Digital Information Security in Healthcare Act (DISHA)" },
      { id: "telemedicine", name: "Telemedicine Practice Guidelines (2020)" },
      { id: "abdm", name: "Ayushman Bharat Digital Mission (ABDM)" }
    ]
  },
  {
    group: "Telecommunications Sector",
    items: [
      { id: "ncsp", name: "National Cyber Security Policy (2013)" },
      { id: "telecom_sec_req", name: "Telecom Security Requirements (2021)" },
      { id: "telecom_cert", name: "Mandatory Testing and Certification of Telecom Equipment (2019)" },
      { id: "telecom_cyber_rules", name: "Telecommunications (Telecom Cyber Security) Rules (2024)" }
    ]
  },
  {
    group: "Critical Infrastructure Protection",
    items: [
      { id: "cii", name: "Critical Information Infrastructure Protection (IT Act Sec. 70 & sector guidelines)" }
    ]
  },
  {
    group: "E-Governance & Digital Services",
    items: [
      { id: "gigw", name: "Guidelines for Indian Government Websites (GIGW)" },
      { id: "cert_in", name: "CERT-In Guidelines" }
    ]
  },
  {
    group: "Data Protection & Privacy",
    items: [
      { id: "dpdp", name: "Digital Personal Data Protection Act, 2023 (DPDP)" }
    ]
  },
  {
    group: "Securities Market",
    items: [
      { id: "sebi_cscrf", name: "SEBI Cybersecurity and Cyber Resilience Framework (2024)" }
    ]
  }
];

var GLOBAL_COMPLIANCES = [
  {
    group: "Global Security & Privacy Compliances",
    items: [
      { id: "gdpr", name: "GDPR (General Data Protection Regulation)" },
      { id: "ccpa", name: "CCPA / CPRA" },
      { id: "nis2", name: "NIS2 Directive" },
      { id: "dora", name: "Digital Operational Resilience Act (DORA)" },
      { id: "nist_csf", name: "NIST Cybersecurity Framework (CSF)" },
      { id: "pci_dss", name: "PCI DSS" },
      { id: "iso27001", name: "ISO / IEC 27001" },
      { id: "nist_ssdf", name: "NIST Secure Software Development Framework (SSDF)" },
      { id: "soc2", name: "SOC 2 (Service Organization Control 2)" },
      { id: "basel3", name: "Basel III Operational Risk Framework" },
      { id: "hipaa", name: "HIPAA (Health Insurance Portability and Accountability Act)" },
      { id: "fda_med", name: "FDA Cybersecurity in Medical Devices" },
      { id: "fedramp", name: "FedRAMP" },
      { id: "cis", name: "CIS Critical Security Controls" }
    ]
  }
];

// Human-readable name lookup, built from both catalogs.
var COMPLIANCE_NAME_LOOKUP = {};
[INDIA_COMPLIANCES, GLOBAL_COMPLIANCES].forEach(function (catalog) {
  catalog.forEach(function (grp) {
    grp.items.forEach(function (item) {
      COMPLIANCE_NAME_LOOKUP[item.id] = item.name;
    });
  });
});

// Infrastructure & security landscape survey (Step 2).
// Sections of fields; type 'dropdown' (single choice) or 'multi' (checkbox group).
var INFRA_SECTIONS = [
  {
    title: "Endpoints",
    fields: [
      { id: "ep_count", label: "Approximate number of endpoints (laptops, desktops, mobiles)", type: "dropdown",
        options: ["Fewer than 50", "50 – 250", "250 – 1,000", "1,000 – 5,000", "More than 5,000"] },
      { id: "ep_types", label: "Endpoint types in use", type: "multi",
        options: ["Windows", "macOS", "Linux", "Corporate mobile devices", "BYOD / personal devices", "Servers (physical / virtual)"] },
      { id: "ep_protection", label: "Endpoint protection in place", type: "dropdown",
        options: ["None / basic antivirus", "Managed antivirus", "EDR (Endpoint Detection & Response)", "MDR / XDR service"] },
      { id: "ep_patch", label: "Patch management approach", type: "dropdown",
        options: ["Ad-hoc / manual", "Partially automated", "Fully automated patching"] }
    ]
  },
  {
    title: "Applications",
    fields: [
      { id: "app_portfolio", label: "Application portfolio", type: "multi",
        options: ["Customer-facing web applications", "Mobile applications", "Internal business applications", "ERP / CRM platforms (SAP, Oracle, Salesforce...)", "Legacy / end-of-life systems", "In-house developed software"] },
      { id: "app_hosting", label: "Where are applications hosted?", type: "multi",
        options: ["On-premise data centre", "Public cloud", "SaaS subscriptions", "Co-location / hosted"] },
      { id: "app_critical", label: "Business-critical applications (approx.)", type: "dropdown",
        options: ["1 – 5", "6 – 20", "21 – 50", "More than 50"] }
    ]
  },
  {
    title: "Network",
    fields: [
      { id: "net_perimeter", label: "Network perimeter security", type: "dropdown",
        options: ["Basic router / firewall", "Enterprise firewall", "Next-gen firewall (NGFW) with IPS", "Zero-trust architecture"] },
      { id: "net_segmentation", label: "Network segmentation", type: "dropdown",
        options: ["Flat network (no segmentation)", "Partially segmented", "Fully segmented / micro-segmentation"] },
      { id: "net_remote", label: "Remote access methods", type: "multi",
        options: ["Corporate VPN", "ZTNA / SASE", "Exposed RDP / direct access", "No remote access provided"] },
      { id: "net_sites", label: "Number of office locations / branches", type: "dropdown",
        options: ["Single office", "2 – 5 locations", "6 – 20 locations", "More than 20 locations"] }
    ]
  },
  {
    title: "Cloud",
    fields: [
      { id: "cloud_providers", label: "Cloud platforms in use", type: "multi",
        options: ["AWS", "Microsoft Azure", "Google Cloud", "Other cloud provider", "Private cloud", "None – fully on-premise"] },
      { id: "cloud_sensitive", label: "Sensitive data stored in cloud", type: "dropdown",
        options: ["No sensitive data in cloud", "Some sensitive data", "Most / all sensitive data"] },
      { id: "cloud_security", label: "Cloud security tooling", type: "dropdown",
        options: ["None", "Cloud provider native tools", "Dedicated CSPM / cloud security tooling"] }
    ]
  },
  {
    title: "Third-Party Vendors",
    fields: [
      { id: "vendor_access", label: "Third-party vendors with access to systems or data", type: "dropdown",
        options: ["None", "1 – 10", "11 – 50", "More than 50"] },
      { id: "vendor_risk", label: "Vendor security risk assessments", type: "dropdown",
        options: ["No formal assessment", "Assessed at onboarding only", "Periodic risk assessments"] },
      { id: "vendor_contracts", label: "Security / data-protection clauses in vendor contracts", type: "dropdown",
        options: ["No", "Some contracts", "Yes – all contracts"] }
    ]
  },
  {
    title: "Workforce & Remote Work",
    fields: [
      { id: "wf_headcount", label: "Total employees", type: "dropdown",
        options: ["Fewer than 50", "50 – 250", "250 – 1,000", "1,000 – 5,000", "More than 5,000"] },
      { id: "wf_remote", label: "Remote / work-from-home staff", type: "dropdown",
        options: ["No remote working", "Up to 25% remote / hybrid", "25 – 75% remote / hybrid", "Fully remote"] },
      { id: "wf_devices", label: "Devices used by remote staff", type: "dropdown",
        options: ["Corporate-managed devices only", "Mix of corporate and personal (BYOD)", "Personal devices only"] },
      { id: "wf_training", label: "Security awareness training", type: "dropdown",
        options: ["No formal training", "Annual awareness training", "Quarterly / continuous programme"] }
    ]
  },
  {
    title: "Security Operations",
    fields: [
      { id: "sec_team", label: "Security team / leadership", type: "dropdown",
        options: ["No dedicated security resource", "Outsourced / part-time", "In-house security team", "In-house team with CISO"] },
      { id: "sec_monitoring", label: "Security monitoring", type: "dropdown",
        options: ["No central monitoring", "Log collection only", "SIEM in place", "24x7 SOC (in-house or managed)"] },
      { id: "sec_backup", label: "Backup & disaster recovery", type: "dropdown",
        options: ["No formal backups", "Backups, not tested", "Backups with tested DR plan"] },
      { id: "sec_insurance", label: "Cyber insurance cover", type: "dropdown",
        options: ["No", "Under evaluation", "Yes"] }
    ]
  },
  {
    title: "Data & Incident History",
    fields: [
      { id: "data_types", label: "Types of sensitive data handled", type: "multi",
        options: ["Personal data (PII)", "Payment / card data", "Health records", "Financial data", "Government / regulated data", "Intellectual property"] },
      { id: "data_incidents", label: "Security incidents in the last 24 months", type: "dropdown",
        options: ["None", "Minor incidents", "Major incident(s)", "Prefer not to say"] }
    ]
  }
];

// Question bank: complianceId -> array of { id, text, type: 'checkbox'|'dropdown', options? }
var QUESTION_BANK = {

  rbi_csf: [
    { id: "q1", text: "Board-approved cyber security policy status", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "We have a dedicated Cyber Security Operations Centre (C-SOC/SOC) monitoring 24x7", type: "checkbox" },
    { id: "q3", text: "Maturity of the Cyber Crisis Management Plan (CCMP)", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q4", text: "Cyber incidents are reported to RBI within prescribed timelines (2-6 hours)", type: "checkbox" },
    { id: "q5", text: "Frequency of Vulnerability Assessment & Penetration Testing (VAPT)", type: "dropdown", options: VAPT_FREQ_OPTIONS }
  ],
  rbi_dpsc: [
    { id: "q1", text: "Multi-factor authentication is enforced for all digital payment transactions", type: "checkbox" },
    { id: "q2", text: "Status of transaction monitoring / fraud risk management system", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Card / PIN data is tokenized or encrypted end-to-end", type: "checkbox" },
    { id: "q4", text: "Maturity of customer security awareness communication programme", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q5", text: "Application whitelisting and anti-malware controls are deployed on payment infrastructure", type: "checkbox" }
  ],
  data_localization: [
    { id: "q1", text: "All payment system data is stored exclusively on servers located in India", type: "checkbox" },
    { id: "q2", text: "Status of cross-border data flow mapping and mirroring compliance", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "A compliance certificate confirming data localization has been submitted to RBI", type: "checkbox" }
  ],
  irdai: [
    { id: "q1", text: "Status of Chief Information Security Officer (CISO) appointment", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "Cyber security policy is approved by the Board / Risk Management Committee", type: "checkbox" },
    { id: "q3", text: "Maturity of policyholder data protection controls", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q4", text: "Cyber incident reporting process to IRDAI is documented and tested", type: "checkbox" }
  ],

  disha: [
    { id: "q1", text: "Patient health records are encrypted at rest and in transit", type: "checkbox" },
    { id: "q2", text: "Status of patient consent management for data sharing", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "A designated health data controller / custodian role has been assigned", type: "checkbox" },
    { id: "q4", text: "Maturity of breach notification process for health data incidents", type: "dropdown", options: MATURITY_OPTIONS }
  ],
  telemedicine: [
    { id: "q1", text: "Teleconsultations follow prescribed practitioner-patient identification protocols", type: "checkbox" },
    { id: "q2", text: "Status of e-prescription record retention process", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Patient consent is captured and stored prior to teleconsultation", type: "checkbox" }
  ],
  abdm: [
    { id: "q1", text: "Facility / practitioner is registered on ABDM's Health Facility Registry or Healthcare Professionals Registry", type: "checkbox" },
    { id: "q2", text: "Status of ABHA (health ID) integration and consent-manager based data sharing", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Data is exchanged only via ABDM-approved consent artefacts", type: "checkbox" }
  ],

  ncsp: [
    { id: "q1", text: "Status of organisational alignment to National Cyber Security Policy objectives", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "A Chief Information Security Officer (CISO) has been designated", type: "checkbox" }
  ],
  telecom_sec_req: [
    { id: "q1", text: "Network equipment is sourced only from Trusted Sources / Trusted Products as notified", type: "checkbox" },
    { id: "q2", text: "Maturity of network security testing prior to equipment deployment", type: "dropdown", options: MATURITY_OPTIONS }
  ],
  telecom_cert: [
    { id: "q1", text: "All telecom equipment deployed has valid MTCTE certification", type: "checkbox" },
    { id: "q2", text: "Status of equipment certification renewal tracking", type: "dropdown", options: STATUS_OPTIONS }
  ],
  telecom_cyber_rules: [
    { id: "q1", text: "Security incidents are reported to the Government within prescribed timelines", type: "checkbox" },
    { id: "q2", text: "Status of traceability / mandatory KYC controls for telecom identifiers", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "A Chief Telecom Security Officer has been appointed", type: "checkbox" }
  ],

  cii: [
    { id: "q1", text: "Status of Critical Information Infrastructure (CII) designation assessment for our systems", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "Security incidents are reported to NCIIPC as applicable", type: "checkbox" }
  ],

  gigw: [
    { id: "q1", text: "Website / portal complies with GIGW accessibility and security guidelines", type: "checkbox" },
    { id: "q2", text: "Status of periodic security audit certification (CERT-In empanelled auditor)", type: "dropdown", options: STATUS_OPTIONS }
  ],
  cert_in: [
    { id: "q1", text: "Cyber security incidents are reported to CERT-In within 6 hours of detection", type: "checkbox" },
    { id: "q2", text: "Status of ICT system logs retention (180 days as mandated)", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "A designated Point of Contact with CERT-In has been established", type: "checkbox" }
  ],

  dpdp: [
    { id: "q1", text: "Status of consent management framework for personal data processing", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "A Data Protection Officer / grievance redressal contact has been designated (if Significant Data Fiduciary)", type: "checkbox" },
    { id: "q3", text: "Maturity of data breach notification process to the Data Protection Board", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q4", text: "Children's data / parental consent processes comply with DPDP requirements", type: "checkbox" },
    { id: "q5", text: "Cross-border data transfer restrictions (if any notified) are being tracked", type: "checkbox" }
  ],

  sebi_cscrf: [
    { id: "q1", text: "Status of Cyber Crisis Management Plan under SEBI CSCRF", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "VAPT is conducted at the frequency prescribed by SEBI", type: "checkbox" },
    { id: "q3", text: "Cyber security incidents are reported to SEBI / stock exchanges within prescribed timelines", type: "checkbox" }
  ],

  gdpr: [
    { id: "q1", text: "Status of lawful basis documentation for personal data processing", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "A Data Protection Officer (DPO) has been appointed (where required)", type: "checkbox" },
    { id: "q3", text: "Maturity of Data Protection Impact Assessment (DPIA) process", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q4", text: "Breach notification process meets the 72-hour supervisory authority requirement", type: "checkbox" },
    { id: "q5", text: "Data subject rights (access, erasure, portability) requests can be fulfilled within statutory timelines", type: "checkbox" }
  ],
  ccpa: [
    { id: "q1", text: "Consumers can exercise 'Do Not Sell/Share My Personal Information' rights", type: "checkbox" },
    { id: "q2", text: "Status of consumer data request (access / deletion) fulfilment process", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Privacy policy discloses categories of personal information collected and sold/shared", type: "checkbox" }
  ],
  nis2: [
    { id: "q1", text: "Status of NIS2 risk management measures (Art. 21) implementation", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q2", text: "Significant incidents are reported within the 24-hour early warning / 72-hour notification timelines", type: "checkbox" },
    { id: "q3", text: "Supply chain / third-party ICT risk is formally assessed", type: "checkbox" }
  ],
  dora: [
    { id: "q1", text: "Maturity of ICT risk management framework", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q2", text: "A register of information on all ICT third-party providers is maintained", type: "checkbox" },
    { id: "q3", text: "Digital operational resilience testing (incl. threat-led penetration testing) is performed", type: "checkbox" },
    { id: "q4", text: "Status of ICT incident classification and reporting process", type: "dropdown", options: STATUS_OPTIONS }
  ],
  nist_csf: [
    { id: "q1", text: "Overall maturity across the Identify function", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q2", text: "Overall maturity across the Protect function", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q3", text: "Overall maturity across the Detect function", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q4", text: "Overall maturity across the Respond function", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q5", text: "Overall maturity across the Recover function", type: "dropdown", options: MATURITY_OPTIONS }
  ],
  pci_dss: [
    { id: "q1", text: "Cardholder Data Environment (CDE) scope has been formally documented", type: "checkbox" },
    { id: "q2", text: "Status of latest PCI DSS Report on Compliance / SAQ", type: "dropdown", options: CERT_STATUS_OPTIONS },
    { id: "q3", text: "Quarterly ASV vulnerability scans are performed on external-facing systems", type: "checkbox" },
    { id: "q4", text: "Cardholder data is encrypted in transit and at rest", type: "checkbox" }
  ],
  iso27001: [
    { id: "q1", text: "Status of ISMS certification", type: "dropdown", options: CERT_STATUS_OPTIONS },
    { id: "q2", text: "A Statement of Applicability and risk treatment plan are maintained", type: "checkbox" },
    { id: "q3", text: "Internal audits and management reviews are conducted per ISO 27001 clause requirements", type: "checkbox" }
  ],
  nist_ssdf: [
    { id: "q1", text: "Secure coding practices are enforced across the SDLC", type: "checkbox" },
    { id: "q2", text: "Status of Software Bill of Materials (SBOM) generation for released software", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Static/dynamic application security testing (SAST/DAST) is integrated into the pipeline", type: "checkbox" }
  ],
  soc2: [
    { id: "q1", text: "Status of SOC 2 report", type: "dropdown", options: CERT_STATUS_OPTIONS },
    { id: "q2", text: "Trust Service Criteria beyond Security (Availability / Confidentiality / Processing Integrity / Privacy) are in scope", type: "checkbox" }
  ],
  basel3: [
    { id: "q1", text: "Maturity of operational risk capital calculation (Standardised Measurement Approach)", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q2", text: "A loss event database for operational risk incidents is maintained", type: "checkbox" }
  ],
  hipaa: [
    { id: "q1", text: "Administrative, physical and technical safeguards for PHI are documented", type: "checkbox" },
    { id: "q2", text: "Status of Business Associate Agreements (BAAs) with vendors handling PHI", type: "dropdown", options: STATUS_OPTIONS },
    { id: "q3", text: "Breach notification process complies with the HIPAA Breach Notification Rule", type: "checkbox" },
    { id: "q4", text: "Maturity of periodic HIPAA risk assessment", type: "dropdown", options: MATURITY_OPTIONS }
  ],
  fda_med: [
    { id: "q1", text: "Premarket cybersecurity documentation (SBOM, threat model) is prepared for device submissions", type: "checkbox" },
    { id: "q2", text: "Maturity of postmarket vulnerability monitoring and patching process", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q3", text: "A coordinated vulnerability disclosure process is in place", type: "checkbox" }
  ],
  fedramp: [
    { id: "q1", text: "Status of FedRAMP authorization", type: "dropdown", options: CERT_STATUS_OPTIONS },
    { id: "q2", text: "Continuous monitoring (ConMon) deliverables are submitted per FedRAMP schedule", type: "checkbox" },
    { id: "q3", text: "A Plan of Action & Milestones (POA&M) is actively tracked", type: "checkbox" }
  ],
  cis: [
    { id: "q1", text: "Maturity of Implementation Group (IG1/IG2/IG3) adoption of CIS Controls", type: "dropdown", options: MATURITY_OPTIONS },
    { id: "q2", text: "Asset inventory (hardware & software) is maintained (CIS Controls 1 & 2)", type: "checkbox" },
    { id: "q3", text: "A continuous vulnerability management programme is in place (CIS Control 7)", type: "checkbox" }
  ]
};
