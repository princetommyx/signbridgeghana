import pdfplumber
import os

pdf_path = "gsl-dictionary/fixed.pdf"
try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        for i in range(10, 30):
            page = pdf.pages[i]
            print(f"Page {i}: {len(page.images)} images")
except Exception as e:
    print(f"Error: {e}")
