# backend/app/ai/document_generator.py
import os
import datetime
from fpdf import FPDF

# Simple PDF class to generate clean, professional letters
class HRLetterPDF(FPDF):
    def header(self):
        # Draw TUF box (Black background, white text)
        self.set_fill_color(0, 0, 0)
        self.rect(20, 15, 12, 6, style="F")
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 9)
        self.set_xy(20, 15)
        self.cell(12, 6, "TUF", align="C")
        
        # Draw Divider
        self.set_text_color(37, 99, 235) # Brand Primary (Blue)
        self.set_xy(32, 15)
        self.cell(8, 6, "</>", align="C")
        
        # Draw HACK box (White background, black text)
        self.set_text_color(0, 0, 0)
        self.set_xy(40, 15)
        self.set_font("Helvetica", "B", 9)
        self.cell(15, 6, "HACK", align="C")
        
        # Company name text next to logo
        self.set_text_color(80, 80, 80)
        self.set_font("Helvetica", "B", 9)
        self.set_xy(57, 15)
        self.cell(0, 6, "TUF HACK Technologies Inc. | Corporate HR Systems", ln=True)
        
        # Horizontal line
        self.line(20, 24, 190, 24)
        
    def footer(self):
        # Position at 50 mm from bottom
        self.set_y(-50)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        
        # Draw signatures columns
        # Left signature
        self.set_x(20)
        self.cell(60, 4, "_______________________", ln=False, align="L")
        # Right signature
        self.set_x(130)
        self.cell(60, 4, "[   Stamp Area   ]", ln=True, align="C")
        
        self.set_x(20)
        self.cell(60, 4, "HR Operations Signature", ln=False, align="L")
        self.set_x(130)
        self.cell(60, 4, "Authorized Representative Seal", ln=True, align="C")
        
        # Separator line above contact info
        self.line(20, 280, 190, 280)
        
        # Contact and Ref info
        self.set_y(-17)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(130, 130, 130)
        self.cell(0, 3, "TUF HACK Technologies Inc. | 100 AI Innovation Boulevard, Silicon Valley, CA", ln=True, align="C")
        self.cell(0, 3, "Web: www.tufhack.ai | Email: hr@tufhack.ai | Tel: +1-555-TUF-HACK", ln=True, align="C")

def generate_letter_text(letter_type: str, data: dict) -> str:
    today_str = datetime.date.today().strftime("%B %d, %Y")
    name = data.get("name", "John Doe")
    role = data.get("role", "Software Engineer")
    joining_date = data.get("joining_date", today_str)
    
    if letter_type.lower() == "offer":
        salary = data.get("salary", "50,000")
        return f"""Dear {name},

We are pleased to offer you employment with TUF HACK Technologies Inc. in the position of {role}.

Your commencement date will be {joining_date}. You will report directly to the Team Lead or Director of your assigned department.

The compensation package for this role is an annual base salary of ${salary}, payable monthly in accordance with company payroll policy and subject to local taxation guidelines.

To accept this offer, please sign and return this document within 5 business days. We welcome you to TUF HACK.

Sincerely,
HR Operations Team
TUF HACK Technologies Inc.
"""
    elif letter_type.lower() == "appointment":
        salary = data.get("salary", "50,000")
        return f"""Dear {name},

Following your acceptance of our employment offer, we are pleased to formally appoint you as a full-time employee at TUF HACK Technologies Inc., in the capacity of {role}, starting from {joining_date}.

Your duties and responsibilities will be aligned with the {role} job description. Your annual package is confirmed at ${salary}. You will be on probation for a period of six months. We expect high dedication and look forward to a successful tenure.

Sincerely,
HR Director
TUF HACK Technologies Inc.
"""
    elif letter_type.lower() == "promotion":
        salary = data.get("salary", "50,000")
        old_role = data.get("old_role", "Junior Developer")
        effective_date = data.get("effective_date", today_str)
        return f"""Dear {name},

We are delighted to congratulate you on your promotion to the position of {role}, effective from {effective_date}.

This promotion is in recognition of your outstanding contributions, technical performance, and dedication to TUF HACK Technologies Inc. in your previous role as {old_role}.

Along with this promotion, your annual base salary has been incremented to ${salary}. Your reporting lines and updated duties will be shared by your department head. Thank you for your excellent work.

Sincerely,
Managing Director
TUF HACK Technologies Inc.
"""
    elif letter_type.lower() == "warning":
        reason = data.get("reason", "consistent late arrival and unexcused absences")
        return f"""Dear {name},

This letter serves as a formal written warning regarding your work performance/conduct, specifically concerning: {reason}.

This behavior is in violation of the company rules and policies, and negatively impacts team productivity. We expect immediate improvement in this matter.

Failure to correct this conduct will lead to further disciplinary actions, including suspension or termination of employment.

Sincerely,
HR Compliance Officer
TUF HACK Technologies Inc.
"""
    elif letter_type.lower() == "experience":
        start_date = data.get("start_date", "January 01, 2025")
        end_date = data.get("end_date", today_str)
        return f"""TO WHOM IT MAY CONCERN

This is to certify that {name} was employed with TUF HACK Technologies Inc. from {start_date} to {end_date}. During this period, they served as a {role} in our Engineering department.

In their capacity, {name} demonstrated exceptional dedication, high technical capability, and positive teamwork. They left the company on their own accord to pursue further career opportunities. We wish them all the best in their future endeavors.

Sincerely,
HR Director
TUF HACK Technologies Inc.
"""
    elif letter_type.lower() == "internship":
        stipend = data.get("stipend", "1,500")
        duration = data.get("duration", "3 Months")
        dept = data.get("department", "Engineering")
        start_date = data.get("start_date", "March 01, 2026")
        end_date = data.get("end_date", today_str)
        return f"""TO WHOM IT MAY CONCERN

This is to certify that {name} has successfully completed a internship program at TUF HACK Technologies Inc. from {start_date} to {end_date} in the {dept} department.

During this {duration} internship, {name} worked as an Intern in the field of {role}. They contributed to the design, coding, and optimization of software components, receiving a monthly stipend of ${stipend}.

We found {name} to be inquisitive, hard-working, and highly professional. We wish them success in their future endeavors.

Sincerely,
Internship Coordinator
TUF HACK Technologies Inc.
"""
    else:
        return f"Document text for type: {letter_type} and employee: {name}."

