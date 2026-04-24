import pdfplumber
pdf_path = "src/assets/docs/Ghanaian Sign Language Dictionary - 3rd Edition.pdf"
with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[164]
    print(page.extract_text())
    # Also check image objects
    print(f"Images: {page.images}")
