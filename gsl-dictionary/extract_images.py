import pdfplumber
import os

pdf_path = "src/assets/docs/Ghanaian Sign Language Dictionary - 3rd Edition.pdf"
output_dir = "src/assets/docs/signs"
os.makedirs(output_dir, exist_ok=True)

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        # Look for "HELLO", "GHANA", "THANK"
        targets = ["HELLO", "GHANA", "THANK"]
        found = {}
        
        for i in range(15, 200): # Scan a good chunk
            if len(found) == len(targets): break
            page = pdf.pages[i]
            text = (page.extract_text() or "").upper()
            
            for t in targets:
                if t not in found and t in text:
                    print(f"Found {t} on page {i}")
                    if page.images:
                        # Grab the first image on the page
                        img = page.images[0]
                        bbox = (img["x0"], img["top"], img["x1"], img["bottom"])
                        cropped = page.crop(bbox).to_image(resolution=200)
                        fname = f"{t.lower()}_sign.png"
                        cropped.save(f"{output_dir}/{fname}")
                        found[t] = fname
                        print(f"Saved {fname}")
except Exception as e:
    print(f"Error: {e}")
