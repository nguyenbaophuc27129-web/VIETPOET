"""
Viet-Poet-Alyzer Vector Database Builder
Build ChromaDB from JSON data using Vietnamese-SBERT embeddings
"""
import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# Configuration
DATA_DIR = Path("../../data")
CHROMA_DIR = Path("./chroma_db")
COLLECTION_NAME = "viet_poetry_knowledge"

# Load Vietnamese SBERT model (use publicly available model)
print("Loading multilingual SBERT model...")
model = SentenceTransformer('distiluse-base-multilingual-cased-v2')

# Initialize ChromaDB
print("Initializing ChromaDB...")
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"description": "Vietnamese Poetry Knowledge Base"}
)

# Process all JSON files
all_docs = []
doc_ids = []
embeddings = []

json_files = sorted(DATA_DIR.glob("*.json"))
print(f"Found {len(json_files)} JSON files")

for json_file in json_files:
    print(f"Processing {json_file.name}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add general knowledge
    doc_id = data['document_id']
    general_text = data['general_knowledge']['author_and_work']
    all_docs.append(general_text)
    doc_ids.append(f"{doc_id}_general")

    # Add detailed analysis sections
    for section in data['detailed_analysis']:
        section_name = section['section_name']
        original_text = '\n'.join(section['original_text'])

        # Combine section info
        section_text = f"Section: {section_name}\nOriginal text:\n{original_text}\n"

        # Add X-Ray data
        if section.get('x_ray_data'):
            section_text += "\nX-Ray Analysis:\n"
            for xray in section['x_ray_data']:
                section_text += f"- {xray['target_words']}: {xray['art_type']} - {xray['effect']}\n"

        # Add outline
        if section.get('section_outline'):
            section_text += "\nOutline:\n"
            for point in section['section_outline']:
                section_text += f"- {point['point']}: {point.get('conclusion', '')}\n"

        all_docs.append(section_text)
        doc_ids.append(f"{doc_id}_{section_name.lower().replace(' ', '_')}")

print(f"Total documents: {len(all_docs)}")

# Generate embeddings
print("Generating embeddings...")
embeddings = model.encode(all_docs, show_progress_bar=True)

# Add to ChromaDB
print("Adding to ChromaDB...")
collection.add(
    embeddings=embeddings.tolist(),
    documents=all_docs,
    ids=doc_ids,
    metadatas=[{"source": f"{i}"} for i in range(len(doc_ids))]
)

print(f"✓ ChromaDB built with {collection.count()} documents")
print(f"✓ Database saved to: {CHROMA_DIR.absolute()}")

# Test query
print("\nTesting query...")
test_results = collection.query(
    query_texts=model.encode(["thơ hai-cư Ba-sô"]).tolist(),
    n_results=2
)
print(f"Test query returned {len(test_results['documents'][0])} results")