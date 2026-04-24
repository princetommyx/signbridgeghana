import pdfplumber
pdf_path = "src/assets/docs/gsl-dictionary.pdf"
try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        if len(pdf.pages) > 0:
            print(f"Page 0 text: {pdf.pages[0].extract_text()}")
except Exception as e:
    print(f"Error: {e}")
