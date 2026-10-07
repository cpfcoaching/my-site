const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, AlignmentType, LevelFormat, PageNumber,
  BorderStyle, WidthType, ShadingType, PageBreak, ExternalHyperlink
} = require("docx");

const output = path.resolve(__dirname, "../static/resources/soc2-type2-consultant-implementation-guide.docx");
const teal = "008F83", navy = "16324A", pale = "E8F4F3", blue = "2F75B5", gray = "5B6573";
const border = { style: BorderStyle.SINGLE, size: 1, color: "B8C4D0" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, width, header = false) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: header ? { fill: navy, type: ShadingType.CLEAR } : undefined,
  margins: { top: 90, bottom: 90, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : "000000", size: 19 })] })]
});
const heading = (text, level = 1, pageBreakBefore = false) => new Paragraph({
  heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
  pageBreakBefore,
  children: [new TextRun(text)]
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, bold: !!opts.bold, italics: !!opts.italics, color: opts.color || "000000" })]
});
const bullet = text => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun(text)] });
const numbered = text => new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun(text)] });

const rules = [
  ["Management owns the control", "The consultant may design, configure, coach, test readiness, and organize evidence. A named management owner must approve the control and remain accountable for operation."],
  ["Do not backdate or manufacture evidence", "If evidence does not exist, mark the control missing or implemented without verified evidence. Start clean operation and record the actual date."],
  ["Preserve exceptions", "Do not replace failed samples, remove inconvenient records, or hide missed control occurrences. Record impact, owner, decision, correction, and closure proof."],
  ["Match the control to real work", "The control description must reflect a process that people and systems can repeat. Do not write an ideal process that the organization does not operate."],
  ["Use authoritative source evidence", "Prefer system exports, approved records, tickets, logs, and signed review records. A screenshot needs the system, subject, date, actor, and relevant context."],
  ["Prove population completeness", "Record source, filters, time zone, date range, fields, extraction date, and reconciliation method for populations that may be sampled."],
  ["Retain evidence for the full observation period", "One recent sample does not prove that a recurring control operated throughout the period."],
  ["Separate readiness from the audit conclusion", "The consultant may label evidence ready for auditor review. Only the CPA firm determines sufficiency, sampling, exceptions, and the report opinion."],
  ["Control access to evidence", "Use an approved location with least privilege, stable naming, retention, and change history. Remove secrets and unrelated personal data from working copies."],
  ["Escalate scope and independence conflicts", "Send scope, category, subservice, commitment, and auditor independence questions to management and the CPA firm before work continues."]
];
const statuses = [
  ["Missing or unknown", "No usable control, owner, scope, or evidence.", "Confirm risk and scope. Define the control, owner, cadence, system, evidence, and due date.", "Management approves the design and plan."],
  ["Planned", "Design and owner are approved, but the control is not operating.", "Configure the process, train operators, run a dry test, and correct defects.", "The control operates in production on its effective date."],
  ["Implemented", "The control operates, but history or evidence has not passed readiness review.", "Collect actual occurrences. Test evidence and population completeness. Track exceptions.", "All verified-evidence exit criteria pass."],
  ["Verified evidence", "Evidence is complete, attributable, consistent with the control, and reviewed.", "Lock the index, continue the cadence, and prepare the auditor handoff.", "Ready for auditor review. This is not an audit conclusion."]
];
const workflow = [
  "Confirm applicability. Link the item to scope, risk, commitments, criteria, and affected systems.",
  "Write the control. State who does what, in which system, when, how often, what evidence is created, and what happens when it fails.",
  "Approve the design. Record the management owner, effective date, cadence, evidence location, and accepted constraints.",
  "Implement and train. Configure the workflow, assign access, publish the procedure, and train operators and reviewers.",
  "Dry test. Trace one event through approval, execution, evidence capture, exception handling, and management review.",
  "Operate and collect. Run the control at its real cadence and retain the required occurrences and populations.",
  "Verify and hand off. Test evidence, log exceptions, obtain owner sign-off, and index evidence for the CPA firm."
];
const exitCriteria = [
  "Control owner and operator are named.", "Control wording matches actual operation.", "Effective date and cadence are recorded.",
  "Source system and evidence location are controlled.", "Evidence identifies subject, actor, reviewer, date, and result.",
  "The full population is reproducible when sampling may apply.", "Evidence exists for required occurrences in the period.",
  "Exceptions remain visible and have dispositions.", "Control changes are versioned and dated.", "The owner completed readiness review and sign-off."
];
const playbooks = [
  { title: "Scope and system description", criteria: "Foundational", rule: "Set the smallest defensible boundary that covers service commitments and risks. Identify infrastructure, software, people, procedures, data, locations, and material subservice organizations.", procedure: "Interview service owners. Trace customer data. Reconcile architecture, asset, vendor, and contract inventories. Draft the boundary and change log for management approval.", evidence: "Approved scope statement, system description, diagrams, data flows, inventories, commitment register, boundary decisions, and dated change history.", exit: "Every material component has an owner and boundary decision. Documents agree with production. Management approves the description.", cadence: "Review at least annually and after a material product, infrastructure, location, vendor, data, or commitment change." },
  { title: "Governance and risk management", criteria: "CC1, CC2, CC3, CC4, CC5, CC9", rule: "Assign accountability, communicate requirements, assess risks, monitor controls, and correct deficiencies through a documented governance process.", procedure: "Build the responsibility matrix, risk register, policy register, control inventory, exception log, and management review agenda. Coach owners but do not accept risk for them.", evidence: "Approved policies, risk assessment, treatment decisions, minutes, metrics, acknowledgements, training records, findings, tickets, and closure approvals.", exit: "Policies and risks have owners and review dates. Decisions are recorded. Findings trace to closure. Oversight occurred at the defined cadence.", cadence: "Annual policy and risk review, periodic oversight, and event-driven updates. Confirm the actual cadence with management and the CPA firm." },
  { title: "Logical and physical access", criteria: "CC6", rule: "Authorize access before provision. Limit privilege. Protect authentication. Remove access promptly. Review access using complete system populations.", procedure: "Inventory identity sources and privileged roles. Define joiner, mover, and leaver triggers. Configure approvals and MFA. Run an access review and trace removals.", evidence: "Requests, approvals, account records, MFA coverage, termination timestamps, role definitions, privileged lists, review decisions, removal tickets, and physical-access records.", exit: "Samples trace end to end. Terminations meet the target. Review populations reconcile to systems. Decisions and removals are visible.", cadence: "Lifecycle controls operate per event. Access reviews follow the approved risk-based cadence." },
  { title: "Change management and secure development", criteria: "CC8", rule: "Production changes must be authorized, tested, traceable, and recoverable. Emergency changes need approval and timely retrospective review.", procedure: "Map repositories, pipelines, cloud consoles, and ticketing. Enforce reviews and protected deployment paths. Define compensating reviews for small teams.", evidence: "Change population, tickets, pull requests, tests, approvals, deployments, security checks, rollback notes, emergency reasons, and follow-up reviews.", exit: "Production changes reconcile to approved sources. Samples include required steps. Bypass paths are restricted and emergency exceptions are reviewed.", cadence: "Per production change, with recurring review of emergency access, bypasses, and failed deployments." },
  { title: "Security operations", criteria: "CC7", rule: "Maintain current assets. Detect events and vulnerabilities. Assign response based on risk. Verify remediation and retain approved exceptions.", procedure: "Reconcile inventories. Define log and alert coverage. Set remediation targets. Establish ticketing, exception approval, escalation, and closure verification.", evidence: "Inventories, scan populations, findings, alerts, triage, tickets, remediation proof, exceptions, coverage reports, retention settings, and trend reviews.", exit: "Coverage matches scope. Findings reconcile to populations. Deadlines are testable. Closure has technical verification.", cadence: "Monitoring runs continuously or at the defined frequency. Timing must match risk, commitments, and policy." },
  { title: "Incident response and resilience", criteria: "CC7, A1", rule: "Define authority, severity, escalation, communication, evidence handling, recovery objectives, and lessons learned before an incident.", procedure: "Build the contact and decision matrix. Validate legal, privacy, insurer, customer, and vendor paths. Run a tabletop and restoration test. Close findings.", evidence: "Plans, contact validation, training, tabletop records, incident population, tickets, communications, post-incident review, backup monitoring, restore tests, and recovery results.", exit: "Roles can execute without improvising. Tests meet objectives or create tracked gaps. Restore proof shows usable recovery.", cadence: "Test at least annually and after material change. Other cadences must reflect system and contractual needs." },
  { title: "Vendor and subservice management", criteria: "CC9", rule: "Identify material vendors, assess risk before use, establish terms, monitor changes, and operate complementary user entity controls.", procedure: "Reconcile procurement, finance, identity, cloud, and architecture sources. Tier vendors. Review reports and bridge letters. Track findings and dependencies.", evidence: "Vendor inventory, tier rationale, due diligence, contracts, reports, bridge letters, complementary control mapping, findings, approvals, exceptions, and termination records.", exit: "Material vendors have owners and current reviews. Report periods are understood. Complementary controls have owners. Exceptions are approved.", cadence: "Before onboarding, at renewal or defined risk-based intervals, and after material changes." },
  { title: "Type II evidence management", criteria: "Operating effectiveness", rule: "Keep a control matrix and evidence index that show who operated each control, when it operated, which population applies, the result, and exception handling.", procedure: "Inventory frequencies. Create an evidence calendar. Test exports before the period. Review each occurrence. Keep an immutable exception record and readiness sign-off.", evidence: "Control matrix, evidence calendar, population specifications, exports, samples, evidence index, exception log, change history, owner attestations, and management review.", exit: "Required occurrences are indexed. Populations can be reproduced. Evidence matches the control and period. Exceptions are dispositioned.", cadence: "Follow each approved control frequency across the observation period. The CPA firm decides final samples and sufficiency." },
  { title: "Additional Trust Services Categories", criteria: "A1, C1, PI1, P1-P8", rule: "Add Availability, Confidentiality, Processing Integrity, or Privacy only when commitments and risks require them.", procedure: "Map commitments and data lifecycles to the selected category. Define category-specific controls and confirm scope with management and the CPA firm.", evidence: "Availability tests and monitoring; confidential-data lifecycle records; processing reconciliations and error records; privacy notices, consent, requests, retention, sharing, and incident records.", exit: "Controls and evidence support the selected category commitments. Scope decisions and exclusions are approved.", cadence: "Use event-driven and recurring cadences that match the selected category, system requirements, and commitments." }
];
const categoryCriteria = [
  ["Availability","A1.1","Monitor capacity and performance against defined availability objectives.","Thresholds, forecasts, alerts, reviews, and scaling decisions."],
  ["Availability","A1.2","Operate environmental, backup, recovery, and redundancy safeguards.","Architecture, backup, failover, environmental, and recovery records."],
  ["Availability","A1.3","Test recovery and continuity procedures and correct gaps.","Test plans, results, gaps, owners, retests, and closure proof."],
  ["Confidentiality","C1.1","Identify confidential information and protect it through its lifecycle.","Inventory, classification, access, encryption, transfer, and retention."],
  ["Confidentiality","C1.2","Destroy confidential information when approved retention ends.","Methods, deletion jobs, destruction records, vendor proof, and exceptions."],
  ["Processing Integrity","PI1.1","Define processing objectives and the information needed to meet them.","Objective register, requirements, measures, owners, and approvals."],
  ["Processing Integrity","PI1.2","Validate that inputs are complete, accurate, timely, and authorized.","Input validation, rejects, approvals, reconciliation, and corrections."],
  ["Processing Integrity","PI1.3","Control processing for completeness, validity, accuracy, timeliness, and authorization.","Job controls, transaction checks, error queues, monitoring, and resolution."],
  ["Processing Integrity","PI1.4","Validate outputs and restrict distribution to authorized recipients.","Output reconciliation, approvals, distribution logs, and corrections."],
  ["Processing Integrity","PI1.5","Protect and reconcile stored processing records.","Integrity checks, access, retention, reconciliation, and corrections."],
  ["Privacy","P1.1","Publish a clear, current privacy notice.","Approved notice, version history, publication proof, and change review."],
  ["Privacy","P2.1","Provide required choices and record consent or withdrawal.","Consent language, preferences, withdrawal, and enforcement."],
  ["Privacy","P3.1","Limit collection to stated objectives.","Data inventory, collection points, purpose map, minimization, and reviews."],
  ["Privacy","P3.2","Obtain explicit consent for sensitive information when required.","Sensitive-data definition, consent, exceptions, and enforcement."],
  ["Privacy","P4.1","Limit use to stated objectives and commitments.","Purpose map, authorized uses, access, monitoring, and exceptions."],
  ["Privacy","P4.2","Retain personal information only for approved periods.","Retention schedule, legal holds, deletion jobs, reviews, and exceptions."],
  ["Privacy","P4.3","Securely destroy personal information when retention ends.","Deletion methods, completion logs, vendor proof, and exceptions."],
  ["Privacy","P5.1","Process individual access and correction requests.","Intake, identity verification, response, correction, denial, and timing."],
  ["Privacy","P6.1","Authorize disclosures under consent and approved purposes.","Disclosure basis, consent, approval, recipient, purpose, and data."],
  ["Privacy","P6.2","Set enforceable privacy duties for third parties.","Contracts, instructions, breach duties, deletion, audit rights, and exceptions."],
  ["Privacy","P6.3","Assess third parties before disclosure.","Due diligence, risk tier, approval, findings, and remediation."],
  ["Privacy","P6.4","Monitor third-party privacy performance.","Reviews, attestations, incidents, metrics, findings, and escalation."],
  ["Privacy","P6.5","Remediate unauthorized third-party use.","Detection, investigation, containment, notification, correction, and closure."],
  ["Privacy","P6.6","Deliver required breach and disclosure notifications.","Decision record, timing, recipients, content, approval, and delivery proof."],
  ["Privacy","P6.7","Maintain a complete disclosure record.","Requester, recipient, purpose, data, date, and authority."],
  ["Privacy","P7.1","Maintain personal information quality for intended use.","Validation, correction sources, reconciliation, stale-data review, and results."],
  ["Privacy","P8.1","Resolve privacy inquiries, complaints, and disputes.","Intake, investigation, response, escalation, timing, outcome, and trends."]
];

