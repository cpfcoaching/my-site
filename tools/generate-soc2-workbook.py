from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter

OUT = Path(__file__).resolve().parent.parent / "static/resources/soc2-type2-readiness-workbook.xlsx"
NAVY, TEAL, BLUE, PALE, WHITE, GRAY, YELLOW, RED, GREEN = "16324A", "008F83", "2F75B5", "E8F4F3", "FFFFFF", "5B6573", "FFF2CC", "F4CCCC", "D9EAD3"
thin = Side(style="thin", color="B8C4D0")

controls = [
 ("SCP-01","Scope and system description","Foundational","Services, infrastructure, locations, data, people, software, and procedures in scope are documented.","Yes","Approve the system boundary and system description."),
 ("SCP-02","Scope and system description","Foundational","Customer commitments and system requirements map to selected categories.","Yes","Map customer commitments to the selected criteria."),
 ("SCP-03","Scope and system description","Foundational","Subservice organizations and carve-out or inclusive treatment are documented.","No","Document subservice organizations and their treatment."),
 ("SCP-04","Scope and system description","Foundational","Management can support an accurate system description for the full period.","Yes","Draft and validate the system description."),
 ("GOV-01","Governance and risk management","CC1, CC2, CC3, CC4, CC5, CC9","Leadership assigns security accountability and reviews control performance.","Yes","Assign control owners and a recurring oversight review."),
 ("GOV-02","Governance and risk management","CC3","A current risk assessment links risks to controls and treatment decisions.","Yes","Complete and approve a risk assessment and treatment plan."),
 ("GOV-03","Governance and risk management","CC1, CC2","Policies are approved, reviewed, communicated, and acknowledged.","No","Set policy owners, approval dates, and acknowledgement evidence."),
 ("GOV-04","Governance and risk management","CC4, CC5","Control failures and exceptions are found, tracked, corrected, and reported.","Yes","Create a control exception and remediation process."),
 ("ACC-01","Logical and physical access","CC6","Identity lifecycle procedures cover approval, provisioning, changes, termination, and review.","Yes","Implement a traceable joiner, mover, and leaver process."),
 ("ACC-02","Logical and physical access","CC6","Multi-factor authentication protects workforce, privileged, cloud, and remote access.","Yes","Close MFA coverage gaps and document exceptions."),
 ("ACC-03","Logical and physical access","CC6","Privileged access is limited, separately controlled, logged, and reviewed.","Yes","Inventory and review all privileged access."),
 ("ACC-04","Logical and physical access","CC6","Access reviews show reviewer decisions and completed removals.","Yes","Run an access review and retain removal proof."),
 ("CHG-01","Change management and development","CC8","Production changes require requests, review, testing, approval, and deployment evidence.","Yes","Enforce review and approval for production changes."),
 ("CHG-02","Change management and development","CC8","Development, approval, and production access are separated or compensated.","No","Define separation of duties or a compensating review."),
 ("CHG-03","Change management and development","CC8","Security requirements, code review, dependency checks, and secret handling are repeatable.","No","Add repeatable security checks to delivery."),
 ("CHG-04","Change management and development","CC8","Emergency changes receive timely retrospective review.","No","Create and test an emergency change path."),
 ("OPS-01","Security operations","CC7","Assets, software, data stores, and owners are inventoried and kept current.","No","Build an inventory with business and technical owners."),
 ("OPS-02","Security operations","CC7","Vulnerabilities are detected, ranked, assigned, remediated, and verified.","Yes","Set remediation targets and retain closure evidence."),
 ("OPS-03","Security operations","CC7","Security logs and alerts cover material systems and receive documented response.","Yes","Define logging coverage and demonstrate alert response."),
 ("OPS-04","Security operations","CC7","Endpoints and workloads use appropriate hardening, protection, and monitoring.","No","Measure endpoint and workload protection coverage."),
 ("IR-01","Incident response and resilience","CC7","A current plan defines incident roles, severity, escalation, communication, and evidence handling.","Yes","Approve an incident response plan and contact matrix."),
 ("IR-02","Incident response and resilience","CC7","The incident plan is tested, lessons are assigned, and actions are closed.","Yes","Run a tabletop exercise and close the findings."),
 ("IR-03","Incident response and resilience","A1","Backups are monitored and restoration is tested for in-scope services and data.","Yes","Test restoration and record results."),
 ("IR-04","Incident response and resilience","A1","Continuity plans match dependencies and recovery objectives.","No","Define recovery objectives and test recovery."),
 ("VEN-01","Vendor and subservice management","CC9","Material vendors have owners, data access, risk tier, and review dates.","Yes","Create a risk-tiered vendor inventory."),
 ("VEN-02","Vendor and subservice management","CC9","Security due diligence occurs before use and on a risk-based cadence.","Yes","Review material vendors and track findings."),
 ("VEN-03","Vendor and subservice management","CC9","Contracts address applicable security, confidentiality, privacy, availability, and incidents.","No","Review material vendor security terms."),
 ("VEN-04","Vendor and subservice management","CC9","Material vendor service, security, and control changes are monitored.","Yes","Review vendor reports and assign complementary controls."),
 ("T2-01","Type II operating evidence","Operating effectiveness","A matrix maps criteria, risks, owners, frequency, evidence, and systems.","Yes","Build and approve the control matrix."),
 ("T2-02","Type II operating evidence","Operating effectiveness","Recurring controls operated on schedule across the planned period.","Yes","Run controls on schedule and track exceptions."),
 ("T2-03","Type II operating evidence","Operating effectiveness","Evidence is complete, dated, attributable, and available for representative samples.","Yes","Collect representative evidence with context."),
 ("T2-04","Type II operating evidence","Operating effectiveness","Complete populations can be produced for sampled controls.","Yes","Validate complete populations before fieldwork."),
 ("T2-05","Type II operating evidence","Operating effectiveness","Exceptions have impact analysis, approval, remediation, and closure evidence.","Yes","Document and close control exceptions."),
 ("T2-06","Type II operating evidence","Operating effectiveness","Management reviews readiness and accepts residual risks before fieldwork.","Yes","Hold a readiness review and record decisions."),
 ("A1.1","Availability","A1.1","Capacity and performance are monitored against defined availability objectives.","Conditional","Define availability objectives and operate capacity monitoring."),
 ("A1.2","Availability","A1.2","Environmental, backup, recovery, and redundancy safeguards support availability commitments.","Conditional","Implement and evidence recovery and resilience safeguards."),
 ("A1.3","Availability","A1.3","Recovery and continuity procedures are tested and corrected.","Conditional","Test recovery procedures and close the findings."),
 ("C1.1","Confidentiality","C1.1","Confidential information is identified and protected through its approved lifecycle.","Conditional","Classify confidential information and enforce lifecycle controls."),
 ("C1.2","Confidentiality","C1.2","Confidential information is securely destroyed when retention ends.","Conditional","Implement and evidence secure disposal."),
 ("PI1.1","Processing Integrity","PI1.1","Processing objectives and the information needed to meet them are defined.","Conditional","Define processing objectives and quality measures."),
 ("PI1.2","Processing Integrity","PI1.2","Processing inputs are complete, accurate, timely, and authorized.","Conditional","Implement and test input controls."),
 ("PI1.3","Processing Integrity","PI1.3","System processing is complete, valid, accurate, timely, and authorized.","Conditional","Implement and evidence processing controls."),
 ("PI1.4","Processing Integrity","PI1.4","Processing outputs are complete, accurate, timely, and restricted to authorized recipients.","Conditional","Implement and test output controls."),
 ("PI1.5","Processing Integrity","PI1.5","Stored processing records remain complete, accurate, timely, and authorized.","Conditional","Protect and reconcile stored processing records."),
 ("P1.1","Privacy","P1.1","Privacy practices and commitments are described in a clear, current notice.","Conditional","Publish and maintain an accurate privacy notice."),
 ("P2.1","Privacy","P2.1","Individuals receive required choices and consent is recorded.","Conditional","Implement consent and preference management."),
 ("P3.1","Privacy","P3.1","Personal information collection is limited to stated objectives.","Conditional","Map and minimize personal information collection."),
 ("P3.2","Privacy","P3.2","Explicit consent is obtained when sensitive information requires it.","Conditional","Implement explicit consent for sensitive information."),
 ("P4.1","Privacy","P4.1","Use of personal information is limited to stated objectives and commitments.","Conditional","Restrict and monitor personal information use."),
 ("P4.2","Privacy","P4.2","Personal information is retained only for approved periods.","Conditional","Implement and evidence privacy retention rules."),
 ("P4.3","Privacy","P4.3","Personal information is securely destroyed when retention ends.","Conditional","Implement and verify personal information disposal."),
 ("P5.1","Privacy","P5.1","Individuals can access, correct, or amend personal information as required.","Conditional","Implement and test individual rights requests."),
 ("P6.1","Privacy","P6.1","Disclosures follow consent, commitments, and approved purposes.","Conditional","Authorize and record personal information disclosures."),
 ("P6.2","Privacy","P6.2","Third parties receive enforceable privacy and protection requirements.","Conditional","Establish required third-party privacy terms."),
 ("P6.3","Privacy","P6.3","Third parties are assessed before receiving personal information.","Conditional","Assess third parties before personal information disclosure."),
 ("P6.4","Privacy","P6.4","Third-party privacy commitments are monitored.","Conditional","Monitor third-party privacy performance."),
 ("P6.5","Privacy","P6.5","Unauthorized third-party use is remediated.","Conditional","Create and test third-party misuse response."),
 ("P6.6","Privacy","P6.6","Affected parties receive required breach and disclosure notifications.","Conditional","Implement privacy notification decision and delivery procedures."),
 ("P6.7","Privacy","P6.7","Disclosures are recorded so the organization can account for them.","Conditional","Maintain a complete personal information disclosure log."),
 ("P7.1","Privacy","P7.1","Personal information quality is maintained for its intended use.","Conditional","Implement personal information quality controls."),
 ("P8.1","Privacy","P8.1","Privacy inquiries, complaints, and disputes are resolved and tracked.","Conditional","Implement privacy inquiry and complaint handling.")
]
LAST = 4 + len(controls)

