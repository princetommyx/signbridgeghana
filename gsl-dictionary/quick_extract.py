import pdfplumber
import pandas as pd
import os

pdf_path = "src/assets/docs/gsl-dictionary.pdf"
output_csv = "gsl-dictionary/gsl_signs_extracted.csv"

if not os.path.exists(pdf_path):
    print(f"Error: {pdf_path} not found")
    exit(1)

data = []
print("Starting extraction...")

with pdfplumber.open(pdf_path) as pdf:
    # Just extract first 50 pages for the searchable demo
    for i, page in enumerate(pdf.pages[:50]):
        text = page.extract_text()
        if not text:
            continue
        lines = text.split('\n')
        current_word = None
        current_desc = []
        for line in lines:
            # Simple heuristic: Uppercase words under 4 words are likely signs
            clean_line = line.strip()
            if clean_line.isupper() and len(clean_line.split()) < 4 and len(clean_line) > 1:
                if current_word and current_desc:
                    data.append({
                        "word": current_word.capitalize(), 
                        "description": " ".join(current_desc).strip(),
                        "page": i + 1
                    })
                current_word = clean_line
                current_desc = []
            elif current_word:
                current_desc.append(clean_line)
        
        if i % 10 == 0:
            print(f"Processed {i} pages...")

df = pd.DataFrame(data)
df.to_csv(output_csv, index=False)
print(f"Successfully extracted {len(df)} signs to {output_csv}")
