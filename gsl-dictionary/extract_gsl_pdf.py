import pdfplumber
import pandas as pd

pdf_path = "Ghanaian Sign Language Dictionary - 3rd Edition.pdf"
output_csv = "gsl_signs_extracted.csv"

data = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if not text:
            continue
        lines = text.split('\n')
        current_word = None
        current_desc = []
        for line in lines:
            if line.isupper() and len(line.split()) < 5:  # likely a sign word/phrase
                if current_word and current_desc:
                    data.append({"word": current_word, "description": " ".join(current_desc).strip()})
                current_word = line.strip()
                current_desc = []
            else:
                current_desc.append(line.strip())
        if current_word and current_desc:
            data.append({"word": current_word, "description": " ".join(current_desc).strip()})

df = pd.DataFrame(data)
df.to_csv(output_csv, index=False)
print(f"Extracted {len(df)} signs to {output_csv}")