def title(ws, text, subtitle):
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:H1"); ws["A1"] = text; ws["A1"].font = Font(name="Arial", size=20, bold=True, color=WHITE); ws["A1"].fill = PatternFill("solid", fgColor=NAVY); ws["A1"].alignment = Alignment(vertical="center")
    ws.merge_cells("A2:H2"); ws["A2"] = subtitle; ws["A2"].font = Font(name="Arial", size=10, color=GRAY); ws["A2"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[1].height = 30; ws.row_dimensions[2].height = 30

def format_table(ws, header_row, widths, freeze=None, filter_range=None):
    for c in ws[header_row]:
        c.font = Font(name="Arial", bold=True, color=WHITE); c.fill = PatternFill("solid", fgColor=TEAL); c.alignment = Alignment(wrap_text=True, vertical="center"); c.border = Border(bottom=thin)
    for row in ws.iter_rows(min_row=header_row+1):
        for c in row: c.font = Font(name="Arial", size=10); c.alignment = Alignment(wrap_text=True, vertical="top"); c.border = Border(bottom=thin)
    for i,w in enumerate(widths,1): ws.column_dimensions[get_column_letter(i)].width = w
    if freeze: ws.freeze_panes = freeze
    if filter_range: ws.auto_filter.ref = filter_range

wb = Workbook(); wb.remove(wb.active)

dash = wb.create_sheet("Dashboard"); title(dash,"SOC 2 Type II Readiness Workbook","Consultant backend for implementation, evidence, exceptions, and operating cadence. Planning use only.")
dash["A4"]="Organization"; dash["B4"]=""; dash["A5"]="Assessment owner"; dash["B5"]=""; dash["A6"]="Target audit start"; dash["B6"]=""; dash["A7"]="Observation period (months)"; dash["B7"]=""
dash["A9"]="Metric"; dash["B9"]="Result"; dash["A10"]="Applicable controls"; dash["B10"]=f'=COUNTIF(\'Control Matrix\'!F5:F{LAST},"<>Not applicable")'; dash["A11"]="Verified evidence"; dash["B11"]=f'=COUNTIF(\'Control Matrix\'!F5:F{LAST},"Verified evidence")'; dash["A12"]="Critical controls below Implemented"; dash["B12"]=f'=COUNTIFS(\'Control Matrix\'!E5:E{LAST},"Yes",\'Control Matrix\'!F5:F{LAST},"Missing or unknown")+COUNTIFS(\'Control Matrix\'!E5:E{LAST},"Yes",\'Control Matrix\'!F5:F{LAST},"Planned")'; dash["A13"]="Readiness score"; dash["B13"]=f'=IFERROR(SUM(\'Control Matrix\'!P5:P{LAST})/(3*B10),0)'; dash["B13"].number_format="0.0%"
dash["A15"]="Use rule"; dash["B15"]="Do not mark Verified evidence until the control has operated, the population is reproducible, evidence passes review, exceptions remain visible, and management signs off."
format_table(dash,9,[30,95,15,15,15,15,15,15]); dash["B4"].font=Font(name="Arial",color="0000FF"); dash["B5"].font=Font(name="Arial",color="0000FF"); dash["B6"].font=Font(name="Arial",color="0000FF"); dash["B7"].font=Font(name="Arial",color="0000FF"); dash["B15"].alignment=Alignment(wrap_text=True); dash.row_dimensions[15].height=48

cm = wb.create_sheet("Control Matrix"); title(cm,"Control Matrix","Update blue input fields. Formula scores recalculate from Status.")
headers=["Control ID","Domain","Criteria","Control expectation","Critical","Status","Management owner","Operator","Frequency","Effective date","Evidence source","Evidence location","Last review","Next due","Gap or exception","Readiness score"]
cm.append([]); cm.append(headers)
for i,row in enumerate(controls,5):
    cm.append([row[0],row[1],row[2],row[3],row[4],"Missing or unknown","","","","","","","","",row[5],f'=IF(F{i}="Verified evidence",3,IF(F{i}="Implemented",2,IF(F{i}="Planned",1,0)))'])
status=DataValidation(type="list",formula1='"Missing or unknown,Planned,Implemented,Verified evidence,Not applicable"'); cm.add_data_validation(status); status.add(f"F5:F{LAST}")
critical=DataValidation(type="list",formula1='"Yes,No,Conditional"'); cm.add_data_validation(critical); critical.add(f"E5:E{LAST}")
format_table(cm,4,[12,28,20,54,12,20,22,20,18,15,25,30,15,15,42,15],"A5",f"A4:P{LAST}")
for row in cm.iter_rows(min_row=5,max_row=LAST,min_col=5,max_col=15):
    for c in row: c.font=Font(name="Arial",size=10,color="0000FF")
cm.conditional_formatting.add(f"F5:F{LAST}",FormulaRule(formula=['F5="Verified evidence"'],fill=PatternFill("solid",fgColor=GREEN)))
cm.conditional_formatting.add(f"F5:F{LAST}",FormulaRule(formula=['F5="Missing or unknown"'],fill=PatternFill("solid",fgColor=RED)))

plan=wb.create_sheet("Implementation Plan"); title(plan,"Implementation Plan","Use for controls below Verified evidence. Keep dates and decisions current.")
ph=["Priority","Control ID","Domain","Current status","Required action","Owner","Target date","Dependency","Decision or update","Completion evidence","Status"]
plan.append([]); plan.append(ph)
for i,row in enumerate(controls,5): plan.append(["",row[0],row[1],f"='Control Matrix'!F{i}",row[5],"","","","","","Not started"])
pstatus=DataValidation(type="list",formula1='"Not started,In progress,Blocked,Ready for review,Complete"'); plan.add_data_validation(pstatus); pstatus.add(f"K5:K{LAST}")
format_table(plan,4,[10,12,28,20,45,20,15,25,40,35,18],"A5",f"A4:K{LAST}")

ev=wb.create_sheet("Evidence Index"); title(ev,"Evidence Index","One row per evidence item or control occurrence. Do not replace failed samples.")
eh=["Evidence ID","Control ID","Period start","Period end","Occurrence date","Source system","Population reference","File or link","Operator","Reviewer","Review date","Result","Exception ID","Notes"]
ev.append([]); ev.append(eh)
for _ in range(100): ev.append([""]*len(eh))
eres=DataValidation(type="list",formula1='"Pass,Exception,Not reviewed"'); ev.add_data_validation(eres); eres.add("L5:L104")
format_table(ev,4,[14,12,14,14,16,22,24,38,20,20,16,16,14,38],"A5","A4:N104")

ex=wb.create_sheet("Exceptions"); title(ex,"Exception Log","Preserve every missed occurrence and failed readiness sample through disposition.")
xh=["Exception ID","Control ID","Detected date","Description","Impact","Root cause","Owner","Decision","Remediation","Due date","Closure evidence","Closed date","Residual risk approval","Status"]
ex.append([]); ex.append(xh)
for _ in range(75): ex.append([""]*len(xh))
xstatus=DataValidation(type="list",formula1='"Open,Accepted risk,Remediating,Closed"'); ex.add_data_validation(xstatus); xstatus.add("N5:N79")
format_table(ex,4,[14,12,16,38,28,28,20,24,35,16,35,16,25,18],"A5","A4:N79")

cal=wb.create_sheet("Evidence Calendar"); title(cal,"Evidence Calendar","Plan every recurring control occurrence across the observation period.")
ch=["Control ID","Control name","Frequency","Owner","Period start","Period end","Next due","Evidence expected","Evidence location","Completed date","Evidence ID","Exception ID","Status"]
cal.append([]); cal.append(ch)
for i,row in enumerate(controls,5): cal.append([row[0],row[3],"","", "","","","","","","","","Not scheduled"])
cstatus=DataValidation(type="list",formula1='"Not scheduled,Scheduled,Complete,Exception"'); cal.add_data_validation(cstatus); cstatus.add(f"M5:M{LAST}")
format_table(cal,4,[12,48,18,20,15,15,15,36,32,18,14,14,18],"A5",f"A4:M{LAST}")

readme=wb.create_sheet("Instructions",0); title(readme,"Workbook Instructions","Follow these rules before changing an assessment answer to Verified evidence.")
instructions=[
 "Management owns the control, risk decisions, system description, and assertion.",
 "Do not backdate, manufacture, or silently replace evidence.",
 "Use system exports, approved records, logs, tickets, and signed reviews as primary evidence.",
 "Record source, filters, time zone, date range, fields, extraction date, and reconciliation method for populations.",
 "Retain all required occurrences across the observation period and preserve exceptions.",
 "Verified evidence means ready for auditor review. It is not an audit conclusion.",
 "Use the DOCX implementation guide for domain-specific procedures, evidence expectations, and exit criteria."
]
readme["A4"]="Required operating rules"; readme["A4"].font=Font(name="Arial",bold=True,color=TEAL,size=14)
for i,text in enumerate(instructions,5): readme[f"A{i}"]=f"{i-4}. {text}"; readme[f"A{i}"].alignment=Alignment(wrap_text=True); readme.row_dimensions[i].height=30
readme["A14"]="Workbook flow"; readme["A14"].font=Font(name="Arial",bold=True,color=TEAL,size=14)
readme["A15"]="Control Matrix -> Implementation Plan -> Evidence Calendar -> Evidence Index -> Exceptions -> Dashboard"
readme.column_dimensions["A"].width=115
for ws in wb.worksheets:
    ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0; ws.sheet_properties.outlinePr.summaryBelow=True
    ws.oddFooter.center.text="CPF Coaching | SOC 2 Type II readiness | Planning use only"
wb.calculation.fullCalcOnLoad=True; wb.calculation.forceFullCalc=True; wb.calculation.calcMode="auto"
wb.save(OUT); print(OUT)