const children = [];
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "SOC 2 Type II", bold: true, size: 42, color: navy })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: "Consultant Implementation Guide", bold: true, size: 34, color: teal })] }));
children.push(p("For readiness implementation, evidence verification, and auditor handoff", { italics: true, color: gray }));
children.push(p("CPF Coaching LLC | Version 1.0 | September 2026", { bold: true }));
children.push(p("Planning use only. This guide is not an audit, attestation, legal opinion, or guarantee of readiness. Management owns the system description, controls, risk decisions, and assertion. The CPA firm defines the examination approach and makes the audit conclusion."));
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("How to use this guide"));
children.push(p("Use this guide for assessment items marked Missing or unknown, Planned, or Implemented. Keep an item below Verified evidence until every exit criterion passes."));
children.push(heading("Non-negotiable engagement rules", 2));
rules.forEach(([name, text]) => { children.push(p(name, { bold: true, color: teal })); children.push(p(text)); });
children.push(heading("Assessment status model", 1, true));
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1500, 2300, 3000, 2560], rows: [
  new TableRow({ children: [cell("Status",1500,true),cell("Minimum expectation",2300,true),cell("Consultant action",3000,true),cell("Promotion rule",2560,true)] }),
  ...statuses.map(r => new TableRow({ children: [cell(r[0],1500),cell(r[1],2300),cell(r[2],3000),cell(r[3],2560)] }))
] }));
children.push(heading("Seven-step implementation workflow", 1, true));
workflow.forEach(numbered);
children.push(heading("Verified-evidence exit criteria", 2));
exitCriteria.forEach(x => children.push(bullet(x)));
children.push(p("Stop condition: If any criterion fails, keep the status at Implemented or lower. Record the exact missing proof and the next valid control occurrence that can produce it.", { bold: true, color: "9C0006" }));
children.push(p("Never fix history by backdating approval, recreating records, altering exports, or performing a control today and claiming it operated earlier.", { bold: true, color: "9C0006" }));
playbooks.forEach(pb => {
  children.push(heading(pb.title, 1, true)); children.push(p(pb.criteria, { bold: true, color: blue }));
  [["Implementation rule",pb.rule],["Consultant procedure",pb.procedure],["Expected evidence",pb.evidence],["Exit criteria",pb.exit],["Cadence expectation",pb.cadence]].forEach(([h,t])=>{children.push(heading(h,2));children.push(p(t));});
});
children.push(heading("Additional category criterion checklist", 1, true));
children.push(p("These are readiness-oriented paraphrases. Confirm the selected categories and final control mapping with management and the CPA firm."));
["Availability","Confidentiality","Processing Integrity","Privacy"].forEach(category => {
  const rows = categoryCriteria.filter(r => r[0] === category);
  const chunks = category === "Privacy" ? [rows.slice(0,7), rows.slice(7,14), rows.slice(14)] : [rows];
  chunks.forEach((chunk,index) => {
    if (index > 0) children.push(new Paragraph({children:[new PageBreak()]}));
    children.push(heading(index ? `${category} (continued)` : category, 2));
    children.push(new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[1000,3760,4600], rows:[
      new TableRow({children:[cell("Criterion",1000,true),cell("Implementation expectation",3760,true),cell("Typical evidence",4600,true)]}),
      ...chunk.map(r=>new TableRow({cantSplit:true,children:[cell(r[1],1000),cell(r[2],3760),cell(r[3],4600)]}))
    ]}));
  });
});
children.push(heading("Consultant completion package", 1, true));
["Approved scope, categories, boundaries, and subservice treatment.","Current system description and dated change log.","Risk-to-criteria-to-control matrix with owners and frequencies.","Evidence request list, evidence index, and controlled repository map.","Population definitions and reproducible export instructions.","Exception log with impact, decision, action, and closure status.","Readiness test results with failures clearly identified.","Management approvals, residual-risk decisions, and open issues.","Questions for the CPA firm with no assumed audit conclusions.","Operating calendar through the end of the observation period."].forEach(x=>children.push(bullet(x)));
children.push(p("Completion rule: Management can operate the controls without consultant dependency, reproduce the evidence, explain exceptions, and maintain the cadence.", { bold: true, color: teal }));
children.push(heading("Authoritative references", 1));
children.push(new Paragraph({ children: [new ExternalHyperlink({ link: "https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022", children: [new TextRun({ text: "AICPA 2017 Trust Services Criteria with revised points of focus, 2022", style: "Hyperlink" })] })] }));
children.push(new Paragraph({ children: [new ExternalHyperlink({ link: "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2", children: [new TextRun({ text: "AICPA SOC 2 resource center", style: "Hyperlink" })] })] }));

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 22 } } }, paragraphStyles: [
    { id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{font:"Arial",size:30,bold:true,color:navy},paragraph:{spacing:{before:260,after:140},outlineLevel:0} },
    { id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{font:"Arial",size:24,bold:true,color:teal},paragraph:{spacing:{before:180,after:90},outlineLevel:1} }
  ]},
  numbering: { config: [
    { reference:"bullets",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}] },
    { reference:"steps",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}] }
  ]},
  sections: [{ properties: { page: { size: { width:12240,height:15840 }, margin:{top:900,right:900,bottom:900,left:900} } },
    headers:{default:new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:teal,space:1}},children:[new TextRun({text:"CPF Coaching | SOC 2 Type II Consultant Implementation Guide",size:16,color:gray})]})]})},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Readiness guidance only | Page ",size:16,color:gray}),new TextRun({children:[PageNumber.CURRENT],size:16,color:gray})]})]})},
    children }]
});

Packer.toBuffer(doc).then(buffer => { fs.writeFileSync(output, buffer); console.log(output); });