def generate_pdf_document(letter_type: str, data: dict, output_filename: str) -> str:
    """
    Generates a PDF using FPDF library.
    Saves it to c:/project/backend/documents/ and returns the path.
    """
    # Ensure documents directory exists
    doc_dir = "c:/project/backend/documents"
    if not os.path.exists(doc_dir):
        os.makedirs(doc_dir)
        
    filepath = os.path.join(doc_dir, output_filename)
    
    try:
        pdf = HRLetterPDF()
        pdf.add_page()
        pdf.set_margins(20, 30, 20)
        
        # Document Title Header
        pdf.ln(10)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(0, 0, 0)
        title_text = f"{letter_type.upper()} LETTER" if letter_type.lower() not in ["experience", "internship"] else f"CERTIFICATE OF {letter_type.upper()}"
        pdf.cell(0, 10, title_text, ln=True, align="C")
        pdf.ln(3)
        
        # Generate Unique Reference Number
        val_hash = abs(hash(output_filename)) % 10000
        ref_num = f"TH/HR/{datetime.date.today().year}/{data.get('employee_id', 'EMP-XXX')}/{val_hash:04d}"
        
        # Draw Metadata Grid Block
        pdf.set_fill_color(245, 245, 245)
        pdf.rect(20, 48, 170, 32, style="F")
        
        pdf.set_xy(25, 50)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Reference Code:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(50, 5, ref_num, ln=False)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Date Issued:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(40, 5, datetime.date.today().strftime("%B %d, %Y"), ln=True)
        
        pdf.set_x(25)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Employee ID:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(50, 5, data.get("employee_id", "N/A"), ln=False)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Department:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(40, 5, data.get("department", "HR & Admin"), ln=True)
        
        pdf.set_x(25)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Employee Name:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(50, 5, data.get("name", "N/A"), ln=False)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 5, "Designated Role:", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(40, 5, data.get("role", "N/A"), ln=True)
        
        pdf.set_x(25)
        pdf.set_font("Helvetica", "B", 9)
        if letter_type.lower() == "internship":
            pdf.cell(35, 5, "Monthly Stipend:", ln=False)
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(50, 5, f"${data.get('stipend', '0.00')}", ln=False)
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(35, 5, "Duration:", ln=False)
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(40, 5, data.get("duration", "3 Months"), ln=True)
        else:
            salary_val = data.get("salary", "0.00")
            pdf.cell(35, 5, "Salary / Package:", ln=False)
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(50, 5, f"${salary_val}/yr" if salary_val != "0.00" else "N/A", ln=True)
            
        pdf.ln(12)
        
        # Write Letter Content
        text_content = generate_letter_text(letter_type, data)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(50, 50, 50)
        
        paragraphs = text_content.split("\n\n")
        for para in paragraphs:
            para_text = para.strip()
            if not para_text:
                continue
            
            # Format subject, signatures or normal text
            if para_text.startswith("Subject:"):
                pdf.set_font("Helvetica", "B", 10.5)
                pdf.cell(0, 6, para_text, ln=True)
                pdf.set_font("Helvetica", "", 10)
                pdf.ln(2)
            elif para_text.startswith("Dear ") or para_text.startswith("TO WHOM "):
                pdf.set_font("Helvetica", "B", 10)
                pdf.cell(0, 6, para_text, ln=True)
                pdf.set_font("Helvetica", "", 10)
                pdf.ln(2)
            elif para_text.startswith("Sincerely,"):
                pdf.ln(4)
                pdf.set_font("Helvetica", "B", 10)
                pdf.cell(0, 5, para_text, ln=True)
                # print remaining signature title lines
                lines = para_text.split("\n")
                if len(lines) > 1:
                    pdf.set_font("Helvetica", "", 10)
                    for l in lines[1:]:
                        pdf.cell(0, 5, l, ln=True)
            else:
                pdf.multi_cell(0, 6.5, para_text)
                pdf.ln(4)
                
        pdf.output(filepath)
        return filepath
    except Exception as e:
        print("PDF generation failed, returning text fallback instead. Error:", e)
        # Write text version to file as fallback
        fallback_path = filepath.replace(".pdf", ".txt")
        text_content = generate_letter_text(letter_type, data)
        with open(fallback_path, "w") as f:
            f.write(text_content)
        return fallback_path
