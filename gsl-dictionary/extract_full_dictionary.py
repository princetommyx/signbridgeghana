import pdfplumber
import os
import json
import re

pdf_path = "src/assets/docs/Ghanaian Sign Language Dictionary - 3rd Edition.pdf"
output_dir = "src/assets/docs/signs"
os.makedirs(output_dir, exist_ok=True)

SKIP_WORDS = {"FAMILY, PEOPLE AND PRONOUNS", "GRAMMAR AND PARTS OF SPEECH", "HOME AND CLOTHING", "GREETINGS", "FOOD", "NATURE AND THE ENVIRONMENT"}

dictionary_data = []
seen_words = set()

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Scanning {len(pdf.pages)} pages...")
        for i in range(20, len(pdf.pages)):
            page = pdf.pages[i]
            text = page.extract_text() or ""
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            
            if not lines: continue
            
            word = ""
            desc = ""
            
            for line in lines:
                # Better word detection: uppercase, not too long, not in skip list
                if line.isupper() and line not in SKIP_WORDS and 2 < len(line) < 40:
                    word = line
                    word_idx = lines.index(line)
                    desc = " ".join(lines[word_idx+1:word_idx+4])
                    break
            
            if word and word not in seen_words and page.images:
                print(f"Found {word} on page {i}")
                try:
                    img = page.images[0]
                    bbox = (img["x0"], img["top"], img["x1"], img["bottom"])
                    cropped = page.crop(bbox).to_image(resolution=120)
                    
                    # Sanitize filename
                    safe_name = re.sub(r'[^a-z0-9]', '_', word.lower())
                    fname = f"{safe_name}.png"
                    
                    cropped.save(f"{output_dir}/{fname}")
                    
                    dictionary_data.append({
                        "word": word.title(),
                        "description": desc or "Official GSL sign illustration.",
                        "category": "GSL Dictionary",
                        "source": "GSL Dictionary 3rd Ed.",
                        "image": f"assets/docs/signs/{fname}"
                    })
                    seen_words.add(word)
                except Exception as e:
                    print(f"Error extracting {word}: {e}")

    # Save the database
    with open("src/assets/docs/gsl-dictionary.json", "w") as jf:
        json.dump(dictionary_data, jf, indent=2)
    print(f"Successfully indexed {len(dictionary_data)} signs!")

except Exception as e:
    print(f"Error: {e}")
