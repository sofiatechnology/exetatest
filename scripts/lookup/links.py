import requests
from bs4 import BeautifulSoup
import json
import re

def extract_exam_links_from_page(url):
    """
    Extract all exam links from a Schoolap exetat listing page
    
    Args:
        url (str): The URL of the listing page
        
    Returns:
        list: Array of exam links
    """
    
    # Set headers to prevent blocking
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"HTTP Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Failed to fetch URL: {url}")
            return []
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find all exam links
        # Look for all <a> tags within card items
        exam_links = []
        
        # Method 1: Find all card items and extract links
        card_items = soup.select(".s-card-item")
        
        for card in card_items:
            # Find the link within the card
            link_tag = card.select_one("a[href*='/exetats/']")
            if link_tag and link_tag.get('href'):
                href = link_tag.get('href')
                # Make sure it's a full URL
                if href.startswith('/'):
                    full_url = f"https://www.schoolap.com{href}"
                    exam_links.append(full_url)
                elif href.startswith('http'):
                    exam_links.append(href)
        
        # Method 2: If the above doesn't find any, look for all links with /exetats/
        if not exam_links:
            all_links = soup.find_all('a', href=True)
            for link in all_links:
                href = link.get('href')
                if '/exetats/' in href and href != url:
                    if href.startswith('/'):
                        full_url = f"https://www.schoolap.com{href}"
                        if full_url not in exam_links:
                            exam_links.append(full_url)
                    elif href.startswith('http'):
                        if href not in exam_links:
                            exam_links.append(href)
        
        # Filter out duplicate links and pagination links
        exam_links = list(set(exam_links))
        
        # Filter out links that are likely listing pages or non-exam pages
        exam_links = [link for link in exam_links if '/exetats/' in link and 'filter' not in link]
        
        print(f"Found {len(exam_links)} exam links")
        
        return exam_links
        
    except Exception as e:
        print(f"Error extracting links: {str(e)}")
        return []

def extract_subject_from_url(url):
    """Extract subject from URL for naming"""
    match = re.search(r'/exetats/(?:[^/]+/)?([^/?]+)', url)
    return match.group(1) if match else "unknown"

def process_listing_page(url, save_to_file=False):
    """
    Process a listing page and return the exam links
    
    Args:
        url (str): The listing page URL
        save_to_file (bool): Whether to save the links to a file
        
    Returns:
        list: Array of exam links
    """
    
    exam_links = extract_exam_links_from_page(url)
    
    if not exam_links:
        print("No links found")
        return []
    
    # Print the links
    print("\n" + "=" * 60)
    print("EXAM LINKS EXTRACTED:")
    print("=" * 60)
    for i, link in enumerate(exam_links, 1):
        print(f"{i}. {link}")
    
    # Save to file if requested
    if save_to_file:
        subject = extract_subject_from_url(url)
        filename = f"{subject}_exam_links.txt"
        
        with open(filename, "w", encoding="utf-8") as f:
            for link in exam_links:
                f.write(f"{link}\n")
        
        print(f"\n✅ Links saved to {filename}")
    
    # Also save as JSON
    json_filename = f"exam_links.json"
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump(exam_links, f, indent=2, ensure_ascii=False)
    print(f"✅ Links saved to {json_filename}")
    
    return exam_links

# --- Example Usage ---
if __name__ == "__main__":
    # Example: Extract links from the SCIENCE page
    url = "https://www.schoolap.com/exetats/filter?q=&branch=2&option=7"
    
    # Process the page and get the links
    links = process_listing_page(url, save_to_file=True)
    
    # You can also use the links directly in your script
    print(f"\nTotal links extracted: {len(links)}")
    
    # Example of how to use the links array
    if links:
        print("\nFirst 5 links:")
        for link in links[:5]:
            print(f"  - {link}")
        
        # You can now pass these links to your previous scraper
        # from your_exam_scraper import process_urls
        # process_urls(links)