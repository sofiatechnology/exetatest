import requests
from bs4 import BeautifulSoup
import json
import re
import os
import time

def extract_subject_from_url(url):
    """Extract subject from URL"""
    match = re.search(r'/exetats/\d+/([^/]+)/', url)
    return match.group(1) if match else "unknown"

def clean_subject_name(subject):
    """Clean subject name for filename"""
    return subject.replace('-', '_')

def extract_science_questions(url):
    """
    Extract all questions and their options from science URL
    Science format: Question with multiple choice options (A, B, C, D, E)
    """
    print(f"\n{'='*60}")
    print(f"PROCESSING: {url}")
    print(f"{'='*60}\n")
    
    # Extract subject from URL
    subject = extract_subject_from_url(url)
    subject_clean = clean_subject_name(subject)
    
    # Set headers to prevent blocking
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"HTTP Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Failed to fetch URL: {url} (Status: {response.status_code})")
            return None
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # --- Extract Session Information ---
        session_elem = soup.select_one(".page-heo_description")
        session_text = session_elem.get_text(strip=True) if session_elem else f"{subject.upper()} (Session : 2018)"
        session_match = re.search(r'Session\s*:\s*(\d{4})', session_text)
        session_year = session_match.group(1) if session_match else "2018"
        
        print(f"Subject: {subject.upper()}")
        print(f"Session: {session_year}")
        
        # --- Extract All Questions ---
        all_questions = []
        
        # Find all question blocks
        question_blocks = soup.select("div.my-3")
        
        for block in question_blocks:
            # Get question title
            title_elem = block.select_one("h3")
            if not title_elem:
                continue
            
            title_text = title_elem.get_text(strip=True)
            
            # Extract question number from title (e.g., "question 1")
            question_num_match = re.search(r'question\s*(\d+)', title_text, re.IGNORECASE)
            q_number = int(question_num_match.group(1)) if question_num_match else None
            
            # Extract question text - look for p tags within div
            question_text = ""
            question_div = block.select_one("div")
            if question_div:
                # Get all p tags within this div but not inside ul
                for p in question_div.find_all('p', recursive=False):
                    text = p.get_text(strip=True)
                    if text:
                        question_text += text + " "
                # If no p tags found, try getting text directly
                if not question_text:
                    # Get text from div but exclude ul content
                    for element in question_div.find_all(recursive=False):
                        if element.name != 'ul':
                            text = element.get_text(strip=True)
                            if text:
                                question_text += text + " "
            
            question_text = question_text.strip()
            
            # Extract options
            options = {}
            option_items = block.select("ul.exetat-assertions li.list__item")
            if not option_items:
                # Try alternative selector
                option_items = block.select("ul.list.exetat-assertions li")
            
            for item in option_items:
                # Try to find assertion class
                key_elem = item.select_one(".assertion")
                val_elem = item.select_one(".assertion-content")
                
                if key_elem and val_elem:
                    key = key_elem.get_text(strip=True)
                    value = val_elem.get_text(strip=True)
                    options[key] = value
                else:
                    # Fallback: extract from raw text
                    text = item.get_text(strip=True)
                    if text:
                        # Try to match pattern like "A. Some text"
                        match = re.match(r'([A-E])\.\s*(.*)', text)
                        if match:
                            key = match.group(1)
                            value = match.group(2)
                            options[key] = value
                        else:
                            # If no letter pattern, use index
                            pass
            
            # Only add if we have a question text
            if question_text or options:
                all_questions.append({
                    "number": q_number,
                    "title": title_text,
                    "question": question_text,
                    "options": options
                })
        
        # --- Create structured data ---
        structured_data = {
            "subject": subject,
            "session": session_year,
            "url": url,
            "total_questions": len(all_questions),
            "questions": all_questions
        }
        
        # --- Save files ---
        # Create folder
        folder_name = f"science_{subject_clean}" if subject_clean != "science" else "science"
        if not os.path.exists(folder_name):
            os.makedirs(folder_name)
        
        # 1. Save complete data as JSON
        json_filename = os.path.join(folder_name, f"{subject_clean}_questions.json")
        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)
        
        # 2. Save as readable text with all questions and options
        txt_filename = os.path.join(folder_name, f"{subject_clean}_all_questions.txt")
        with open(txt_filename, "w", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write(f"{subject.upper()} - Session {session_year}\n")
            f.write(f"URL: {url}\n")
            f.write("=" * 80 + "\n\n")
            
            if all_questions:
                f.write(f"TOTAL QUESTIONS: {len(all_questions)}\n\n")
                
                for q in all_questions:
                    f.write(f"QUESTION {q['number'] if q['number'] else '?'}\n")
                    f.write("-" * 50 + "\n")
                    f.write(f"{q['question']}\n\n")
                    
                    if q['options']:
                        f.write("Options:\n")
                        for key, value in q['options'].items():
                            f.write(f"  {key}. {value}\n")
                    else:
                        f.write("  (No options available)\n")
                    
                    f.write("\n" + "-" * 50 + "\n\n")
        
        # 3. Save as CSV-like format for easy import
        csv_filename = os.path.join(folder_name, f"{subject_clean}_questions.csv")
        with open(csv_filename, "w", encoding="utf-8") as f:
            # Write header
            f.write("Question_Number,Question,Option_A,Option_B,Option_C,Option_D,Option_E\n")
            
            for q in all_questions:
                q_num = q['number'] if q['number'] else ""
                q_text = q['question'].replace(',', ';').replace('\n', ' ')
                options = q['options']
                
                # Get options in order A, B, C, D, E
                opt_a = options.get('A', '').replace(',', ';')
                opt_b = options.get('B', '').replace(',', ';')
                opt_c = options.get('C', '').replace(',', ';')
                opt_d = options.get('D', '').replace(',', ';')
                opt_e = options.get('E', '').replace(',', ';')
                
                f.write(f"{q_num},\"{q_text}\",\"{opt_a}\",\"{opt_b}\",\"{opt_c}\",\"{opt_d}\",\"{opt_e}\"\n")
        
        # 4. Save as simple Q&A format
        simple_filename = os.path.join(folder_name, f"{subject_clean}_simple.txt")
        with open(simple_filename, "w", encoding="utf-8") as f:
            for q in all_questions:
                f.write(f"Q{q['number'] if q['number'] else '?'}: {q['question']}\n")
                for key, value in q['options'].items():
                    f.write(f"  {key}) {value}\n")
                f.write("\n")
        
        print(f"\n✅ Successfully processed: {subject.upper()}")
        print(f"   - Extracted {len(all_questions)} questions")
        print(f"   - Files saved in folder: {folder_name}/")
        print(f"   - Files created:")
        print(f"     • {subject_clean}_questions.json (JSON format)")
        print(f"     • {subject_clean}_all_questions.txt (Readable format)")
        print(f"     • {subject_clean}_questions.csv (CSV format)")
        print(f"     • {subject_clean}_simple.txt (Simple Q&A format)")
        
        return structured_data
        
    except Exception as e:
        print(f"❌ Error processing {url}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def batch_process_science_urls():
    """Process all science-related URLs"""
    
    # Define all science URLs to process
    urls_to_process = [
        "https://www.schoolap.com/exetats/488/science/physique",
        # "https://www.schoolap.com/exetats/167/science/biologie-physique",
        # "https://www.schoolap.com/exetats/489/science/science",
        # "https://www.schoolap.com/exetats/397/science/mathematique",
        # "https://www.schoolap.com/exetats/490/science/science"
    ]
    
    print("\n" + "=" * 80)
    print("SCIENCE QUESTIONS EXTRACTION")
    print("=" * 80)
    print(f"Total URLs to process: {len(urls_to_process)}")
    
    all_results = []
    
    for i, url in enumerate(urls_to_process, 1):
        print(f"\n[{i}/{len(urls_to_process)}] Processing: {url}")
        result = extract_science_questions(url)
        if result:
            all_results.append(result)
        
        # Add delay between requests
        if i < len(urls_to_process):
            print("Waiting 2 seconds before next request...")
            time.sleep(2)
    
    # Print summary
    print("\n\n" + "=" * 80)
    print("EXTRACTION COMPLETE")
    print("=" * 80)
    print(f"Total URLs processed: {len(urls_to_process)}")
    print(f"Successfully processed: {len(all_results)}")
    print(f"Failed: {len(urls_to_process) - len(all_results)}")
    
    if all_results:
        print("\n" + "-" * 40)
        print("SUMMARY:")
        print("-" * 40)
        for result in all_results:
            print(f"  ✅ {result['subject'].upper()} (Session {result['session']})")
            print(f"     - {result['total_questions']} questions extracted")
            print(f"     - Folder: science_{clean_subject_name(result['subject'])}/")
    
    print("\n" + "=" * 80)

# --- Run the script ---
if __name__ == "__main__":
    # Process all science URLs
    batch_process_science_urls()
    
    # OR process a single URL (uncomment to use)
    # single_url = "https://www.schoolap.com/exetats/167/science/biologie-physique"
    # result = extract_science_questions(single_url)