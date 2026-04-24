import json
import os

overrides = {
    "languages": {
        "en": "Text"
    },
    "signedLanguagesShort": {
        "ase": "Ghana 🇬🇭",
        "hps": "Ghana 🇬🇭",
        "mre": "Ghana 🇬🇭",
        "psd": "Ghana 🇬🇭",
        "lsv": "Ghana 🇬🇭",
        "yds": "Ghana 🇬🇭"
    },
    "signedLanguages": {
        "ase": "Ghana Sign Language 🇬🇭",
        "hps": "Ghana Sign Language 🇬🇭",
        "mre": "Ghana Sign Language 🇬🇭",
        "psd": "Ghana Sign Language 🇬🇭",
        "lsv": "Ghana Sign Language 🇬🇭",
        "yds": "Ghana Sign Language 🇬🇭"
    }
}

directory = '.'
for filename in os.listdir(directory):
    if filename.endswith('.json'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error decoding {filename}")
                continue
        
        # Merge overrides
        data.update(overrides)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {filename}")
